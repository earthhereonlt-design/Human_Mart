"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "human-mart-theme";

/** Night-chapter toggle — flips the whole site to ink-black paper. */
export function ThemeToggle() {
  const [night, setNight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNight(document.documentElement.dataset.theme === "night");
  }, []);

  const toggle = () => {
    const next = !night;
    setNight(next);
    document.documentElement.dataset.theme = next ? "night" : "";
    try {
      localStorage.setItem(KEY, next ? "night" : "paper");
    } catch {
      // private mode — theme lasts only this visit
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={night ? "Switch to paper (light) chapter" : "Switch to night chapter"}
      aria-pressed={night}
      className="grid h-10 w-10 place-items-center border-2 border-transparent text-ink-soft transition-colors hover:border-ink hover:text-clay"
    >
      {mounted && night ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  );
}
