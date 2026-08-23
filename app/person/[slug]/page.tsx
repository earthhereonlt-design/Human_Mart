import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPersonBySlug, getPersonListings } from "@/lib/queries";
import { initials, formatDate } from "@/lib/utils";
import { ListingGrid } from "@/components/listing/ListingCard";
import { PersonUrl } from "@/components/person/PersonUrl";
import { ReportDialog } from "@/components/listing/ReviewForm";
import { EmptyState } from "@/components/states/EmptyState";
import { ChapterMark } from "@/components/manga/ChapterCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);
  if (!person) return { title: "Person not found" };
  return {
    title: `${person.name} — in stock`,
    description:
      person.bio ?? `${person.name}, listed on Human Mart. One human, many offerings.`,
  };
}

export default async function PersonPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);
  if (!person) notFound();

  const listings = await getPersonListings(person.id);

  return (
    <div className="container-page py-8 md:py-14">
      <ChapterMark jp="人物ファイル" className="mb-6" />

      {/* header */}
      <div className="grid gap-10 border-b border-sand pb-12 md:grid-cols-[240px_1fr] md:gap-14">
        <div className="border border-sand bg-parchment">
          <div className="aspect-[4/5] w-full">
            {person.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photo_url}
                alt={`Portrait of ${person.name}`}
                className="img-editorial h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <span className="headline text-6xl text-stone">{initials(person.name)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">In stock since {formatDate(person.created_at)}</span>
            {person.claimed_by && (
              <span className="border border-sage/40 bg-sage/10 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-sage">
                Claimed · This is them
              </span>
            )}
          </div>

          <h1 className="headline mt-4 text-4xl md:text-5xl">{person.name}</h1>

          {person.bio && (
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-mute">
              {person.bio}
            </p>
          )}

          <p className="mt-6 text-sm text-ink-mute">
            {listings.length} offering{listings.length === 1 ? "" : "s"} ·{" "}
            <Link href="/explore" className="link-editorial">compare with other humans</Link>
          </p>

          <div className="mt-6">
            <PersonUrl path={`/person/${person.slug}`} />
          </div>

          <div className="mt-6 flex items-center gap-5">
            {!person.claimed_by && (
              <span className="text-[11px] italic text-ink-faint">
                This is you? Claiming arrives soon — for now, bask.
              </span>
            )}
            <ReportDialog personId={person.id} />
          </div>
        </div>
      </div>

      {/* offerings */}
      <section className="mt-14">
        <h2 className="headline text-2xl md:text-3xl">Offerings</h2>
        <div className="mt-10">
          {listings.length > 0 ? (
            <ListingGrid listings={listings} />
          ) : (
            <EmptyState
              mood="curious"
              title="Between offerings"
              body={`${person.name} currently has nothing for sale. A rare and probably healthy condition.`}
              actionHref="/explore"
              actionLabel="Browse other humans"
            />
          )}
        </div>
      </section>
    </div>
  );
}
