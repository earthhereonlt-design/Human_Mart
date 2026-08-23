"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

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
      setError(
        err instanceof Error
          ? err.message === "Invalid login credentials"
            ? "That email and password don't match any human."
            : err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="border border-sand bg-cream p-8 text-center">
        <p className="headline text-2xl">Almost in.</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-mute">
          Supabase wants to confirm your email first. Click the link it just
          sent you, then sign in. (To skip this in local development, disable
          &ldquo;Confirm email&rdquo; in Supabase → Authentication → Sign-in providers.)
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
