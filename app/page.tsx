import { Marquee } from "@/components/landing/Marquee";
import { Hero } from "@/components/landing/Hero";
import { CreatureScene } from "@/components/creatures/CreatureScene";
import { Reveal, StaggerList, StaggerItem } from "@/components/manga/Reveal";
import { SplitTitle } from "@/components/manga/SplitTitle";
import { ListingGrid } from "@/components/listing/ListingCard";
import { getListings, getMarketStats } from "@/lib/queries";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Human Mart — A premium marketplace for human talents",
};

export default async function LandingPage() {
  const [{ listings, people }, latest] = await Promise.all([
    getMarketStats(),
    getListings({ limit: 4 }),
  ]);

  return (
    <>
      {/* hero — the volume cover */}
      <Hero people={people} listings={listings} />

      <Marquee />

      {/* how it works — chapter of panels */}
      <section id="how" className="container-page scroll-mt-24 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-[1fr_1.6fr] md:gap-20">
          <Reveal variant="3d">
            <div>
              <span className="stamp">しくみ</span>
              <h2 className="headline mt-5 text-3xl md:text-4xl">
                <SplitTitle text="Commerce, performed with a straight face." />
              </h2>
              <p className="hand mt-4 text-lg text-ink-mute">— "how this works," in 3 panels</p>
              <CreatureScene
                mood="waiting"
                caption="Aadi — The Founder"
                className="mt-8 max-w-72"
              />
            </div>
          </Reveal>

          <StaggerList className="flex flex-col">
            {[
              {
                n: "01",
                t: "List a human",
                d: "Name a person, price their gift, choose the unit — an hour, a cup, a single match. Anyone can be listed. Including you.",
              },
              {
                n: "02",
                t: "Browse the aisles",
                d: "Search by skill, category, or a vague feeling. Every person comes with a rating, a price, and their finest photograph.",
              },
              {
                n: "03",
                t: "Checkout, gracefully",
                d: "Address, discounts, payment — the full ceremony. Entirely simulated. The human, mercifully, stays where they are.",
              },
            ].map((s, i, arr) => (
              <StaggerItem
                key={s.n}
                variant={i % 2 === 0 ? "left" : "right"}
                className={`flex gap-6 py-8 md:gap-10 md:py-10 ${i < arr.length - 1 ? "border-b-2 border-ink/15" : ""}`}
              >
                <span className="halftone-fine headline shrink-0 border-2 border-ink bg-cream px-2.5 py-1 text-2xl text-clay shadow-[3px_3px_0_var(--color-ink)] md:text-3xl">
                  {s.n}
                </span>
                <div>
                  <h3 className="headline text-xl md:text-2xl">{s.t}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-mute">{s.d}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      {/* featured humans (live data) */}
      <section className="relative border-t-[3px] border-ink bg-parchment py-20 md:py-28">
        <div className="hatch absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-page relative">
          <Reveal variant="3d">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="stamp">新着</span>
                <h2 className="headline mt-4 text-3xl md:text-4xl">
                  <SplitTitle text="Fresh stock" />
                </h2>
              </div>
              <Link
                href="/explore"
                className="link-editorial font-display text-[13px] uppercase tracking-[0.1em] text-ink-soft"
              >
                View all panels →
              </Link>
            </div>
          </Reveal>

          {latest.length > 0 ? (
            <div className="mt-12">
              <ListingGrid listings={latest} />
            </div>
          ) : (
            <div className="panel mt-12 p-8 text-center md:p-14">
              <p className="hand mx-auto max-w-lg text-lg leading-relaxed text-ink-mute">
                The shelves are empty — freshly painted, honestly swept, and
                waiting for their first human.
              </p>
              <p className="headline mt-4 text-2xl md:text-3xl">
                Be the first person in stock.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/list"
                  className="inline-flex h-12 items-center border-2 border-ink bg-clay px-8 font-display text-[13px] uppercase tracking-[0.1em] text-cream shadow-[4px_4px_0_var(--color-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  List the first human
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
