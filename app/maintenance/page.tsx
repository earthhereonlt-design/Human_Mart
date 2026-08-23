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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ivory px-6">
      <div className="speedlines absolute inset-0" aria-hidden="true" />
      <div className="halftone absolute inset-0" aria-hidden="true" />

      <div className="relative flex max-w-lg flex-col items-center text-center">
        <span className="sfx sfx-outline text-4xl md:text-5xl">閉店中</span>
        <Chibi mood="lonely" className="mt-10 h-52 w-auto md:h-60" />
        <h1 className="headline mt-10 text-3xl md:text-4xl">
          Closed for restocking
        </h1>
        <p className="hand mt-3 max-w-sm text-lg leading-relaxed text-ink-mute">
          {m?.note ?? "Restocking the shelves. Back soon!"}
        </p>

        <div className="mt-10">
          <Countdown endsAt={endsAt!.toISOString()} />
        </div>

        <p className="jp mt-10 text-sm tracking-[0.4em] text-ink-faint" aria-hidden="true">
          しばらくお待ちください
        </p>
      </div>
    </main>
  );
}
