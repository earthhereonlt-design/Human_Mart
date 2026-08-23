import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListing, getReviews, getRelatedListings } from "@/lib/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatINR, formatDate, initials } from "@/lib/utils";
import { Stars } from "@/components/ui/Stars";
import { AddToCart, BuyNow } from "@/components/listing/AddToCart";
import { ReviewForm, ReportDialog } from "@/components/listing/ReviewForm";
import { ListingGrid } from "@/components/listing/ListingCard";
import { ChapterMark } from "@/components/manga/ChapterCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.person_name} — ${listing.title}`,
    description: `${listing.person_name} · ${listing.title} · ${formatINR(listing.price)} / ${listing.unit}`,
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const [reviews, related, signedIn] = await Promise.all([
    getReviews(listing.id),
    getRelatedListings(listing),
    isSupabaseConfigured()
      ? createClient().then((s) =>
          s.auth.getUser().then(({ data }) => Boolean(data.user))
        )
      : Promise.resolve(false),
  ]);

  return (
    <div className="container-page py-12 md:py-16">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">
        <Link href="/explore" className="hover:text-ink">Market</Link>
        <span className="mx-2">/</span>
        <Link href={`/person/${listing.person_slug}`} className="hover:text-ink">
          {listing.person_name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-mute">{listing.category}</span>
      </nav>

      <ChapterMark jp="読切" className="mt-5" />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        {/* photo */}
        <div className="border border-sand bg-parchment">
          <div className="aspect-[4/5] w-full">
            {listing.person_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.person_photo_url}
                alt={`${listing.person_name}, who ${listing.title}`}
                className="img-editorial h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <span className="headline text-7xl text-stone">{initials(listing.person_name)}</span>
              </div>
            )}
          </div>
        </div>

        {/* details */}
        <div className="flex flex-col">
          <span className="eyebrow">{listing.category}</span>

          <h1 className="headline mt-3 text-3xl md:text-4xl">
            <Link href={`/person/${listing.person_slug}`} className="hover:text-clay transition-colors">
              {listing.person_name}
            </Link>
          </h1>
          <p className="mt-1.5 text-lg text-ink-soft">{listing.title}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Stars value={listing.avg_rating} count={listing.review_count} size={15} />
            {listing.person_claimed && (
              <span className="border border-sage/40 bg-sage/10 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-sage">
                Self-listed · Verified
              </span>
            )}
          </div>

          <div className="mt-7 border-y border-sand py-6">
            <p className="text-2xl tabular-nums md:text-[28px]">
              <span className="font-medium">{formatINR(listing.price)}</span>
              <span className="text-base text-ink-mute"> / {listing.unit}</span>
            </p>
            {listing.availability && (
              <p className="mt-2 text-sm text-ink-mute">
                Availability — <span className="text-ink-soft">{listing.availability}</span>
              </p>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <AddToCart listing={listing} />
            <BuyNow listing={listing} />
          </div>

          {listing.description && (
            <div className="mt-9">
              <p className="eyebrow">About this offering</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                {listing.description}
              </p>
            </div>
          )}

          {/* spec table */}
          <dl className="mt-9 divide-y divide-sand border-t border-sand text-sm">
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-ink-mute">Person</dt>
              <dd>
                <Link href={`/person/${listing.person_slug}`} className="link-editorial">
                  {listing.person_name}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-ink-mute">Category</dt>
              <dd>{listing.category}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-ink-mute">Unit</dt>
              <dd>per {listing.unit}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-ink-mute">Shelved</dt>
              <dd>{formatDate(listing.created_at)}</dd>
            </div>
            {listing.tags.length > 0 && (
              <div className="flex justify-between gap-6 py-3">
                <dt className="text-ink-mute">Tags</dt>
                <dd className="flex flex-wrap justify-end gap-1.5">
                  {listing.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/explore?q=${encodeURIComponent(t)}`}
                      className="border border-sand px-2 py-0.5 text-xs text-ink-mute transition-colors hover:border-stone hover:text-ink"
                    >
                      {t}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <ReportDialog listingId={listing.id} personId={listing.person_id} />
          </div>
        </div>
      </div>

      {/* reviews */}
      <section className="mt-20 border-t border-sand pt-14 md:mt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <span className="eyebrow">Word of mouth</span>
            <h2 className="headline mt-3 text-3xl">Reviews</h2>
            <p className="mt-3 text-sm text-ink-mute">
              {listing.review_count === 0
                ? "No reviews yet. History awaits its first witness."
                : `${listing.review_count} verified purchase${listing.review_count === 1 ? "" : "s"}*`}
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">*purchases are simulated; enthusiasm is real</p>
            <div className="mt-8">
              <ReviewForm listingId={listing.id} signedIn={signedIn} />
            </div>
          </div>

          <div className="divide-y divide-sand">
            {reviews.length === 0 ? (
              <p className="py-10 text-sm text-ink-faint">The review shelf is bare.</p>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="py-7">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">{r.author_name}</p>
                    <p className="text-xs text-ink-faint">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="mt-2">
                    <Stars value={r.rating} size={12} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-20 border-t border-sand pt-14 md:mt-28">
          <div className="flex items-end justify-between">
            <h2 className="headline text-3xl">You may also need</h2>
            <Link
              href={`/explore?category=${encodeURIComponent(listing.category)}`}
              className="link-editorial text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute"
            >
              More {listing.category}
            </Link>
          </div>
          <div className="mt-10">
            <ListingGrid listings={related} />
          </div>
        </section>
      )}
    </div>
  );
}
