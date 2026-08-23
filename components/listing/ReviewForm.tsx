"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { submitReview, reportListing } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Textarea, Field } from "@/components/ui/Input";
import { StarPicker } from "@/components/ui/Stars";

export function ReviewForm({
  listingId,
  signedIn,
}: {
  listingId: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!signedIn) {
    return (
      <div className="border border-sand bg-cream p-6">
        <p className="text-sm text-ink-mute">
          Only registered humans may review other registered humans. It&apos;s only fair.
        </p>
        <a
          href={`/login?next=/listing/${listingId}`}
          className="mt-4 inline-flex h-10 items-center border border-ink bg-ink px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-cream hover:bg-night"
        >
          Sign in to review
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-sand bg-cream p-6">
        <p className="text-sm text-ink-soft">
          Review published. Democracy in action.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5 border border-sand bg-cream p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await submitReview({ listingId, rating, body });
        setLoading(false);
        if (res.ok) {
          setDone(true);
          router.refresh();
        } else {
          setError(res.error);
        }
      }}
    >
      <Field label="Your rating" required error={error ?? undefined}>
        <StarPicker value={rating} onChange={setRating} />
      </Field>
      <Field label="The review" required>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Arrived exactly when promised. Made excellent chai."
          maxLength={1000}
          required
        />
      </Field>
      <Button type="submit" loading={loading} className="self-start">
        Publish review
      </Button>
    </form>
  );
}

export function ReportDialog({
  listingId,
  personId,
}: {
  listingId?: string;
  personId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint transition-colors hover:text-clay-deep"
      >
        <Flag size={12} strokeWidth={1.5} /> Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-night/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Report this listing"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md border border-sand bg-ivory p-6 md:p-8">
            {state === "done" ? (
              <div className="py-4 text-center">
                <p className="headline text-xl">Thank you.</p>
                <p className="mt-2 text-sm text-ink-mute">
                  A moderately concerned manager has been notified.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setState("loading");
                  const res = await reportListing({ listingId, personId, reason });
                  setState(res.ok ? "done" : "error");
                }}
              >
                <p className="eyebrow">Moderation</p>
                <h3 className="headline mt-2 text-xl">Report this listing</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                  Impersonation, harassment, or something that shouldn&apos;t be
                  for sale — tell us, briefly.
                </p>
                <div className="mt-4">
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What's wrong?"
                    maxLength={500}
                    required
                  />
                </div>
                {state === "error" && (
                  <p className="mt-2 text-xs text-clay-deep">
                    Couldn&apos;t send the report — are you signed in?
                  </p>
                )}
                <div className="mt-5 flex gap-3">
                  <Button type="submit" loading={state === "loading"}>
                    Send report
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
