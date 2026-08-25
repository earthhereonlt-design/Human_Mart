import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Chibi } from "@/components/manga/Mascot";
import { Countdown } from "@/components/manga/Countdown";

export const dynamic = "force-dynamic";

/** The closed-for-restocking screen — a live countdown till the doors reopen. */
export default async function MaintenancePage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "maintenance")
    .maybeSingle();

  const m = data?.value as { on?: boolean; ends_at?: string | null; note?: string | null } | undefined;
  const endsAt = m?.ends_at ? new Date(m.ends_at) : null;
  const active = Boolean(m?.on && endsAt && endsAt.getTime() > Date.now());
  if (!active) redirect("/");

  return (
    <main
      id="maintenance-screen"
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-ivory px-6 py-8"
    >
      <div className="speedlines absolute inset-0" aria-hidden="true" />
      <div className="halftone absolute inset-0" aria-hidden="true" />

      <div className="relative flex max-w-lg flex-col items-center text-center">
        <span className="sfx sfx-outline text-[clamp(2rem,3.5vw+1.5vh,3rem)]">閉店中</span>
        <Chibi mood="lonely" className="mt-[clamp(1.25rem,3.5vh,2.5rem)] h-[clamp(8.5rem,24vh,15rem)] w-auto" />
        <h1 className="headline mt-[clamp(1.25rem,3.5vh,2.5rem)] text-[clamp(1.5rem,2.2vw+1vh,2.25rem)]">
          Closed for restocking
        </h1>
        <p className="hand mt-2 max-w-sm text-[clamp(0.95rem,1.1vw,1.125rem)] leading-relaxed text-ink-mute">
          {m?.note ?? "Restocking the shelves. Back soon!"}
        </p>

        <div className="mt-[clamp(1.25rem,3.5vh,2.5rem)]">
          <Countdown endsAt={endsAt!.toISOString()} />
        </div>

        <p
          className="jp mt-[clamp(1.25rem,3.5vh,2.5rem)] text-[0.8rem] tracking-[0.4em] text-ink-faint"
          aria-hidden="true"
        >
          しばらくお待ちください
        </p>
      </div>
    </main>
  );
}
