"use client";

import Image from "next/image";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AvatarDisplay } from "@/components/members/avatar-display";
import { RoleBadge } from "@/components/members/role-badge";
import type { UserRole } from "@/types/profile";

export function Header({
  userName,
  userEmail,
  userRole,
  avatarUrl,
}: {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  avatarUrl: string | null;
}) {
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
          <div className="flex items-center justify-end gap-2">
            <p className="text-sm font-medium leading-tight">{userName}</p>
            <RoleBadge role={userRole} />
          </div>
          <p className="text-xs text-muted-foreground leading-tight">
            {userEmail}
          </p>
        </div>
        <ThemeToggle />
        <AvatarDisplay name={userName} avatarUrl={avatarUrl} />
        <SignOutButton />
      </div>
    </header>
  );
}