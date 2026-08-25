"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, LogOut, Pencil, Trash2 } from "lucide-react";
import { setListingActive, deleteListing } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { springSoft } from "@/lib/motion";
import type { MarketListing, OrderRow, Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EditListingModal } from "@/components/list/EditListingModal";
import { EditPersonModal, type EditablePerson } from "@/components/person/EditPersonModal";

type Tab = "listings" | "orders" | "profile";

export function AccountTabs({
  profile,
  myListings,
  orders,
  myPeople,
}: {
  profile: Profile;
  myListings: MarketListing[];
  orders: OrderRow[];
  myPeople: EditablePerson[];
}) {
  const [tab, setTab] = useState<Tab>("listings");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<MarketListing | null>(null);
  const [editingPerson, setEditingPerson] = useState<EditablePerson | null>(null);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      {/* tab bar */}
      <div className="flex gap-5 overflow-x-auto border-b border-sand md:gap-6" role="tablist">
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
              "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
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
                      <Link href={`/listing/${l.id}`} className="link-editorial headline break-words text-lg">
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
                        onClick={() => setEditing(l)}
                      >
                        <Pencil size={13} /> Edit
                      </Button>
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
            <div className="mt-10">
              <p className="eyebrow">Humans you put on the shelf</p>
              {myPeople.length === 0 ? (
                <p className="mt-3 text-sm text-ink-mute">
                  Nobody yet — every human you list an offering for appears here.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-xs text-ink-faint">
                    Their name, bio and photo are shared by all of their offerings.
                  </p>
                  <ul className="mt-3 divide-y divide-sand border-y border-sand">
                    {myPeople.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5">
                        <Link
                          href={`/person/${p.slug}`}
                          className="link-editorial headline min-w-0 break-words text-base"
                        >
                          {p.name}
                        </Link>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingPerson(p)}>
                            <Pencil size={13} /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={busy === `pp-${p.id}`}
                            onClick={async () => {
                              if (!window.confirm(`Take ${p.name} off the shelf? All their listings go too.`)) return;
                              setBusy(`pp-${p.id}`);
                              const supabase = createClient();
                              const { error } = await supabase.from("people").delete().eq("id", p.id);
                              setBusy(null);
                              if (error) window.alert("Could not remove them — try again.");
                              else router.refresh();
                            }}
                          >
                            <Trash2 size={13} /> Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
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

            <div className="mt-10 border-2 border-clay/50 bg-clay-tint/40 p-5">
              <p className="headline text-lg text-clay-deep">Danger zone</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-mute">
                Delete your account forever. Your reviews and orders are erased;
                the humans you listed stay on their shelves, unclaimed.
              </p>
              <Button
                variant="outline"
                className="mt-4 !border-clay !text-clay-deep hover:!shadow-[3px_3px_0_var(--color-clay)]"
                onClick={async () => {
                  if (!window.confirm("Delete your account forever? This cannot be undone.")) return;
                  const supabase = createClient();
                  const { error } = await supabase.rpc("delete_own_account");
                  if (error) {
                    window.alert("Could not delete the account — try again in a minute.");
                    return;
                  }
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                <Trash2 size={14} /> Delete my account
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {editing && (
        <EditListingModal
          listing={{
            id: editing.id,
            title: editing.title,
            description: editing.description,
            price: editing.price,
            unit: editing.unit,
            category: editing.category,
            tags: editing.tags,
            availability: editing.availability,
            person_name: editing.person_name,
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          onClose={() => setEditingPerson(null)}
        />
      )}
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
