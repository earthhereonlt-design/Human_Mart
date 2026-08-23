"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ShoppingBag, Zap } from "lucide-react";
import type { MarketListing } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { Button } from "@/components/ui/Button";
import { Sfx } from "@/components/manga/Sfx";

/** One in-flight item: from the button's center to the cart icon's center. */
type Flight = { x0: number; y0: number; x1: number; y1: number; photo: string | null };

export function AddToCart({ listing }: { listing: MarketListing }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [burst, setBurst] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const add = useCart((s) => s.add);

  const toLine = () => ({
    listingId: listing.id,
    title: listing.title,
    unit: listing.unit,
    price: listing.price,
    personName: listing.person_name,
    personSlug: listing.person_slug,
    photoUrl: listing.person_photo_url,
  });

  const launchFlight = () => {
    if (reduce) return;
    const from = wrapRef.current?.getBoundingClientRect();
    const to = document
      .querySelector("[data-cart-icon]")
      ?.getBoundingClientRect();
    if (!from || !to) return;
    setFlight({
      x0: from.left + from.width / 2 - 28,
      y0: from.top + from.height / 2 - 28,
      x1: to.left + to.width / 2 - 28,
      y1: to.top + to.height / 2 - 28,
      photo: listing.person_photo_url,
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <QtyStepper value={qty} onChange={setQty} unit={listing.unit} />
      <div ref={wrapRef} className="relative flex-1">
        <Sfx text="カシャッ!" burstKey={burst} />
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            add(toLine(), qty);
            setAdded(true);
            setBurst((k) => k + 1);
            launchFlight();
            setTimeout(() => setAdded(false), 1800);
          }}
        >
          {added ? (
            <>
              <Check size={15} /> Added to cart
            </>
          ) : (
            <>
              <ShoppingBag size={15} /> Add to cart
            </>
          )}
        </Button>
      </div>

      {/* the item arcs across the screen into the cart */}
      {flight && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[70]"
          initial={{ x: flight.x0, y: flight.y0, scale: 1 }}
          animate={{
            x: [flight.x0, (flight.x0 + flight.x1) / 2, flight.x1],
            y: [flight.y0, Math.min(flight.y0, flight.y1) - 140, flight.y1],
            scale: [1, 0.9, 0.22],
            opacity: [1, 1, 0.85],
          }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], times: [0, 0.55, 1] }}
          onAnimationComplete={() => setFlight(null)}
          aria-hidden="true"
        >
          {flight.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flight.photo}
              alt=""
              className="img-editorial h-14 w-14 border-2 border-ink object-cover shadow-[3px_3px_0_var(--color-ink)]"
            />
          ) : (
            <span className="jp grid h-14 w-14 place-items-center border-2 border-ink bg-clay text-2xl text-[#fbf8ee] shadow-[3px_3px_0_var(--color-ink)]">
              人
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function BuyNow({ listing }: { listing: MarketListing }) {
  const router = useRouter();
  const add = useCart((s) => s.add);

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full"
      onClick={() => {
        add({
          listingId: listing.id,
          title: listing.title,
          unit: listing.unit,
          price: listing.price,
          personName: listing.person_name,
          personSlug: listing.person_slug,
          photoUrl: listing.person_photo_url,
        });
        router.push("/checkout");
      }}
    >
      <Zap size={15} /> Buy now
    </Button>
  );
}

/** Fly-in confirmation when an item lands in the cart */
export function CartToast() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-cream shadow-lg"
    >
      Added to cart
    </motion.div>
  );
}
