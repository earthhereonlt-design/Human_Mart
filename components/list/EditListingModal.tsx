"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { updateListing } from "@/app/actions";
import { CATEGORIES, DEFAULT_UNITS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";

export interface EditableListing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  tags: string[];
  availability: string | null;
  person_name: string;
}

/**
 * Edits one offering. The human's own name, bio and photo are shared across
 * all their listings and live in EditPersonModal instead.
 */
export function EditListingModal({
  listing,
  onClose,
}: {
  listing: EditableListing;
  onClose: () => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? "");
  const [category, setCategory] = useState(listing.category);
  const [tags, setTags] = useState(listing.tags.join(", "));
  const [availability, setAvailability] = useState(listing.availability ?? "");

  const knownUnit = DEFAULT_UNITS.includes(listing.unit);
  const [price, setPrice] = useState(String(listing.price));
  const [unit, setUnit] = useState(knownUnit ? listing.unit : "__custom");
  const [customUnit, setCustomUnit] = useState(knownUnit ? "" : listing.unit);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveUnit = unit === "__custom" ? customUnit.trim() : unit;
  const priceNum = Number(price);

  const save = async () => {
    setError(null);
    setSaving(true);
    const res = await updateListing({
      listingId: listing.id,
      title,
      description: description.trim() || null,
      price: priceNum,
      unit: effectiveUnit.toLowerCase(),
      category,
      tags: tags.split(",").filter((t) => t.trim()),
      availability: availability.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      setError(res.error ?? "Update failed.");
    }
  };

  const canSave =
    title.trim().length >= 3 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    effectiveUnit.length >= 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Edit listing"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto border-2 border-ink bg-cream p-6 shadow-[6px_6px_0_var(--color-ink)] sm:max-h-[88dvh] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Edit listing</p>
            <h2 className="headline mt-1 text-2xl">{listing.person_name}</h2>
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

        <div className="mt-8 flex flex-col gap-6">
          <p className="eyebrow">The offering</p>

          <Field label="What can they do?" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </Field>

          <Field label="Details">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </Field>

          <Field label="Category" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>

          <Field label="Tags" hint="Comma-separated.">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>

          <Field label="Availability">
            <Input
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              maxLength={40}
            />
          </Field>

          <p className="eyebrow mt-2 border-t border-sand pt-6">The price</p>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Price (₹)" required>
              <Input
                type="number"
                min={0}
                max={10000000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label="Per what?" required>
              <Input
                value={unit === "__custom" ? customUnit : unit}
                onChange={(e) => {
                  setUnit("__custom");
                  setCustomUnit(e.target.value);
                }}
                maxLength={24}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-2">
              {DEFAULT_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={cn(
                    "h-9 border px-3 text-xs capitalize transition-colors",
                    unit === u
                      ? "border-ink bg-ink text-cream"
                      : "border-sand text-ink-mute hover:border-stone hover:text-ink"
                  )}
                >
                  /{u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-6 border border-clay/30 bg-clay-tint/50 px-4 py-3 text-sm text-clay-deep">
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
