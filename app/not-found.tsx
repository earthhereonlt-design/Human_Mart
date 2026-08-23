import Link from "next/link";
import { Chibi } from "@/components/manga/Mascot";

export default function NotFound() {
  return (
    <div className="container-page py-20 md:py-28">
      <div className="relative mx-auto max-w-xl overflow-hidden border-[3px] border-ink bg-cream shadow-[6px_6px_0_var(--color-ink)]">
        <div className="speedlines absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col items-center px-6 pb-12 pt-10 text-center">
          <span className="sfx sfx-outline text-5xl md:text-6xl">迷子!</span>
          <Chibi mood="problem" className="mt-8 h-56 w-auto md:h-64" />
          <h1 className="headline mt-8 text-3xl md:text-4xl">
            This shelf is empty.
          </h1>
          <p className="hand mt-3 max-w-sm text-lg leading-relaxed text-ink-mute">
            Whatever was here has been sold, moved, or never existed.
            The creature checked twice. Twice!
          </p>
          <Link
            href="/explore"
            className="mt-8 inline-flex h-12 items-center border-2 border-ink bg-clay px-8 font-display text-[13px] uppercase tracking-[0.1em] text-[#fbf8ee] shadow-[4px_4px_0_var(--color-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            Back to the market
          </Link>
        </div>
      </div>
    </div>
  );
}
