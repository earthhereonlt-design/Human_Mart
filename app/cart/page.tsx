"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useCart, computeTotals } from "@/lib/cart";
import { formatINR, initials } from "@/lib/utils";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { EmptyState } from "@/components/states/EmptyState";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { PageStepper } from "@/components/manga/PageStepper";
import { Chibi } from "@/components/manga/Mascot";
import { AnimatedNumber } from "@/components/manga/AnimatedNumber";
import { Suspense } from "react";

export default function CartPage() {
  return (
    <Suspense>
      <CartInner />
    </Suspense>
  );
}

function CartInner() {
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const totals = computeTotals(lines);

  return (
    <div className="container-page py-10 md:py-20">
      <ChapterCard jp="第3話" title="Your cart" sub="Checkout, step one of three" />
      <div className="mt-6">
        <PageStepper current={0} />
      </div>

      {lines.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            mood="lonely"
            caption="…it echoes"
            title="Your cart is empty"
            body="It echoes, slightly. Humans are waiting to be useful — go find one."
            actionHref="/explore"
            actionLabel="Back to the market"
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {/* lines */}
          <ul className="min-w-0 divide-y divide-sand border-y border-sand">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li
                  key={l.listingId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, overflow: "hidden" }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-5 py-6"
                >
                  <Link
                    href={`/listing/${l.listingId}`}
                    className="h-28 w-22 shrink-0 overflow-hidden border border-sand bg-parchment"
                  >
                    {l.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.photoUrl} alt="" loading="lazy" decoding="async" className="img-editorial h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center headline text-2xl text-stone">
                        {initials(l.personName)}
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
                          {l.personName}
                        </p>
                        <Link href={`/listing/${l.listingId}`} className="link-editorial headline break-words text-lg">
                          {l.title}
                        </Link>
                        <p className="mt-1 text-sm tabular-nums text-ink-mute">
                          {formatINR(l.price)} / {l.unit}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${l.title} from cart`}
                        onClick={() => remove(l.listingId)}
                        className="grid h-8 w-8 shrink-0 place-items-center text-ink-faint transition-colors hover:text-clay-deep"
                      >
                        <X size={15} strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* wraps — a long unit ("consultation") widens the stepper
                        past the room left beside the thumbnail on a phone */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <QtyStepper
                        value={l.qty}
                        onChange={(v) => setQty(l.listingId, v)}
                        unit={l.unit}
                      />
                      <p className="text-sm font-medium tabular-nums">
                        {formatINR(l.price * l.qty)}
                      </p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="mb-6 flex items-end gap-3">
              <Chibi mood="celebrate" className="h-24 w-auto shrink-0 md:h-28" />
              <p className="bubble max-w-44 px-4 py-3">
                <span className="hand text-base leading-snug text-ink-soft">
                  Excellent taste, customer-san!
                </span>
              </p>
            </div>
            <div className="border border-sand bg-cream p-6 md:p-8">
              <p className="eyebrow">Order summary</p>
              <dl className="mt-6 space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Subtotal</dt>
                  <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
                </div>
                {totals.humanTouch > 0 && (
                  <div className="flex justify-between text-sage">
                    <dt>Human touch discount (10%)</dt>
                    <dd className="tabular-nums">−{formatINR(totals.humanTouch)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Service fee (₹9 / item)</dt>
                  <dd className="tabular-nums">{formatINR(totals.serviceFee)}</dd>
                </div>
                <div className="flex justify-between text-ink-faint">
                  <dt>Shipping</dt>
                  <dd>₹0 — humans stay put</dd>
                </div>
                <div className="mt-4 flex justify-between border-t border-sand pt-4 text-base">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-medium tabular-nums">
                    <AnimatedNumber value={totals.total} />
                  </dd>
                </div>
              </dl>

              <Link
                href="/checkout"
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 border border-ink bg-ink text-[11px] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-night"
              >
                Proceed to address <ArrowRight size={14} />
              </Link>
              <Link
                href="/explore"
                className="mt-3 block text-center text-xs text-ink-mute link-editorial"
              >
                or keep browsing humans
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
