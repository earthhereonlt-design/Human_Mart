import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { Chibi } from "@/components/manga/Mascot";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="container-page flex justify-center py-20 md:py-28">
      <div className="w-full max-w-sm">
        <div className="flex items-end justify-center gap-3">
          <Chibi mood="curious" className="h-36 w-auto" />
          <p className="bubble mb-6 max-w-40 px-4 py-3">
            <span className="hand text-base leading-snug text-ink-soft">
              Oh! A new face. Welcome, welcome.
            </span>
          </p>
        </div>
        <div className="mt-6">
          <ChapterCard
            jp="幕間"
            title="Register to list, buy, review."
            sub="Interlude — join the market"
          />
        </div>
        <p className="mt-4 text-sm text-ink-mute">
          No OTP. No ceremony. Just the usual name–email–password.
        </p>
        <div className="mt-8">
          <AuthForm mode="register" next={next} />
        </div>
      </div>
    </div>
  );
}
