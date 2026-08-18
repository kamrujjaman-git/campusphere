"use client";

import Image from "next/image";
import { SignOutButton } from "@/components/layout/sign-out-button";

export function Header({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const initial = userName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="md:hidden flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="PLAYBOYZ logo"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span className="font-black text-primary tracking-tight">
          PLAYBOYZ
        </span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-tight">{userName}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {userEmail}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          {initial}
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}