"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, LogOut, Trash2 } from "lucide-react";
import { setListingActive, deleteListing } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { springSoft } from "@/lib/motion";
import type { MarketListing, OrderRow, Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type Tab = "listings" | "orders" | "profile";

export function AccountTabs({
  profile,
  myListings,
  orders,
}: {
  profile: Profile;
  myListings: MarketListing[];
  orders: OrderRow[];
}) {
  const [tab, setTab] = useState<Tab>("listings");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      {/* tab bar */}
      <div className="flex gap-6 border-b border-sand" role="tablist">
        {(
          [
            ["listings", `My listings (${myListings.length})`],
            ["orders", `My orders (${orders.length})`],
            ["profile", "Login & profile"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
              tab === id
                ? "border-ink text-ink"
                : "border-transparent text-ink-faint hover:text-ink-mute"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <AnimatePresence mode="wait">
        {tab === "listings" && (
          <motion.div key="listings" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={springSoft}>
            {myListings.length === 0 ? (
              <EmptyTab
                title="Nothing on your shelf"
                body="You haven't listed anyone yet. Even yourself. Bold modesty."
                action={{ href: "/list", label: "List a human" }}
              />
            ) : (
              <ul className="divide-y divide-sand border-y border-sand">
                {myListings.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-4 py-5">
                    <div className="min-w-0 flex-1">
                      <Link href={`/listing/${l.id}`} className="link-editorial headline text-lg">
                        {l.person_name} — {l.title}
                      </Link>
                      <p className="mt-1 text-sm text-ink-mute">
                        {formatINR(l.price)} / {l.unit} · {l.category} ·{" "}
                        <span className={l.is_active ? "text-sage" : "text-ink-faint"}>
                          {l.is_active ? "On the shelf" : "Unlisted"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={busy === `t-${l.id}`}
                        onClick={async () => {
                          setBusy(`t-${l.id}`);
                          await setListingActive(l.id, !l.is_active);
                          setBusy(null);
                          router.refresh();
                        }}
                      >
                        {l.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                        {l.is_active ? "Unlist" : "Relist"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busy === `d-${l.id}`}
                        onClick={async () => {
                          if (!window.confirm(`Delete "${l.title}" forever?`)) return;
                          setBusy(`d-${l.id}`);
                          await deleteListing(l.id);
                          setBusy(null);
                          router.refresh();
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {tab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={springSoft}>
            {orders.length === 0 ? (
              <EmptyTab
                title="No orders yet"
                body="You have acquired zero humans so far. The market forgives you."
                action={{ href: "/explore", label: "Go acquire one" }}
              />
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li key={o.id} className="border border-sand bg-cream p-5 md:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">
                        {formatDate(o.created_at)} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs tabular-nums text-ink-faint">
                        #{o.id.slice(0, 8).toUpperCase()} · {o.payment_method}
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                      {o.items.map((it) => (
                        <li key={it.listingId} className="flex justify-between gap-4">
                          <span>
                            {it.personName} — {it.title}{" "}
                            <span className="text-ink-faint">({it.qty} × /{it.unit})</span>
                          </span>
                          <span className="tabular-nums">{formatINR(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-sand pt-3 text-sm font-medium tabular-nums">
                      Total: {formatINR(o.totals.total)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {tab === "profile" && (
          <motion.div key="profile" className="max-w-md" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={springSoft}>
            <p className="eyebrow">Stored in the profiles table</p>
            <dl className="mt-6 divide-y divide-sand border-y border-sand text-sm">
              <div className="flex justify-between gap-6 py-3.5">
                <dt className="text-ink-mute">Name</dt>
                <dd className="font-medium">{profile.display_name}</dd>
              </div>
              <div className="flex justify-between gap-6 py-3.5">
                <dt className="text-ink-mute">Email</dt>
                <dd>{profile.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-6 py-3.5">
                <dt className="text-ink-mute">Member since</dt>
                <dd>{formatDate(profile.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-6 py-3.5">
                <dt className="text-ink-mute">Listings</dt>
                <dd className="tabular-nums">{myListings.length}</dd>
              </div>
            </dl>
            <Button variant="outline" className="mt-8" onClick={signOut}>
              <LogOut size={14} /> Sign out
            </Button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyTab({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="border border-sand bg-cream p-8 text-center md:p-12">
      <p className="headline text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">{body}</p>
      <Link
        href={action.href}
        className="mt-6 inline-flex h-11 items-center border border-ink bg-ink px-6 text-[10px] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-night"
      >
        {action.label}
      </Link>
    </div>
  );
}
