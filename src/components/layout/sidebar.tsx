"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarDays,
  Megaphone,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
        <Image
          src="/logo.png"
          alt="PLAYBOYZ logo"
          width={32}
          height={32}
          className="rounded-lg flex-shrink-0"
        />
        <span className="text-xl font-black tracking-tight text-primary">
          PLAYBOYZ
        </span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <item.icon
                className={`relative w-4.5 h-4.5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                size={18}
              />
              <span
                className={`relative ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
