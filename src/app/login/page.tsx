"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
