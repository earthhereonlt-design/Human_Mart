import Link from "next/link";
import { LuckyCat } from "@/components/manga/Mascot";
import { Reveal } from "@/components/manga/Reveal";

export function Footer() {
  return (
    <footer className="relative mt-24 bg-night text-[#f2eee2]/80 md:mt-32">
      <div className="halftone-ghost absolute inset-0" aria-hidden="true" />
      <div className="h-2 bg-clay" aria-hidden="true" />
      <div className="container-page relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <Reveal>
          <div>
          <p className="flex items-center gap-3">
            <span className="jp grid h-10 w-10 -rotate-3 place-items-center border-2 border-[#f2eee2]/80 bg-clay text-xl leading-none text-[#fbf8ee] shadow-[3px_3px_0_rgba(251,248,238,0.4)]">
              人
            </span>
            <span className="headline text-[#f2eee2] text-2xl md:text-3xl">
              Human&nbsp;Mart
            </span>
          </p>
          <p className="hand mt-5 max-w-sm text-[17px] leading-relaxed text-[#f2eee2]/60">
            A marketplace for human talents, listed with the seriousness they
            deserve. Backend building, chai making, wedding speeches — all fine
            goods here.
          </p>
          <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#f2eee2]/40">
            Payments simulated · No humans commodified
          </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <nav aria-label="Market">
            <p className="eyebrow !text-clay">The market</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link href="/explore" className="link-editorial hover:text-[#f2eee2]">Explore everything</Link></li>
              <li><Link href="/explore#categories" className="link-editorial hover:text-[#f2eee2]">Categories</Link></li>
              <li><Link href="/list" className="link-editorial hover:text-[#f2eee2]">List a human</Link></li>
              <li><Link href="/cart" className="link-editorial hover:text-[#f2eee2]">Your cart</Link></li>
            </ul>
          </nav>
        </Reveal>

        <Reveal delay={0.24}>
          <nav aria-label="Company">
          <p className="eyebrow !text-clay">The concept</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link href="/#how" className="link-editorial hover:text-[#f2eee2]">How it works</Link></li>
            <li><Link href="/login" className="link-editorial hover:text-[#f2eee2]">Sign in</Link></li>
            <li><Link href="/register" className="link-editorial hover:text-[#f2eee2]">Create an account</Link></li>
          </ul>
          <div className="relative mt-8 hidden md:block">
            <div className="m-breathe-slow">
              <LuckyCat className="h-36 w-auto drop-shadow-[4px_4px_0_rgba(0,0,0,0.6)]" />
            </div>
            <p className="hand absolute -bottom-1 left-20 text-sm text-[#f2eee2]/50">
              open forever, apparently
            </p>
          </div>
        </nav>
        </Reveal>
      </div>

      <div className="relative border-t-2 border-[#f2eee2]/15">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[11px] text-[#f2eee2]/40 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Human Mart. An experiment in human commerce.</p>
          <p className="jp text-[#f2eee2]/50">
            次のページへ <span aria-hidden="true">→</span>
            <span className="sr-only">— to be continued</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
