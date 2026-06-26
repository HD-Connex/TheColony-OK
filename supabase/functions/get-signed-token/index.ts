// Get Signed Playback Token Edge Function
// Generates short-lived JWTs for premium content playback.
// Called by the client before playing premium programs.
//
// Usage: POST /functions/v1/get-signed-token
// Body: { playback_id: string, expires_in?: string (default "2h") }
// Response: { token: string } | { error: string }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const MUX_SIGNING_KEY_ID = Deno.env.get("MUX_SIGNING_KEY_ID") ?? "";
const MUX_SIGNING_PRIVATE_KEY = Deno.env.get("MUX_SIGNING_PRIVATE_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EXPIRES_IN_DEFAULT = "2h";

interface TokenPayload {
  sub: string; // playback_id
  aud: "v"; // video
  exp: number;
  kid: string;
}

function b64url(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function generateSignedToken(playbackId: string, expiresIn: string): Promise<string> {
  const durationMap: Record<string, number> = {
    "30m": 1800,
    "1h": 3600,
    "2h": 7200,
    "6h": 21600,
    "12h": 43200,
    "24h": 86400,
  };
  const expSeconds = durationMap[expiresIn] ?? 7200;

  const header = { alg: "RS256", kid: MUX_SIGNING_KEY_ID, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: playbackId,
    aud: "v",
    exp: now + expSeconds,
    kid: MUX_SIGNING_KEY_ID,
  };

  const encHeader = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encHeader}.${encPayload}`;

  // Import the private key (PKCS#8 PEM)
  const pemKey = MUX_SIGNING_PRIVATE_KEY
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const keyData = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );

  const encSignature = b64url(signature);
  return `${signingInput}.${encSignature}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST" } });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the caller is authenticated
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = authHeader.replace("Bearer ", "");

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Parse request body
  let body: { playback_id?: string; expires_in?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!body.playback_id) {
    return new Response(JSON.stringify({ error: "playback_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Check if the user is a member (entitled to premium content)
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) {
    return new Response(JSON.stringify({ error: "Membership required for signed playback" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const token = await generateSignedToken(body.playback_id, body.expires_in ?? EXPIRES_IN_DEFAULT);
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Token generation failed: ${err}` }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
