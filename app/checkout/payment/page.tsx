"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Banknote, CreditCard, Smartphone } from "lucide-react";
import { useCart, computeTotals } from "@/lib/cart";
import { placeOrder } from "@/app/actions";
import { formatINR, cn } from "@/lib/utils";
import type { Address } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/states/EmptyState";
import { CreatureScene } from "@/components/creatures/CreatureScene";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { PageStepper } from "@/components/manga/PageStepper";
import { Chibi } from "@/components/manga/Mascot";
import { Suspense } from "react";

const ADDRESS_KEY = "human-mart-address";
const EMPTY: Address = { fullName: "", line1: "", city: "", state: "", pincode: "", phone: "" };

type Method = "card" | "upi" | "cod";

const METHODS: Array<{ id: Method; label: string; note: string; icon: React.ReactNode }> = [
  { id: "card", label: "Card", note: "Visa, Mastercard, and vibes", icon: <CreditCard size={16} strokeWidth={1.5} /> },
  { id: "upi", label: "UPI", note: "The national reflex", icon: <Smartphone size={16} strokeWidth={1.5} /> },
  { id: "cod", label: "Cash on delivery", note: "Awkward for services", icon: <Banknote size={16} strokeWidth={1.5} /> },
];

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentInner />
    </Suspense>
  );
}

function PaymentInner() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const totals = computeTotals(lines);

  const [method, setMethod] = useState<Method>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "ritual">("form");

  if (lines.length === 0 && phase === "form") {
    return (
      <div className="container-page py-10 md:py-20">
        <h1 className="headline text-4xl">Payment</h1>
        <div className="mt-6">
          <EmptyState
            mood="curious"
            title="No payment needed"
            body="There is nothing in the cart to pay for. A rare blessing."
            actionHref="/explore"
            actionLabel="Browse humans"
          />
        </div>
      </div>
    );
  }

  const validate = (): string | null => {
    if (method === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (!/^\d{15,16}$/.test(digits)) return "Card number wants 15–16 digits.";
      if (cardName.trim().length < 2) return "Name the card's owner.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return "Expiry as MM/YY.";
      if (!/^\d{3,4}$/.test(cvv)) return "CVV, the three secret digits.";
    }
    if (method === "upi" && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(upiId.trim()))
      return "A UPI ID looks like name@bank.";
    return null;
  };

  const pay = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setPhase("ritual");

    // the payment ritual — 2.2s of believable theatre
    await new Promise((r) => setTimeout(r, 2200));

    let addr: Address = EMPTY;
    try {
      const saved = localStorage.getItem(ADDRESS_KEY);
      if (saved) addr = { ...EMPTY, ...(JSON.parse(saved) as Address) };
    } catch {
      // fall through with empty address; server validates
    }

    const res = await placeOrder({
      address: addr,
      items: lines,
      paymentMethod: method === "cod" ? "Cash on delivery" : method === "upi" ? "UPI" : "Card",
    });

    if (res.ok) {
      clear();
      router.push(`/checkout/success?order=${res.orderId}`);
    } else {
      setPhase("form");
      setError(res.error);
    }
  };

  return (
    <>
      <div className="container-page py-10 md:py-20">
        <ChapterCard jp="第5話" title="Payment" sub="Checkout, step three of three" />
        <div className="mt-6">
          <PageStepper current={2} />
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            {/* method picker */}
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex flex-col gap-1.5 border p-4 text-left transition-colors",
                    method === m.id
                      ? "border-ink bg-cream"
                      : "border-sand hover:border-stone"
                  )}
                >
                  <span className={cn("flex items-center gap-2 text-sm font-medium", method === m.id ? "text-ink" : "text-ink-soft")}>
                    {m.icon} {m.label}
                  </span>
                  <span className="text-[11px] leading-snug text-ink-faint">{m.note}</span>
                </button>
              ))}
            </div>

            {/* method forms — simulated, never sent anywhere */}
            <div className="mt-8 border border-sand bg-cream p-6 md:p-8">
              {method === "card" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Card number" required className="md:col-span-2">
                    <Input
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
                      }}
                      placeholder="4242 4242 4242 4242"
                      autoComplete="cc-number"
                    />
                  </Field>
                  <Field label="Name on card" required className="md:col-span-2">
                    <Input value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="cc-name" />
                  </Field>
                  <Field label="Expiry (MM/YY)" required>
                    <Input
                      value={expiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                      }}
                      placeholder="09/28"
                      autoComplete="cc-exp"
                    />
                  </Field>
                  <Field label="CVV" required>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      autoComplete="cc-csc"
                    />
                  </Field>
                </div>
              )}

              {method === "upi" && (
                <Field label="UPI ID" required hint="Simulated — no money will move. It never does here.">
                  <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="aadi@okbank" />
                </Field>
              )}

              {method === "cod" && (
                <p className="max-w-md text-sm leading-relaxed text-ink-mute">
                  You&apos;ll pay the human in person, in cash, while maintaining
                  eye contact. Please have exact change and a warm disposition.
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-5 border border-clay/30 bg-clay-tint/50 px-4 py-3 text-sm text-clay-deep">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Link href="/checkout" className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute hover:text-ink">
                <ArrowLeft size={14} /> Back to address
              </Link>
              <Button variant="clay" size="lg" onClick={pay}>
                Pay {formatINR(totals.total)}
              </Button>
            </div>
          </div>

          {/* summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="mb-6 flex items-end gap-3">
              <Chibi mood="waiting" className="h-24 w-auto shrink-0 md:h-28" />
              <p className="bubble max-w-40 px-4 py-3">
                <span className="hand text-base leading-snug text-ink-soft">
                  Counting rupees, counting rupees…
                </span>
              </p>
            </div>
            <div className="border border-sand bg-cream p-6 md:p-8">
              <p className="eyebrow">You&apos;re buying</p>
              <ul className="mt-5 space-y-4">
                {lines.map((l) => (
                  <li key={l.listingId} className="flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">
                      {l.personName} — {l.title}
                      <span className="block text-xs text-ink-faint">
                        {l.qty} × /{l.unit} @ {formatINR(l.price)}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatINR(l.price * l.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 space-y-2.5 border-t border-sand pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Subtotal</dt>
                  <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
                </div>
                {totals.humanTouch > 0 && (
                  <div className="flex justify-between text-sage">
                    <dt>Human touch discount</dt>
                    <dd className="tabular-nums">−{formatINR(totals.humanTouch)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Service fee</dt>
                  <dd className="tabular-nums">{formatINR(totals.serviceFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-sand pt-3 text-base font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatINR(totals.total)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {/* the ritual overlay */}
      <AnimatePresence>
        {phase === "ritual" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ivory/97 p-6 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm text-center"
            >
              <CreatureScene mood="waiting" className="mx-auto max-w-56" />
              <p className="headline mt-8 text-xl">Contacting your bank, politely…</p>
              <p className="mt-2 text-xs text-ink-faint">
                Simulated payment · no money is moving · it never does
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
