import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { AdminPanel, type Maintenance } from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

/** The editor's room — admins only; everyone else sees a 404. */
export default async function AdminPage() {
  if (!isSupabaseConfigured()) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) notFound();

  const [{ data: snapRes, error: snapErr }, { data: settings }] = await Promise.all([
    supabase.rpc("admin_snapshot"),
    supabase.from("site_settings").select("value").eq("key", "maintenance").maybeSingle(),
  ]);
  if (snapErr || !snapRes) notFound();

  const maintenance = (settings?.value ?? { on: false, ends_at: null, note: null }) as Maintenance;

  return (
    <div className="container-page py-10 md:py-20">
      <ChapterCard jp="編集室" title="The editor's room" sub="Admin — everything the market owns" />
      <div className="mt-10">
        <AdminPanel snapshot={snapRes as never} maintenance={maintenance} myId={user.id} />
      </div>
    </div>
  );
}
