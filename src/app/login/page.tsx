"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function LoginContent() {
  const searchParams = useSearchParams();
  const isInactive = searchParams.get("error") === "inactive";
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <div className="relative flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-white/10 bg-card/75 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
        <Image
          src="/logo.png"
          alt="PLAYBOYZ logo"
          width={88}
          height={88}
          className="rounded-2xl mb-1"
          priority
        />
        <h1 className="text-3xl font-black tracking-tight text-primary">PLAYBOYZ</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue
        </p>
        {isInactive && (
          <div
            role="alert"
            className="w-full max-w-sm rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
          >
            Your account is inactive. Please contact an admin for access.
          </div>
        )}
        <button
          onClick={handleGoogleLogin}
          className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition-transform hover:-translate-y-0.5 hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="h-[88px] w-[88px] animate-pulse rounded-2xl bg-secondary" />
        <div className="h-8 w-32 animate-pulse rounded-lg bg-secondary" />
        <div className="h-5 w-40 animate-pulse rounded-lg bg-secondary" />
        <div className="h-10 w-48 animate-pulse rounded-md bg-secondary" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
