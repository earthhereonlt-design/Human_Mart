import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { MarketListing, Person, Review } from "@/lib/types";
import { expandQuery } from "@/lib/search";

export type SortKey = "newest" | "price-asc" | "price-desc" | "rating";

interface ListOptions {
  q?: string;
  category?: string;
  sort?: SortKey;
  limit?: number;
}

/**
 * All marketplace reads go through here. Returns empty results (never throws)
 * when Supabase isn't configured yet — pages render their setup notices.
 */
export async function getListings(opts: ListOptions = {}): Promise<MarketListing[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    let rows: MarketListing[] = [];

    if (opts.q && opts.q.trim()) {
      const terms = expandQuery(opts.q);
      const { data, error } = await supabase.rpc("search_listings", { terms });
      if (error) throw new Error(error.message);
      rows = (data ?? []) as MarketListing[];
    } else {
      let query = supabase
        .from("market_listings")
        .select("*")
        .eq("is_active", true);
      if (opts.category) query = query.eq("category", opts.category);
      switch (opts.sort) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          query = query.order("avg_rating", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      const { data, error } = await query.limit(opts.limit ?? 60);
      if (error) throw new Error(error.message);
      rows = (data ?? []) as MarketListing[];
    }

    if (opts.category) rows = rows.filter((r) => r.category === opts.category);
    return rows.slice(0, opts.limit ?? 60);
  } catch (err) {
    console.error("getListings:", err);
    return opts.q ? await fallbackKeywordSearch(opts) : [];
  }
}

async function fallbackKeywordSearch(opts: ListOptions): Promise<MarketListing[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("market_listings")
      .select("*")
      .eq("is_active", true)
      .ilike("title", `%${opts.q}%`)
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 60);
    return (data ?? []) as MarketListing[];
  } catch {
    return [];
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getListing(idOrSlug: string): Promise<MarketListing | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    // pretty URLs use slugs (/listing/ansh); legacy links still carry UUIDs
    const { data, error } = await supabase
      .from("market_listings")
      .select("*")
      .eq(UUID_RE.test(idOrSlug) ? "id" : "slug", idOrSlug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as MarketListing) ?? null;
  } catch (err) {
    console.error("getListing:", err);
    return null;
  }
}

export async function getPersonBySlug(slug: string): Promise<Person | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Person) ?? null;
  } catch (err) {
    console.error("getPersonBySlug:", err);
    return null;
  }
}

export async function getPersonListings(personId: string): Promise<MarketListing[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("market_listings")
      .select("*")
      .eq("person_id", personId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketListing[];
  } catch (err) {
    console.error("getPersonListings:", err);
    return [];
  }
}

export async function getRelatedListings(
  listing: MarketListing,
  limit = 4
): Promise<MarketListing[]> {
  const rows = await getListings({ category: listing.category, limit: limit + 4 });
  return rows.filter((r) => r.id !== listing.id).slice(0, limit);
}

export interface ReviewWithAuthor extends Review {
  author_name: string;
}

export async function getReviews(listingId: string): Promise<ReviewWithAuthor[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("id, listing_id, author_id, rating, body, created_at, author:profiles!reviews_author_id_fkey(display_name)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<
      Omit<ReviewWithAuthor, "author_name"> & {
        author: { display_name: string } | null;
      }
    >).map((r) => ({ ...r, author_name: r.author?.display_name ?? "Anonymous" }));
  } catch (err) {
    console.error("getReviews:", err);
    return [];
  }
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("market_listings")
      .select("category")
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { category: string }[]) {
      counts[row.category] = (counts[row.category] ?? 0) + 1;
    }
    return counts;
  } catch (err) {
    console.error("getCategoryCounts:", err);
    return {};
  }
}

export async function getMarketStats(): Promise<{ listings: number; people: number }> {
  if (!isSupabaseConfigured()) return { listings: 0, people: 0 };
  try {
    const supabase = await createClient();
    const [l, p] = await Promise.all([
      supabase
        .from("market_listings")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("people").select("id", { count: "exact", head: true }),
    ]);
    return {
      listings: l.count ?? 0,
      people: p.count ?? 0,
    };
  } catch {
    return { listings: 0, people: 0 };
  }
}
