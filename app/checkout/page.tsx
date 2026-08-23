"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCart, computeTotals } from "@/lib/cart";
import type { Address } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/states/EmptyState";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { PageStepper } from "@/components/manga/PageStepper";
import { Suspense } from "react";

const STORAGE_KEY = "human-mart-address";

const EMPTY: Address = { fullName: "", line1: "", city: "", state: "", pincode: "", phone: "" };

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const totals = computeTotals(lines);

  const [addr, setAddr] = useState<Address>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAddr({ ...EMPTY, ...(JSON.parse(saved) as Address) });
    } catch {
      // ignore malformed drafts
    }
  }, []);

  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [k]: e.target.value }));

  const errors: Partial<Record<keyof Address, string>> = {};
  if (addr.fullName.trim().length < 2) errors.fullName = "A name, please.";
  if (addr.line1.trim().length < 4) errors.line1 = "Where should the nothing be shipped?";
  if (addr.city.trim().length < 2) errors.city = "City?";
  if (addr.state.trim().length < 2) errors.state = "State?";
  if (!/^\d{6}$/.test(addr.pincode)) errors.pincode = "6-digit PIN code.";
  if (addr.phone && !/^[\d\s+-]{8,15}$/.test(addr.phone)) errors.phone = "That phone looks imaginary.";

  const valid = Object.keys(errors).length === 0;

  const showErr = (k: keyof Address) => (touched[k] ? errors[k] : undefined);

  if (lines.length === 0) {
    return (
      <div className="container-page py-10 md:py-20">
        <h1 className="headline text-4xl">Address</h1>
        <div className="mt-6">
          <EmptyState
            mood="curious"
            title="Nothing to check out"
            body="The cart is empty — an address would be aspirational at this point."
            actionHref="/explore"
            actionLabel="Find a human"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-20">
      <ChapterCard jp="第4話" title="Delivery address" sub="Checkout, step two of three" />
      <div className="mt-6">
        <PageStepper current={1} />
      </div>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-mute">
        Nothing will be shipped, obviously. But the ceremony demands an address,
        and we are nothing if not ceremonial.
      </p>

      <form
        className="mt-10 grid max-w-xl gap-5 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({
            fullName: true, line1: true, city: true, state: true, pincode: true, phone: true,
          });
          if (!valid) return;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(addr));
          router.push("/checkout/payment");
        }}
      >
        <Field label="Full name" required error={showErr("fullName")} className="md:col-span-2">
          <Input value={addr.fullName} onChange={set("fullName")} onBlur={() => setTouched((t) => ({ ...t, fullName: true }))} autoComplete="name" />
        </Field>
        <Field label="Address" required error={showErr("line1")} className="md:col-span-2">
          <Input value={addr.line1} onChange={set("line1")} onBlur={() => setTouched((t) => ({ ...t, line1: true }))} autoComplete="address-line1" placeholder="Flat, street, landmark" />
        </Field>
        <Field label="City" required error={showErr("city")}>
          <Input value={addr.city} onChange={set("city")} onBlur={() => setTouched((t) => ({ ...t, city: true }))} autoComplete="address-level2" />
        </Field>
        <Field label="State" required error={showErr("state")}>
          <Input value={addr.state} onChange={set("state")} onBlur={() => setTouched((t) => ({ ...t, state: true }))} autoComplete="address-level1" />
        </Field>
        <Field label="PIN code" required error={showErr("pincode")}>
          <Input value={addr.pincode} onChange={set("pincode")} onBlur={() => setTouched((t) => ({ ...t, pincode: true }))} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
        </Field>
        <Field label="Phone" hint="Optional — for order updates you'll never receive." error={showErr("phone")}>
          <Input value={addr.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
        </Field>

        <div className="mt-4 flex items-center justify-between md:col-span-2">
          <Link href="/cart" className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute hover:text-ink">
            <ArrowLeft size={14} /> Back to cart
          </Link>
          <Button type="submit" size="lg">
            Continue to payment <ArrowRight size={14} />
          </Button>
        </div>
      </form>

      <p className="mt-8 text-xs text-ink-faint">
        Order total, unchanged by geography: <span className="tabular-nums text-ink-mute">{formatINR(totals.total)}</span>
      </p>
    </div>
  );
}
