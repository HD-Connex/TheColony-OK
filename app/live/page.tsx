import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isActiveMember } from "@/lib/entitlements";
import LiveClient from "./LiveClient";

export const revalidate = 60;

export const metadata = {
  title: "Watch Live",
  description:
    "Live broadcasts and replays from The Colony — Oklahoma news, live events, and the full archive. Streamed free and members-only.",
  alternates: { canonical: "/live" },
};

export default async function LivePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch user and membership status on the server
  const { data: user } = await supabase.auth.getUser();
  const isMember = user?.user ? await isActiveMember(user.user.id) : false;

  // Pass data to the client component
  return <LiveClient isMember={isMember} user={user?.user} />;
}