"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { MarketListing } from "@/lib/types";
import { formatINR, initials } from "@/lib/utils";
import { Stars } from "@/components/ui/Stars";
import { Tilt } from "@/components/manga/Tilt";
import { cn } from "@/lib/utils";

/** Manga panel card — ink border, screentone, red price tag.
 *  `wide` renders the landscape spread panel used in the grid rhythm. */
export function ListingCard({
  listing,
  index = 0,
  wide = false,
}: {
  listing: MarketListing;
  index?: number;
  wide?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index, 7) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Tilt className="h-full">
        <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative border-[3px] border-ink bg-cream shadow-[5px_5px_0_var(--color-ink)] transition-all duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_var(--color-ink)]">
          <motion.div
            className={cn("w-full overflow-hidden", wide ? "aspect-[16/10]" : "aspect-[3/4]")}
            initial={{ clipPath: "inset(12% 9% 12% 9%)", opacity: 0.5 }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {listing.person_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.person_photo_url}
                alt={`${listing.person_name}, who ${listing.title}`}
                loading="lazy"
                decoding="async"
                className="img-editorial h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            ) : (
              <div className="halftone grid h-full w-full place-items-center bg-parchment">
                <span className="headline text-6xl text-ink/70">{initials(listing.person_name)}</span>
              </div>
            )}
          </motion.div>
          {/* screentone over the art, like a printed panel */}
          <div className="halftone pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply" aria-hidden="true" />
          {/* speed-line flash on hover — impact frame */}
          <div className="speedflash pointer-events-none absolute inset-0 mix-blend-multiply" aria-hidden="true" />
          {listing.availability && (
            <span className="absolute left-2.5 top-2.5 -rotate-3 border-2 border-ink bg-clay px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#fbf8ee]">
              {listing.availability}
            </span>
          )}
          <span className="absolute bottom-2.5 right-2.5 grid h-8 w-8 translate-y-2 place-items-center border-2 border-ink bg-ink text-cream opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={14} strokeWidth={2} />
          </span>
        </div>

        <div className="pt-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            {listing.person_name}
          </p>
          <h3 className="headline mt-1.5 text-[15px] leading-snug md:text-base">
            {listing.title}
          </h3>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-sm tabular-nums">
              <span className="font-display text-clay">{formatINR(listing.price)}</span>
              <span className="text-ink-mute"> / {listing.unit}</span>
            </p>
            <Stars value={listing.avg_rating} count={listing.review_count} size={11} />
          </div>
        </div>
        </Link>
      </Tilt>
    </motion.article>
  );
}

export function ListingGrid({ listings }: { listings: MarketListing[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-7 lg:grid-cols-4">
      {listings.map((l, i) => {
        // every 5th panel is a wide spread — the page composes like manga, not a grid
        const wide = i % 5 === 2;
        return (
          <div key={l.id} className={wide ? "col-span-2" : undefined}>
            <ListingCard listing={l} index={i} wide={wide} />
          </div>
        );
      })}
    </div>
  );
}
