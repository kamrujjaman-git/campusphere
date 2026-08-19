"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = searchParams.get("error");
  const errorDetail = searchParams.get("error_detail");
  const tabParam = searchParams.get("tab");
  const initialMode = tabParam === "join" || tabParam === "create" ? tabParam : "signin";
  const [mode, setMode] = useState<"signin" | "join" | "create">(initialMode);
  const [communityKey, setCommunityKey] = useState(searchParams.get("community_key") ?? "");
  const [communityName, setCommunityName] = useState("");
  const supabase = createClient();

  const changeMode = (nextMode: "signin" | "join" | "create") => {
    setMode(nextMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextMode);
    params.delete("error");
    router.replace(`/login?${params.toString()}`);
  };

  const handleGoogleLogin = async () => {
    const callbackUrl = new URL(
      `${window.location.origin}/auth/callback`
    );
    callbackUrl.searchParams.set("tab", mode);
    if (mode === "join") {
      if (!communityKey.trim()) return;
      callbackUrl.searchParams.set("community_key", communityKey.trim().toLowerCase());
    }
    if (mode === "create") {
      if (!communityName.trim()) return;
      callbackUrl.searchParams.set("create_community_name", communityName.trim());
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
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
        <p className="text-sm text-muted-foreground">Access your PLAYBOYZ community</p>
        <div className="grid w-full grid-cols-3 rounded-xl border border-border bg-secondary p-1">
          {[["signin", "Sign In"], ["join", "Join Community"], ["create", "Create Community"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => changeMode(value as typeof mode)} className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${mode === value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
        {errorCode && (
          <div role="alert" className="w-full rounded-xl border-2 border-destructive bg-destructive/15 px-4 py-3 text-center text-sm font-semibold text-destructive">
            {errorCode === "invalid_domain"
              ? "Sign-in blocked: only official university emails ending in .edu or .edu.bd are permitted."
              : errorCode === "unregistered_user"
                ? "No active community profile found. Please create or join a community first."
                : errorCode === "already_registered"
                  ? "Your account is already registered to another community."
                  : errorCode === "not_owner"
                    ? "You Are Not The Owner. Use Join Community to access a university community."
                    : errorCode === "community_domain_mismatch"
                      ? "This email does not match the community's registered university domain."
                      : errorCode === "community_not_found"
                        ? "Community key not found. Check the key and try again."
                        : errorCode === "inactive"
                          ? "Your account is inactive. Please contact an admin for access."
                          : errorCode === "db_error"
                            ? `Community creation failed${errorDetail ? `: ${errorDetail}` : ". Please try again."}`
                            : "Authentication failed. Please try again."}
          </div>
        )}
        <div className="w-full space-y-3">
          {mode === "join" && (
            <input value={communityKey} onChange={(event) => setCommunityKey(event.target.value)} placeholder="Community Key" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          )}
          {mode === "create" && (
            <input value={communityName} onChange={(event) => setCommunityName(event.target.value)} placeholder="Community name" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          )}
        </div>
        <p className="w-full rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-center text-xs leading-5 text-muted-foreground">
          Only official university emails (.edu / .edu.bd) are permitted. Personal Gmail accounts will be rejected.
        </p>
        <button
          onClick={handleGoogleLogin}
          disabled={(mode === "join" && !communityKey.trim()) || (mode === "create" && !communityName.trim())}
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
