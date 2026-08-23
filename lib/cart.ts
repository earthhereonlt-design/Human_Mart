"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (listingId: string) => void;
  setQty: (listingId: string, qty: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.listingId === line.listingId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.listingId === line.listingId
                  ? { ...l, qty: Math.min(99, l.qty + qty) }
                  : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, qty }] };
        }),
      remove: (listingId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.listingId !== listingId),
        })),
      setQty: (listingId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.listingId !== listingId)
              : state.lines.map((l) =>
                  l.listingId === listingId ? { ...l, qty: Math.min(99, qty) } : l
                ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "human-mart-cart" }
  )
);

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.qty, 0);

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.qty * l.price, 0);

/**
 * Simulated pricing breakdown — deterministic, restrained, playful:
 *  – "Human touch" 10% off orders of ₹500+
 *  – a modest service fee per item (the marketplace parody)
 */
export function computeTotals(lines: CartLine[]) {
  const subtotal = cartSubtotal(lines);
  const humanTouch = subtotal >= 500 ? Math.round(subtotal * 0.1) : 0;
  const items = cartCount(lines);
  const serviceFee = items * 9;
  return {
    subtotal,
    humanTouch,
    serviceFee,
    total: Math.max(0, subtotal - humanTouch + serviceFee),
  };
}
