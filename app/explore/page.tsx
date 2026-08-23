import { Suspense } from "react";
import type { Metadata } from "next";
import { getListings, getCategoryCounts, type SortKey } from "@/lib/queries";
import { CATEGORIES } from "@/lib/categories";
import { ListingGrid } from "@/components/listing/ListingCard";
import { EmptyState, SkeletonGrid } from "@/components/states/EmptyState";
import { SearchBar, CategoryChips, SortSelect } from "@/components/explore/Controls";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Explore the market" };
export const dynamic = "force-dynamic";

interface ExploreProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function ExplorePage({ searchParams }: ExploreProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const category = sp.category || undefined;
  const sort = (sp.sort as SortKey) || "newest";

  const [listings, counts] = await Promise.all([
    getListings({ q, category, sort }),
    getCategoryCounts(),
  ]);

  const hasAnyListing = Object.values(counts).some((c) => c > 0);
  const searching = Boolean(q);

  return (
    <div className="container-page relative py-14 md:py-20">
      {/* vertical side label */}
      <span
        className="jp-v absolute right-2 top-24 hidden text-sm text-ink-faint lg:block"
        aria-hidden="true"
      >
        すべてのスキル
      </span>

      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <ChapterCard
          jp="第2話"
          title={searching ? `\u201C${q}\u201D` : (category ?? "Everything, shelved")}
          sub="The aisles"
        />
        <p className="text-xs text-ink-faint">
          {listings.length} offering{listings.length === 1 ? "" : "s"} · prices in ₹
        </p>
      </div>

      {/* controls */}
      <div className="mt-10 flex flex-col gap-5">
        <Suspense fallback={<div className="h-13 border border-sand bg-cream" />}>
          <SearchBar />
        </Suspense>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Suspense fallback={null}>
            <CategoryChips categories={CATEGORIES} counts={counts} active={category} />
          </Suspense>
          <Suspense fallback={null}>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      {/* grid */}
      <div className="mt-12">
        {!isSupabaseConfigured() ? (
          <SetupNote />
        ) : hasAnyListing ? (
          listings.length > 0 ? (
            <ListingGrid listings={listings} />
          ) : (
            <EmptyState
              mood="curious"
              title="Nothing on this shelf"
              caption="hm? nothing here…"
              body={`We looked everywhere — even behind the chai. No results for “${q}”. Try a broader word, or be the change: list this exact talent.`}
              actionHref="/list"
              actionLabel="List it yourself"
            />
          )
        ) : (
          <EmptyState
            mood="lonely"
            title="The shelves are empty"
            caption="…so quiet"
            body="Human Mart just opened its doors. Nobody is in stock yet — which means the best spot on the shelf is still yours."
            actionHref="/list"
            actionLabel="Be the first human in stock"
          />
        )}
      </div>
    </div>
  );
}

function SetupNote() {
  return (
    <div className="border border-clay/30 bg-clay-tint/50 p-6 md:p-10">
      <p className="eyebrow !text-clay-deep">Back soon</p>
      <p className="headline mt-3 text-2xl">The shelves are being arranged.</p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
        The market is still setting up behind the curtain — stock arrives
        shortly. Meanwhile, do some window-shopping in your head: who&apos;s the
        first human you&apos;d put on a shelf?
      </p>
    </div>
  );
}
