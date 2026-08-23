"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ImagePlus, Check } from "lucide-react";
import { createListing } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, DEFAULT_UNITS } from "@/lib/categories";
import { formatINR, initials, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";

interface Props {
  myName: string;
  myPersonId: string | null;
}

export function ListWizard({ myName, myPersonId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // step 1 — who
  const [who, setWho] = useState<"self" | "other">(myPersonId ? "self" : "other");
  const [personName, setPersonName] = useState(who === "self" ? myName : "");
  const [personBio, setPersonBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // step 2 — what
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [tags, setTags] = useState("");
  const [availability, setAvailability] = useState("");

  // step 3 — price
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("hour");
  const [customUnit, setCustomUnit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const effectiveUnit = unit === "__custom" ? customUnit.trim() : unit;
  const priceNum = Number(price);
  const displayName = who === "self" ? myName : personName;

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
      setError(
        upErr.message.includes("Bucket not found")
          ? "The photos bucket is missing — did you run supabase/schema.sql?"
          : upErr.message
      );
      return;
    }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
  };

  const canNext =
    step === 0
      ? who === "self" || personName.trim().length >= 2
      : step === 1
        ? title.trim().length >= 3
        : Number.isFinite(priceNum) && priceNum >= 0 && effectiveUnit.length >= 1;

  const publish = async () => {
    setError(null);
    setPublishing(true);
    const res = await createListing({
      personName: displayName,
      personBio: personBio.trim() || null,
      photoUrl,
      title,
      description: description.trim() || null,
      price: priceNum,
      unit: effectiveUnit.toLowerCase(),
      category,
      tags: tags.split(",").filter((t) => t.trim()),
      availability: availability.trim() || null,
      existingPersonId: who === "self" && myPersonId ? myPersonId : undefined,
    });
    if (res.ok) {
      router.push(`/listing/${res.listingId}`);
      router.refresh();
    } else {
      setError(res.error);
      setPublishing(false);
    }
  };

  const steps = ["The human", "The offering", "The price"];

  return (
    <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
      <div>
        {/* progress */}
        <ol className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em]">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full border text-[10px] tabular-nums transition-colors",
                  i < step
                    ? "border-sage bg-sage text-cream"
                    : i === step
                      ? "border-ink bg-ink text-cream"
                      : "border-sand text-ink-faint"
                )}
              >
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              <span className={i === step ? "text-ink" : "text-ink-faint"}>{s}</span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-sand" />}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            {step === 0 && (
              <div className="flex flex-col gap-6">
                <Field label="Who are we listing?">
                  <div className="flex gap-2">
                    {myName && (
                      <button
                        type="button"
                        onClick={() => setWho("self")}
                        className={cn(
                          "h-11 border px-4 text-xs transition-colors",
                          who === "self"
                            ? "border-ink bg-ink text-cream"
                            : "border-sand text-ink-mute hover:border-stone"
                        )}
                      >
                        Myself — {myName}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setWho("other")}
                      className={cn(
                        "h-11 border px-4 text-xs transition-colors",
                        who === "other"
                          ? "border-ink bg-ink text-cream"
                          : "border-sand text-ink-mute hover:border-stone"
                      )}
                    >
                      Someone else
                    </button>
                  </div>
                </Field>

                {who === "other" && (
                  <Field label="Their name" required>
                    <Input
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="e.g. Priya"
                      minLength={2}
                    />
                  </Field>
                )}

                <Field
                  label="A short bio"
                  hint="One line. Shown on their page."
                >
                  <Input
                    value={personBio}
                    onChange={(e) => setPersonBio(e.target.value)}
                    placeholder="Makes chai that resolves minor conflicts."
                    maxLength={140}
                  />
                </Field>

                <Field
                  label="Photo"
                  hint="A good portrait sells the human. JPG/PNG, under 5 MB."
                >
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
                        <img src={photoUrl} alt="Uploaded portrait" className="h-full w-full object-cover" />
                      ) : (
                        <span className="headline text-xl text-stone">
                          {initials(displayName || "?")}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      loading={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImagePlus size={14} /> {photoUrl ? "Replace" : "Upload"}
                    </Button>
                  </div>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-6">
                <Field label="What can they do?" required>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Good at cleaning"
                    maxLength={80}
                    required
                  />
                </Field>
                <Field label="Details" hint="Optional — but the fine goods have backstory.">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Twelve years of quietly excellent kitchens. Will judge your spice rack, gently."
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
                <Field label="Tags" hint="Comma-separated. Helps the smart search find them.">
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="cleaning, tidy, kitchens"
                  />
                </Field>
                <Field label="Availability" hint="Optional. e.g. 'Weekends' or '4 hours a day'.">
                  <Input
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="Weekends"
                    maxLength={40}
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <Field label="Price (₹)" required>
                  <Input
                    type="number"
                    min={0}
                    max={10000000}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="499"
                    required
                  />
                </Field>
                <Field label="Per what?" required hint="The unit is the whole joke. Choose freely.">
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
                    <button
                      type="button"
                      onClick={() => setUnit("__custom")}
                      className={cn(
                        "h-9 border px-3 text-xs transition-colors",
                        unit === "__custom"
                          ? "border-ink bg-ink text-cream"
                          : "border-sand text-ink-mute hover:border-stone hover:text-ink"
                      )}
                    >
                      custom…
                    </button>
                  </div>
                  {unit === "__custom" && (
                    <Input
                      className="mt-3"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="e.g. thali, sitar lesson, apology"
                      maxLength={24}
                    />
                  )}
                </Field>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p role="alert" className="mt-6 border border-clay/30 bg-clay-tint/50 px-4 py-3 text-sm text-clay-deep">
            {error}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={14} /> Back
          </Button>
          {step < 2 ? (
            <Button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}>
              Continue <ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="clay" onClick={publish} loading={publishing} disabled={!canNext}>
              Put {who === "self" ? "yourself" : "them"} on the shelf
            </Button>
          )}
        </div>
      </div>

      {/* live preview */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow">Live preview</p>
        <div className="mt-4 border border-sand bg-cream p-4">
          <div className="aspect-[3/4] w-full overflow-hidden bg-parchment">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="img-editorial h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <span className="headline text-5xl text-stone">{initials(displayName || "?")}</span>
              </div>
            )}
          </div>
          <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
            {displayName || "Their name"}
          </p>
          <h3 className="headline mt-1.5 text-lg">{title || "What they do"}</h3>
          <p className="mt-2 text-sm tabular-nums">
            <span className="font-medium">
              {price && Number.isFinite(priceNum) ? formatINR(priceNum) : "₹—"}
            </span>
            <span className="text-ink-mute"> / {effectiveUnit || "unit"}</span>
          </p>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
          Exactly how it will appear in the market. No surprises, only commerce.
        </p>
      </aside>
    </div>
  );
}
