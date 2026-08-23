"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
        {label}
        {required && <span className="ml-1 text-clay">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-clay-deep">
          {error}
        </p>
      )}
    </div>
  );
}

const baseInput =
  "h-11 w-full rounded-none border-2 bg-cream px-3.5 text-sm text-ink placeholder:text-ink-faint " +
  "transition-all duration-200 focus:outline-none focus:shadow-[3px_3px_0_var(--color-clay)] " +
  "border-stone hover:border-ink/60 focus:border-ink";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} className={cn(baseInput, invalid && "border-clay", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(baseInput, "h-auto min-h-28 py-3 leading-relaxed", invalid && "border-clay", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <select ref={ref} className={cn(baseInput, "cursor-pointer appearance-none pr-8", invalid && "border-clay", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";
