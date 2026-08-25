import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPersonBySlug, getPersonListings } from "@/lib/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { initials, formatDate } from "@/lib/utils";
import { ListingGrid } from "@/components/listing/ListingCard";
import { PersonUrl } from "@/components/person/PersonUrl";
import { PersonEditButton } from "@/components/person/PersonEditButton";
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

  // who's looking? decides whether the edit affordance shows at all.
  // the page is already force-dynamic, so this costs nothing extra.
  let canEdit = false;
  let isAdmin = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: me } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(me?.is_admin);
      canEdit =
        isAdmin || person.created_by === user.id || person.claimed_by === user.id;
    }
  }

  return (
    <div className="container-page py-8 md:py-14">
      <ChapterMark jp="人物ファイル" className="mb-6" />

      {/* header */}
      <div className="grid gap-10 border-b border-sand pb-12 md:grid-cols-[240px_1fr] md:gap-14">
        {/* capped below md, where the grid is still a single column and this
            portrait would otherwise be 688px wide and 860px tall */}
        <div className="w-full max-w-[420px] border border-sand bg-parchment md:max-w-none">
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
                <span className="headline text-initial text-stone">{initials(person.name)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">In stock since {formatDate(person.created_at)}</span>
            {person.claimed_by && (
              <span className="border border-sage/40 bg-sage/10 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-sage">
                Claimed · This is them
              </span>
            )}
          </div>

          <h1 className="headline mt-4 break-words text-h1">{person.name}</h1>

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

          <div className="mt-6 flex flex-wrap items-center gap-5">
            {!person.claimed_by && (
              <span className="text-[11px] italic text-ink-faint">
                This is you? Claiming arrives soon — for now, bask.
              </span>
            )}
            {canEdit && (
              <PersonEditButton
                person={{
                  id: person.id,
                  name: person.name,
                  slug: person.slug,
                  bio: person.bio,
                  photo_url: person.photo_url,
                }}
                isAdmin={isAdmin}
              />
            )}
            <ReportDialog personId={person.id} />
          </div>
        </div>
      </div>

      {/* offerings */}
      <section className="mt-14">
        <h2 className="headline text-h2">Offerings</h2>
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
