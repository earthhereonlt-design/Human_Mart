"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Manga onomatopoeia for a star value — the fun cousin of "4.8". */
function sfxLabel(value: number): string {
  if (value >= 4.5) return "神!!";
  if (value >= 3.5) return "イイ!";
  if (value >= 2.5) return "まあまあ";
  if (value > 0) return "うーん";
  return "新着";
}

export function Stars({
  value,
  count,
  size = 13,
  className,
}: {
  value: number; // 0–5
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 340, damping: 17 }}
            style={{ width: size, height: size }}
            className="inline-block"
          >
            <Star
              style={{ width: "100%", height: "100%" }}
              className={i <= Math.round(value) ? "fill-clay text-clay" : "text-stone"}
              strokeWidth={1.5}
            />
          </motion.span>
        ))}
      </span>
      <span className="text-xs text-ink-mute">
        {value > 0 ? value.toFixed(1) : "New"}
        {count !== undefined && count > 0 && ` (${count})`}
      </span>
      <span className="jp text-[10px] font-bold leading-none text-clay" aria-hidden="true">
        {sfxLabel(value)}
      </span>
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-1 transition-transform duration-150 hover:scale-110"
        >
          <Star
            className={i <= shown ? "fill-clay text-clay" : "text-stone"}
            strokeWidth={1.5}
            size={20}
          />
        </button>
      ))}
    </div>
  );
}
