import type { Metadata } from "next";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ListWizard } from "@/components/list/ListWizard";
import { ChapterCard } from "@/components/manga/ChapterCard";

export const metadata: Metadata = { title: "List a human" };
export const dynamic = "force-dynamic";

export default async function ListPage() {
  let myName = "";
  let myPersonId: string | null = null;
  let myPersonPhoto: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profileRes = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        myName = profileRes.data?.display_name ?? "";

        // your own row on the shelf — claimed, or one you created under your
        // own name. NOT the first "someone else" you ever listed.
        const claimed = await supabase
          .from("people")
          .select("id, photo_url")
          .eq("claimed_by", user.id)
          .maybeSingle();
        if (claimed.data) {
          myPersonId = claimed.data.id;
          myPersonPhoto = claimed.data.photo_url ?? null;
        } else if (myName) {
          const own = await supabase
            .from("people")
            .select("id, photo_url")
            .eq("created_by", user.id)
            .ilike("name", myName)
            .limit(1);
          if (own.data?.length) {
            myPersonId = own.data[0].id;
            myPersonPhoto = own.data[0].photo_url ?? null;
          }
        }
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
        <ListWizard myName={myName} myPersonId={myPersonId} myPersonPhoto={myPersonPhoto} />
      </div>
    </div>
  );
}
