import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { ChapterCard } from "@/components/manga/ChapterCard";
import { Chibi } from "@/components/manga/Mascot";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="container-page flex justify-center py-20 md:py-28">
      <div className="w-full max-w-sm">
        <div className="flex items-end justify-center gap-3">
          <Chibi mood="waiting" className="h-36 w-auto" />
          <p className="bubble mb-6 max-w-40 px-4 py-3">
            <span className="hand text-base leading-snug text-ink-soft">
              Back so soon? The usual table?
            </span>
          </p>
        </div>
        <div className="mt-6">
          <ChapterCard jp="幕間" title="Sign in, human." sub="Interlude — welcome back" />
        </div>
        <div className="mt-8">
          <AuthForm mode="login" next={next} />
        </div>
      </div>
    </div>
  );
}
