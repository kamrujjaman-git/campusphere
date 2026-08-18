"use client";

import { useTransition, useState } from "react";
import { generateWeeklyDues } from "@/app/(protected)/finance/actions";
import { RefreshCw } from "lucide-react";

export function GenerateWeeklyDuesButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await generateWeeklyDues();
        setMessage(
          result.count > 0
            ? `Created ${result.count} new due entries.`
            : "All members already have this week's due."
        );
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Generating..." : "Generate This Week's Dues"}
      </button>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
