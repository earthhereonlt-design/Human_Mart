import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { MarketListing, OrderRow, Profile } from "@/lib/types";
import { AccountTabs } from "@/components/account/AccountTabs";
import { ChapterMark } from "@/components/manga/ChapterCard";

export const metadata: Metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-page py-20">
        <h1 className="headline text-3xl">The ledger is still being bound.</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-mute">
          Accounts unlock when the market formally opens its doors. The
          shopkeeper is stamping the membership cards — check back soon.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [profileRes, listingsRes, ordersRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("market_listings")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile: Profile =
    (profileRes.data as Profile) ??
    {
      id: user.id,
      display_name: (user.user_metadata?.name as string) ?? "Human",
      email: user.email ?? null,
      avatar_url: null,
      created_at: user.created_at ?? new Date().toISOString(),
    };

  const myListings = (listingsRes.data ?? []) as MarketListing[];
  const orders = (ordersRes.data ?? []) as OrderRow[];

  return (
    <div className="container-page py-14 md:py-20">
      <ChapterMark jp="第7話" className="mb-6" />
      <span className="eyebrow">Signed in as {profile.email}</span>
      <h1 className="headline mt-3 text-4xl md:text-5xl">{profile.display_name}</h1>

      <div className="mt-12">
        <AccountTabs profile={profile} myListings={myListings} orders={orders} />
      </div>
    </div>
  );
}
