"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initial), [initial]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // debounced smart-search navigation
  useEffect(() => {
    if (value === initial) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="relative flex h-13 items-center border border-sand bg-cream transition-all duration-200 focus-within:-translate-y-0.5 focus-within:border-ink focus-within:shadow-[4px_4px_0_var(--color-clay)]"
    >
      <span className="grid w-12 place-items-center text-ink-mute">
        {isPending ? (
          <Loader2 size={17} className="animate-spin" strokeWidth={1.5} />
        ) : (
          <Search size={17} strokeWidth={1.5} />
        )}
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Try "backend", "chai", "someone funny"…'
        aria-label="Search the market"
        className="h-full w-full bg-transparent pr-11 text-sm text-ink placeholder:text-ink-faint focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          className="absolute right-3 grid h-7 w-7 place-items-center text-ink-faint transition-colors hover:text-ink"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      )}
    </form>
  );
}

export function CategoryChips({
  categories,
  counts,
  active,
}: {
  categories: readonly string[];
  counts: Record<string, number>;
  active?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const navigate = (cat?: string) => {
    const next = new URLSearchParams(params.toString());
    if (cat) next.set("category", cat);
    else next.delete("category");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div id="categories" className="flex flex-wrap gap-2 scroll-mt-24">
      <motion.button
        type="button"
        onClick={() => navigate()}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.94, y: 0 }}
        className={cn(
          "relative h-9 border px-3.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
          !active ? "border-ink" : "border-sand bg-transparent text-ink-mute hover:border-stone hover:text-ink"
        )}
      >
        {!active && (
          <motion.span
            layoutId="chip-pill"
            transition={springSnappy}
            className="absolute inset-0 bg-ink"
            aria-hidden="true"
          />
        )}
        <span className={cn("relative z-10", !active && "text-cream")}>All</span>
      </motion.button>
      {categories.map((c) => (
        <motion.button
          key={c}
          type="button"
          onClick={() => navigate(c)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94, y: 0 }}
          className={cn(
            "relative h-9 border px-3.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
            active === c ? "border-ink" : "border-sand bg-transparent text-ink-mute hover:border-stone hover:text-ink"
          )}
        >
          {active === c && (
            <motion.span
              layoutId="chip-pill"
              transition={springSnappy}
              className="absolute inset-0 bg-ink"
              aria-hidden="true"
            />
          )}
          <span className={cn("relative z-10", active === c && "text-cream")}>
            {c}
            <span className="ml-1.5 tabular-nums opacity-60">{counts[c] ?? 0}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get("sort") ?? "newest";

  return (
    <label className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
      Sort
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }}
        className="h-9 cursor-pointer rounded-[2px] border border-sand bg-cream px-2.5 text-[11px] tracking-normal text-ink focus:border-ink focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price — low to high</option>
        <option value="price-desc">Price — high to low</option>
        <option value="rating">Highest rated</option>
      </select>
    </label>
  );
}
