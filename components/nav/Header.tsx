"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";
import { ThemeToggle } from "@/components/manga/ThemeToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/explore#categories", label: "Categories" },
];

export function Header({ userName, isAdmin }: { userName: string | null; isAdmin?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* chapter strip — fixed ink bar, stays dark in the night chapter */}
      <div className="hidden items-center justify-between border-b-2 border-[#0e0c08] bg-[#16130e] px-6 py-1.5 text-[10px] font-medium uppercase tracking-[0.25em] text-[#f2eee2]/70 sm:flex">
        <span>
          <span className="jp text-clay">第一話</span> — every human, one price
        </span>
        <span>100% simulated · 0% serious</span>
      </div>

      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 20, delay: 0.1 }}
        className={cn(
          "sticky top-0 z-40 border-b-[3px] transition-all duration-300",
          scrolled
            ? "border-ink bg-ivory/95 shadow-[0_5px_0_rgba(22,19,14,0.12)] backdrop-blur-md"
            : "border-transparent bg-transparent"
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[74px]">
          {/* wordmark — hanko stamp + impact type */}
          <Link
            href="/"
            aria-label="Human Mart — home"
            className={cn(
              "group flex origin-left items-center gap-2.5 transition-transform duration-300",
              scrolled && "scale-[0.92]"
            )}
          >
            <span className="jp grid h-9 w-9 -rotate-3 place-items-center border-2 border-ink bg-clay text-lg leading-none text-cream shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-300 group-hover:rotate-3">
              人
            </span>
            <span className="headline text-xl tracking-wide md:text-[22px]">
              Human&nbsp;Mart
            </span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="page-link headline text-[13px] tracking-[0.08em] text-ink-soft transition-colors hover:text-clay"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="jp -rotate-1 border-2 border-clay px-2 py-0.5 text-[11px] text-clay transition-colors hover:bg-clay hover:text-[#fbf8ee]"
              >
                管理人
              </Link>
            )}
          </nav>

          {/* actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link
              href="/explore"
              aria-label="Search the market"
              className="grid h-10 w-10 place-items-center border-2 border-transparent text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <Search size={18} strokeWidth={2} />
            </Link>

            <Link
              href="/cart"
              data-cart-icon
              aria-label={`Cart${mounted && count > 0 ? `, ${count} items` : ", empty"}`}
              className="relative grid h-10 w-10 place-items-center border-2 border-transparent text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <ShoppingBag size={18} strokeWidth={2} />
              {mounted && count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={cn(
                    "absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center border-2 border-ink bg-clay px-1 text-[9px] font-bold tabular-nums text-[#fbf8ee]",
                    "pulse-ring"
                  )}
                >
                  {count}
                </motion.span>
              )}
            </Link>

            <ThemeToggle />

            <Link
              href={userName ? "/account" : "/login"}
              aria-label={userName ? "Your account" : "Sign in"}
              className="hidden h-10 w-10 place-items-center border-2 border-transparent text-ink-soft transition-colors hover:border-ink hover:text-ink md:grid"
            >
              <User size={18} strokeWidth={2} />
            </Link>

            <Link
              href="/list"
              className="ml-1 hidden h-10 items-center border-2 border-ink bg-clay px-4 font-display text-[12px] uppercase tracking-[0.1em] text-[#fbf8ee] shadow-[3px_3px_0_var(--color-ink)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none md:inline-flex"
            >
              List a human
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center border-2 border-ink bg-cream text-ink shadow-[3px_3px_0_var(--color-ink)] md:hidden"
            >
              {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-16 z-30 border-b-[3px] border-ink bg-ivory px-6 pb-8 pt-4 shadow-[0_10px_0_rgba(22,19,14,0.15)] md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {[
                { href: "/explore", label: "Explore" },
                { href: "/explore#categories", label: "Categories" },
                { href: userName ? "/account" : "/login", label: userName ? `Account — ${userName}` : "Sign in" },
                { href: "/cart", label: "Cart" },
                ...(isAdmin ? [{ href: "/admin", label: "管理人 Admin" }] : []),
              ].map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={l.href}
                    className="headline block border-b-2 border-ink/15 py-4 text-xl"
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/list"
                onClick={() => setMenuOpen(false)}
                className="mt-5 inline-flex h-12 items-center justify-center border-2 border-ink bg-clay font-display text-[13px] uppercase tracking-[0.1em] text-[#fbf8ee] shadow-[4px_4px_0_var(--color-ink)]"
              >
                List a human
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
