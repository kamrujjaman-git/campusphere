"use client";

import { useTransition } from "react";
import { setRsvp } from "@/app/(protected)/events/event-actions";
import { Check, X } from "lucide-react";
import type { RsvpStatus } from "@/types/event";

export function RsvpButtons({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: RsvpStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = (status: RsvpStatus) => {
    startTransition(async () => {
      await setRsvp(eventId, status);
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleClick("going")}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          currentStatus === "going"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <Check size={14} />
        Going
      </button>
      <button
        onClick={() => handleClick("not_going")}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          currentStatus === "not_going"
            ? "bg-destructive text-destructive-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <X size={14} />
        Not Going
      </button>
    </div>
  );
}
