"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

/** Friendly, tech-free error copy — visitors never see provider jargon. */
function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  const status = (err as { status?: number } | null)?.status;
  if (msg.includes("rate limit") || msg.includes("too many") || status === 429)
    return "The mail owl is tired — too many attempts in a short while. Give it a minute, then try again.";
  if (msg.includes("already registered"))
    return "That email already belongs to a human. Try signing in instead.";
  if (msg.includes("invalid login credentials"))
    return "That email and password don't match any human.";
  if (msg.includes("at least 6 characters"))
    return "Passwords need at least 6 characters.";
  if (msg.includes("valid email") || msg.includes("invalid email"))
    return "That email address looks imaginary.";
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Can't reach the market right now — check your connection.";
  return "Something went wrong on our side. Please try again.";
}

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (isRegister) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (err) throw err;
        if (data.session) {
          router.push(next || "/account");
          router.refresh();
        } else {
          setNeedsConfirmation(true);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(next || "/account");
        router.refresh();
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="border border-sand bg-cream p-8 text-center">
        <p className="headline text-2xl">Almost in.</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-mute">
          One more step — a confirmation letter is on its way to your inbox.
          Click the link inside, then sign in. If nothing arrives, wait a
          minute and try registering again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate={false}>
      {isRegister && (
        <Field label="Your name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name, human"
            autoComplete="name"
            required
            minLength={2}
          />
        </Field>
      )}
      <Field label="Email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@somewhere.in"
          autoComplete="email"
          required
        />
      </Field>
      <Field
        label="Password"
        required
        hint={isRegister ? "At least 6 characters." : undefined}
      >
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={6}
        />
      </Field>

      {error && (
        <p role="alert" className="border border-clay/30 bg-clay-tint/50 px-4 py-3 text-sm text-clay-deep">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={loading} className="mt-1">
        {isRegister ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-ink-mute">
        {isRegister ? (
          <>
            Already human?{" "}
            <Link href="/login" className="link-editorial text-ink">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="link-editorial text-ink">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
