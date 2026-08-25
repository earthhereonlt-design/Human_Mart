/**
 * TEMPORARY responsive verification harness — delete before committing.
 *
 * There is no .env.local, so getListings() returns [] and the real grids render
 * empty. This route mounts the actual ListingCard/ListingGrid/Stars/QtyStepper
 * with deliberately adversarial data so Playwright can measure them.
 */
"use client";

import type { MarketListing } from "@/lib/types";
import { ListingGrid } from "@/components/listing/ListingCard";
import { Stars } from "@/components/ui/Stars";
import { QtyStepper } from "@/components/ui/QtyStepper";

function fixture(over: Partial<MarketListing> & { id: string }): MarketListing {
  return {
    person_id: "p",
    title: "reads aloud",
    description: null,
    price: 1200,
    unit: "hour",
    category: "Company",
    tags: [],
    availability: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    person_name: "Aditya",
    person_slug: "aditya",
    person_photo_url: null,
    person_claimed: false,
    avg_rating: 4.8,
    review_count: 12,
    ...over,
  };
}

// worst cases: the 4-glyph まあまあ SFX label, a 3-digit review count, a long
// unit, and unbreakable words in both the title and the person's name
const LISTINGS: MarketListing[] = [
  fixture({ id: "1", avg_rating: 3.0, review_count: 999, unit: "consultation" }),
  fixture({ id: "2", title: "Antidisestablishmentarianism", unit: "kilometre" }),
  fixture({ id: "3", person_name: "Bartholomew Featherstonehaugh", avg_rating: 2.6 }),
  fixture({ id: "4", avg_rating: 0, review_count: 0, unit: "afternoon" }),
  fixture({ id: "5", avg_rating: 3.4, review_count: 128, unit: "conversation", availability: "Weekends only" }),
  fixture({ id: "6", avg_rating: 4.9, review_count: 7 }),
  fixture({ id: "7", avg_rating: 2.9, review_count: 44, unit: "appointment" }),
  fixture({ id: "8", avg_rating: 1.2, review_count: 3, unit: "attempt" }),
];

export default function ResponsiveProbe() {
  return (
    <div className="container-page py-10">
      <h1 className="headline text-h1">Responsive probe</h1>

      <h2 className="headline mt-10 text-h2">ListingGrid</h2>
      <div className="mt-6">
        <ListingGrid listings={LISTINGS} />
      </div>

      <h2 className="headline mt-16 text-h2">Stars in a 157px box</h2>
      <div className="mt-6 space-y-2">
        {[0, 1.2, 2.6, 3.4, 4.9].map((v) => (
          <div key={v} className="w-[157px] border border-clay">
            <Stars value={v} count={999} size={11} />
          </div>
        ))}
      </div>

      <h2 className="headline mt-16 text-h2">Cart row inner column (227px)</h2>
      <div className="mt-6 w-[227px] border border-clay">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <QtyStepper value={2} onChange={() => {}} unit="consultation" />
          <p className="text-sm font-medium tabular-nums">₹2,400</p>
        </div>
      </div>

      <h2 className="headline mt-16 text-h2">Fluid type ramp</h2>
      <p className="headline text-display">Display</p>
      <p className="headline text-h1">Heading one</p>
      <p className="headline text-h2">Heading two</p>
      <p className="headline text-h3">Heading three</p>
      <p className="headline text-initial">AB</p>
    </div>
  );
}
