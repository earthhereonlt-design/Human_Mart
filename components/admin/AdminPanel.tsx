"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Countdown } from "@/components/manga/Countdown";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

type Snap = {
  listings: Array<{
    id: string; title: string; price: number; unit: string; category: string;
    is_active: boolean; person_name: string; person_slug: string;
  }>;
  people: Array<{ id: string; name: string; slug: string }>;
  users: Array<{ id: string; display_name: string; email: string | null; is_admin: boolean }>;
  orders: Array<{ id: string; payment_method: string; totals: { total: number }; items: unknown[]; created_at: string }>;
  stats: { humans: number; listings: number; users: number; orders: number; reviews: number };
};

export type Maintenance = { on: boolean; ends_at: string | null; note: string | null };

const TABS = ["Maintenance", "Listings", "People", "Users", "Orders"] as const;
const DURATIONS = [
  { min: 30, label: "30m" }, { min: 60, label: "1h" }, { min: 180, label: "3h" },
  { min: 360, label: "6h" }, { min: 720, label: "12h" }, { min: 1440, label: "24h" },
];

export function AdminPanel({
  snapshot,
  maintenance,
  myId,
}: {
  snapshot: Snap;
  maintenance: Maintenance;
  myId: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Maintenance");
  const router = useRouter();
  const supabase = createClient();

  // maintenance state
  const [mOn, setMOn] = useState(maintenance.on);
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState(maintenance.note ?? "");
  const [mBusy, setMBusy] = useState(false);
  const [mMsg, setMMsg] = useState<string | null>(null);

  const [busy, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, fn: () => PromiseLike<{ error: { message: string } | null }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(id);
    try {
      const { error } = await fn();
      if (error) window.alert(error.message);
      else startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  };

  const applyMaintenance = async () => {
    setMBusy(true);
    setMMsg(null);
    const { data, error } = await supabase.rpc("set_maintenance", {
      on_off: mOn,
      minutes: mOn ? minutes : 0,
      note,
    });
    setMBusy(false);
    if (error) setMMsg(error.message);
    else {
      setMMsg(mOn ? "The market is closed. Readers see the countdown." : "The market is open for business.");
      startTransition(() => router.refresh());
    }
    void data;
  };

  return (
    <div>
      {/* stat strip */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(snapshot.stats).map(([k, v]) => (
          <div key={k} className="halftone-fine border-2 border-ink bg-cream px-4 py-2.5 shadow-[3px_3px_0_var(--color-ink)]">
            <p className="font-display text-xl tabular-nums">{v}</p>
            <p className="eyebrow mt-0.5 !text-[8px]">{k}</p>
          </div>
        ))}
      </div>

      {/* tab bar */}
      <div className="mt-10 flex gap-5 overflow-x-auto border-b-2 border-ink/15" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-0.5 shrink-0 border-b-2 pb-3 font-display text-[12px] uppercase tracking-[0.1em] transition-colors",
              tab === t ? "border-clay text-ink" : "border-transparent text-ink-faint hover:text-ink-mute"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "Maintenance" && (
          <div className="panel max-w-xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="headline text-xl">Maintenance mode</p>
                <p className="mt-1 text-sm text-ink-mute">
                  Close the market with a live countdown. Admins keep browsing freely.
                </p>
              </div>
              {/* the slide switch */}
              <button
                type="button"
                role="switch"
                aria-checked={mOn}
                aria-label="Maintenance mode"
                onClick={() => setMOn((v) => !v)}
                className={cn(
                  "relative h-10 w-[72px] shrink-0 border-[3px] border-ink transition-colors",
                  mOn ? "bg-clay" : "bg-cream"
                )}
              >
                <span
                  className={cn(
                    "absolute top-[3px] h-[26px] w-[30px] border-2 border-ink bg-ivory shadow-[2px_2px_0_var(--color-ink)] transition-all duration-200",
                    mOn ? "left-[36px]" : "left-[3px]"
                  )}
                />
                <span className={cn("jp absolute -bottom-5 text-[9px]", mOn ? "right-1 text-clay" : "left-1 text-ink-faint")}>
                  {mOn ? "閉店" : "営業"}
                </span>
              </button>
            </div>

            {mOn && (
              <div className="mt-8">
                <p className="eyebrow">Closed for</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.min}
                      type="button"
                      onClick={() => setMinutes(d.min)}
                      className={cn(
                        "h-9 border-2 px-3 font-display text-[12px] uppercase",
                        minutes === d.min ? "border-ink bg-ink text-cream" : "border-stone text-ink-mute hover:border-ink"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={43200}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value) || 1)}
                    aria-label="Custom minutes"
                    className="h-9 w-24 rounded-none border-2 border-stone bg-cream px-2 text-sm tabular-nums focus:border-ink focus:outline-none"
                  />
                  <span className="self-center text-xs text-ink-faint">minutes</span>
                </div>
                <div className="mt-5">
                  <p className="eyebrow">Sign text</p>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={120}
                    placeholder="Restocking the shelves. Back soon!"
                    className="mt-2 h-11 w-full rounded-none border-2 border-stone bg-cream px-3 text-sm focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <Button variant={mOn ? "clay" : "solid"} loading={mBusy} onClick={applyMaintenance}>
                {mOn ? "Close the market" : "Reopen the market"}
              </Button>
              {busy && <Loader2 size={15} className="animate-spin text-ink-mute" />}
            </div>
            {mMsg && <p className="hand mt-4 text-base text-clay-deep">{mMsg}</p>}

            {maintenance.on && maintenance.ends_at && new Date(maintenance.ends_at) > new Date() && (
              <div className="mt-8 border-t-2 border-ink/15 pt-6">
                <p className="eyebrow">Currently closed — readers see</p>
                <div className="mt-3 scale-90 origin-top md:scale-100">
                  <Countdown endsAt={maintenance.ends_at} />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Listings" && (
          <ul className="divide-y-2 divide-ink/10 border-y-2 border-ink/15">
            {snapshot.listings.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/listing/${l.id}`} className="link-editorial headline text-base">
                    {l.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {l.person_name} · ₹{l.price.toLocaleString("en-IN")}/{l.unit} · {l.category} ·{" "}
                    <span className={l.is_active ? "text-sage" : "text-clay-deep"}>
                      {l.is_active ? "on shelf" : "unlisted"}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline" size="sm" loading={busyId === `l-${l.id}`}
                  onClick={() => run(`l-${l.id}`, () => supabase.rpc("admin_set_listing_active", { p_id: l.id, p_active: !l.is_active }))}
                >
                  {l.is_active ? <EyeOff size={13} /> : <Eye size={13} />} {l.is_active ? "Unlist" : "Relist"}
                </Button>
                <Button
                  variant="ghost" size="sm" loading={busyId === `ld-${l.id}`}
                  onClick={() => run(`ld-${l.id}`, () => supabase.rpc("admin_delete_listing", { p_id: l.id }), `Delete "${l.title}" forever?`)}
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            ))}
            {!snapshot.listings.length && <p className="py-8 text-sm text-ink-mute">No listings yet.</p>}
          </ul>
        )}

        {tab === "People" && (
          <ul className="divide-y-2 divide-ink/10 border-y-2 border-ink/15">
            {snapshot.people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/person/${p.slug}`} className="link-editorial headline text-base">{p.name}</Link>
                  <p className="text-xs text-ink-mute">/{p.slug}</p>
                </div>
                <Button
                  variant="ghost" size="sm" loading={busyId === `p-${p.id}`}
                  onClick={() => run(`p-${p.id}`, () => supabase.rpc("admin_delete_person", { p_id: p.id }), `Delete ${p.name} and all their listings?`)}
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            ))}
            {!snapshot.people.length && <p className="py-8 text-sm text-ink-mute">No humans in stock yet.</p>}
          </ul>
        )}

        {tab === "Users" && (
          <ul className="divide-y-2 divide-ink/10 border-y-2 border-ink/15">
            {snapshot.users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="headline text-base">
                    {u.display_name}
                    {u.is_admin && (
                      <span className="jp ml-2 -rotate-2 border-2 border-clay px-1.5 py-0.5 align-middle text-[10px] text-clay">管理人</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-mute">{u.email ?? "—"}</p>
                </div>
                <Button
                  variant="outline" size="sm" disabled={u.id === myId} loading={busyId === `a-${u.id}`}
                  onClick={() => run(`a-${u.id}`, () => supabase.rpc("admin_set_admin", { target: u.id, make_admin: !u.is_admin }))}
                >
                  {u.is_admin ? "Demote" : "Make admin"}
                </Button>
                <Button
                  variant="ghost" size="sm" disabled={u.id === myId} loading={busyId === `u-${u.id}`}
                  onClick={() => run(`u-${u.id}`, () => supabase.rpc("admin_delete_user", { target: u.id }), `Delete ${u.display_name}'s account forever?`)}
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {tab === "Orders" && (
          <ul className="space-y-3">
            {snapshot.orders.map((o) => (
              <li key={o.id} className="border-2 border-ink/15 bg-cream p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {new Date(o.created_at).toLocaleString("en-IN")} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {o.payment_method}
                  </p>
                  <p className="text-xs tabular-nums text-ink-faint">#{o.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <p className="mt-2 text-sm font-medium tabular-nums">
                  Total: ₹{(o.totals?.total ?? 0).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
            {!snapshot.orders.length && <p className="py-8 text-sm text-ink-mute">No orders yet.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
