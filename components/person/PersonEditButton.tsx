"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { EditPersonModal, type EditablePerson } from "@/components/person/EditPersonModal";

/**
 * The edit affordance on a person's public page. Only rendered by the server
 * once it has confirmed the viewer is the creator, the claimer, or an admin —
 * the server action re-checks regardless.
 */
export function PersonEditButton({
  person,
  isAdmin,
}: {
  person: EditablePerson;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute transition-colors hover:text-ink"
      >
        <Pencil size={13} strokeWidth={1.5} /> Edit details
      </button>

      {open && (
        <EditPersonModal
          person={person}
          isAdmin={isAdmin}
          onClose={() => setOpen(false)}
          onSlugChange={(slug) => router.replace(`/person/${slug}`)}
        />
      )}
    </>
  );
}
