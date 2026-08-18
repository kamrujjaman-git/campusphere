"use client";

import { useState, useTransition } from "react";
import { setRsvp } from "@/app/(protected)/events/event-actions";
import { Check, HelpCircle, X } from "lucide-react";
import type { RsvpStatus } from "@/types/event";

export function RsvpButtons({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: RsvpStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  const handleClick = (nextStatus: RsvpStatus) => {
    const previousStatus = status;
    setStatus(nextStatus);
    setError(null);

    startTransition(async () => {
      try {
        await setRsvp(eventId, nextStatus);
      } catch (error) {
        setStatus(previousStatus);
        setError(
          error instanceof Error ? error.message : "Unable to update RSVP."
        );
      }
    });
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => handleClick("going")}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${status === "going"
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${status === "not_going"
              ? "bg-destructive text-destructive-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
        >
          <X size={14} />
          Not Going
        </button>
        <button
          onClick={() => handleClick("pending")}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${status === "pending"
              ? "bg-secondary text-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
        >
          <HelpCircle size={14} />
          Maybe
        </button>
      </div>
      {isPending && (
        <p className="text-xs text-muted-foreground mt-2">Saving RSVP...</p>
      )}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
