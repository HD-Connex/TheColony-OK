"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { createClient } from "@/utils/supabase/client";
import InnerPageShell from "../_components/InnerPageShell";
import ContinueRail from "../_components/ContinueRail";

export default function MyFeedPage() {
  const { user, isMember, loading } = useAuth();
  const [counties, setCounties] = useState<string[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email || !isMember) return;
    const load = async () => {
      try {
        const ssr = createClient();
        const { data: session } = await ssr.auth.getSession();
        const token = session?.session?.access_token;
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // Load counties from newsletter prefs
        const prefsRes = await fetch("/api/newsletter/subscribe", { headers });
        if (prefsRes.ok) {
          const j = await prefsRes.json();
          const userCounties = Array.isArray(j.counties) ? j.counties : [];
          setCounties(userCounties);

          if (userCounties.length > 0) {
            // Fetch articles for those counties (simple, could be server but client for demo)
            const artsRes = await fetch(`/api/admin/articles?limit=10`); // placeholder, in real use public get with county
            // For demo, assume we filter client or use a public endpoint; here simulate
            // Better: since no direct, use getArticles but since client, fetch from a new or use existing pattern.
            // For this, we'll fetch recent and filter, or assume /stories with county but to keep simple.
            const allArtsRes = await fetch("/api/admin/articles?limit=20"); // reuse admin for demo, or public
            if (allArtsRes.ok) {
              const all = await allArtsRes.json();
              const filtered = (all.articles || []).filter((a: any) => a.county && userCounties.includes(a.county));
              setArticles(filtered.slice(0, 10));
            }
          }
        }
      } catch (e) {
        setLoadError("Could not load feed.");
      }
    };
    load();
  }, [user?.email, isMember]);

  if (loading) return <div>Loading...</div>;

  if (!user || !isMember) {
    return (
      <InnerPageShell
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Feed" }]}
        eyebrow="▼ PERSONALIZED"
        title="My Feed"
        lede="Members only."
      >
        <p>Please sign in as member.</p>
      </InnerPageShell>
    );
  }

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "My Feed" }]}
      eyebrow="▼ PERSONALIZED"
      title="My Feed"
      lede="Stories from your counties + recent activity."
    >
      <div className="container">
        <ContinueRail />

        {counties.length > 0 && (
          <section>
            <h2>Your Counties: {counties.join(", ")}</h2>
            {articles.length === 0 ? <p>No recent stories in your counties.</p> : (
              <div className="grid-3">
                {articles.map((a) => (
                  <div key={a.id} className="card">
                    <h3><Link href={`/stories/${a.slug}`}>{a.title}</Link></h3>
                    <p>{a.dek}</p>
                    {a.county && <small>{a.county} County</small>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {counties.length === 0 && (
          <p>Set your counties in <Link href="/my-counties">My Counties</Link> to see personalized feed.</p>
        )}
      </div>
    </InnerPageShell>
  );
}
