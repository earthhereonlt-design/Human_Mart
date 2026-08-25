"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ImagePlus } from "lucide-react";
import { updatePerson } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export interface EditablePerson {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
}

/**
 * Edits a listed human. These details are shared by every offering that person
 * has, so a change here shows up on all of them — the copy says so out loud.
 *
 * `isAdmin` unlocks the slug field; for everyone else the URL stays put so
 * existing links keep working.
 */
export function EditPersonModal({
  person,
  isAdmin = false,
  onClose,
  onSlugChange,
}: {
  person: EditablePerson;
  isAdmin?: boolean;
  onClose: () => void;
  /**
   * Called instead of a plain refresh when an admin moves the slug. The person
   * page passes a handler that navigates to the new URL (the old one now 404s);
   * callers not sitting on that URL — the admin panel — can leave it out.
   */
  onSlugChange?: (slug: string) => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(person.name);
  const [bio, setBio] = useState(person.bio ?? "");
  const [slug, setSlug] = useState(person.slug);
  const [photoUrl, setPhotoUrl] = useState<string | null>(person.photo_url);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const slugValid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

  const uploadPhoto = async (file: File) => {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in got lost somewhere. Refresh and try again.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    const nextSlug = slug.trim().toLowerCase();
    const res = await updatePerson({
      personId: person.id,
      name,
      bio: bio.trim() || null,
      photoUrl,
      ...(isAdmin ? { slug: nextSlug } : {}),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Update failed.");
      return;
    }
    onClose();
    if (isAdmin && nextSlug !== person.slug && onSlugChange) onSlugChange(nextSlug);
    else router.refresh();
  };

  const canSave =
    name.trim().length >= 2 && bio.trim().length <= 140 && (!isAdmin || slugValid);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Edit person"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto border-2 border-ink bg-cream p-6 shadow-[6px_6px_0_var(--color-ink)] sm:max-h-[88dvh] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Edit the human</p>
            <h2 className="headline mt-1 text-2xl">{person.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center border border-sand text-ink-mute transition-colors hover:border-ink hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          These details are shared by every offering this human has — a change
          here shows up on all of them.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          <Field label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={80}
              invalid={name.trim().length > 0 && name.trim().length < 2}
            />
          </Field>

          <Field
            label="A short bio"
            hint={`One line. Shown on their page. ${140 - bio.trim().length} left.`}
          >
            <Input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={140} />
          </Field>

          {isAdmin && (
            <Field
              label="URL"
              required
              hint="Admin only. Changing this breaks existing links to their page."
              error={slug.length > 0 && !slugValid ? "Lowercase letters, numbers and single hyphens only." : undefined}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-ink-faint">/person/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  maxLength={60}
                  invalid={slug.length > 0 && !slugValid}
                />
              </div>
            </Field>
          )}

          <Field label="Photo" hint="Upload a new portrait or remove the current one.">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f);
              }}
            />
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-16 place-items-center overflow-hidden border border-sand bg-parchment">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Portrait" className="h-full w-full object-cover" />
                ) : (
                  <span className="headline text-xl text-stone">{initials(name || "?")}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus size={14} /> {photoUrl ? "Replace" : "Upload"}
                </Button>
                {photoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhotoUrl(null)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 border border-clay/30 bg-clay-tint/50 px-4 py-3 text-sm text-clay-deep"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="clay" onClick={save} loading={saving} disabled={!canSave}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
