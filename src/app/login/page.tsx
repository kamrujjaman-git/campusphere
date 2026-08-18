"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8">
        <Image
          src="/logo.png"
          alt="PLAYBOYZ logo"
          width={88}
          height={88}
          className="rounded-2xl mb-1"
          priority
        />
        <h1 className="text-2xl font-bold">PLAYBOYZ</h1>
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
          className="rounded-md border px-6 py-2 font-medium hover:bg-accent"
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
