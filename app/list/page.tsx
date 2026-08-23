import type { Metadata } from "next";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ListWizard } from "@/components/list/ListWizard";
import { ChapterCard } from "@/components/manga/ChapterCard";

export const metadata: Metadata = { title: "List a human" };
export const dynamic = "force-dynamic";

export default async function ListPage() {
  let myName = "";
  let myPersonId: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const [profileRes, personRes] = await Promise.all([
          supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
          supabase.from("people").select("id").eq("created_by", user.id).limit(1),
        ]);
        myName = profileRes.data?.display_name ?? "";
        myPersonId = personRes.data?.[0]?.id ?? null;
      }
    } catch {
      // fall through with empty state
    }
  }

  return (
    <div className="container-page py-10 md:py-20">
      <div className="max-w-xl">
        <ChapterCard
          jp="特別編"
          title="Put a human on the shelf."
          sub="Special edition — new listing"
        />
        <p className="mt-4 text-sm leading-relaxed text-ink-mute">
          Three steps: name them, describe the gift, set the price. The unit is
          up to you — hour, cup, match, whatever the talent deserves.
        </p>
      </div>

      <div className="mt-12">
        <ListWizard myName={myName} myPersonId={myPersonId} />
      </div>
    </div>
  );
}
