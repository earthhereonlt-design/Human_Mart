import Link from "next/link";
import type { Metadata } from "next";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { OrderRow } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { CreatureScene } from "@/components/creatures/CreatureScene";
import { ChapterCard } from "@/components/manga/ChapterCard";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let order: OrderRow | null = null;
  if (orderId && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      order = (data as OrderRow) ?? null;
    } catch {
      order = null;
    }
  }

  return (
    <div className="container-page flex justify-center py-16 md:py-24">
      <div className="w-full max-w-2xl">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.4fr]">
          <CreatureScene mood="celebrate" caption="A satisfied customer" className="max-w-64 md:max-w-none" />
          <div>
            <ChapterCard
              jp="最終話"
              title="Order confirmed."
              sub="Payment received (imaginarily) — 次のページへ"
              className="[&>h1]:gradient-drift"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-mute">
              A human has been notionally acquired. They have not been notified,
              moved, or harmed — this is, after all, a simulation. But the
              receipt is very real. Emotionally.
            </p>
          </div>
        </div>

        {order ? (
          <div className="mt-14 border border-sand bg-cream p-6 md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow">Receipt · {formatDate(order.created_at)}</p>
              <p className="text-xs tabular-nums text-ink-faint">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <ul className="mt-6 divide-y divide-sand border-y border-sand">
              {order.items.map((l) => (
                <li key={l.listingId} className="flex items-center justify-between gap-4 py-4 text-sm">
                  <span>
                    <Link href={`/listing/${l.listingId}`} className="link-editorial font-medium">
                      {l.personName} — {l.title}
                    </Link>
                    <span className="mt-0.5 block text-xs text-ink-faint">
                      {l.qty} × /{l.unit} @ {formatINR(l.price)}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatINR(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-mute">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(order.totals.subtotal)}</dd>
              </div>
              {order.totals.humanTouch > 0 && (
                <div className="flex justify-between text-sage">
                  <dt>Human touch discount</dt>
                  <dd className="tabular-nums">−{formatINR(order.totals.humanTouch)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-mute">Service fee</dt>
                <dd className="tabular-nums">{formatINR(order.totals.serviceFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-sand pt-3 text-base font-medium">
                <dt>Paid via {order.payment_method}</dt>
                <dd className="tabular-nums">{formatINR(order.totals.total)}</dd>
              </div>
            </dl>

            <p className="mt-6 border-t border-sand pt-5 text-xs leading-relaxed text-ink-faint">
              Shipping to {order.address.fullName}, {order.address.city} — where the
              human already is. A receipt will not be emailed. Returns accepted
              never; personalities are non-refundable.
            </p>
          </div>
        ) : (
          <div className="mt-14 border border-sand bg-cream p-8 text-center">
            <p className="text-sm text-ink-mute">
              We couldn&apos;t find the receipt, but the celebration stands.
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/explore"
            className="inline-flex h-12 items-center justify-center border border-ink bg-ink px-8 text-[11px] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-night"
          >
            Buy more humans
          </Link>
          <Link
            href="/account"
            className="inline-flex h-12 items-center justify-center border border-ink/70 px-8 text-[11px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
          >
            View your orders
          </Link>
        </div>
      </div>
    </div>
  );
}
