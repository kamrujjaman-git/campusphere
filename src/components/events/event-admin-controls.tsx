"use client";

import { useState, useTransition } from "react";
import {
  updateEventStatus,
  generateEventContributions,
} from "@/app/(protected)/events/event-actions";
import type { EventStatus } from "@/types/event";
import { Dropdown } from "@/components/ui/dropdown";

export function EventAdminControls({
  eventId,
  currentStatus,
  extraContributionAmount,
}: {
  eventId: string;
  currentStatus: EventStatus;
  extraContributionAmount: number;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleStatusChange = (newStatus: EventStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      await updateEventStatus(eventId, newStatus);
    });
  };

  const handleGenerateDues = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await generateEventContributions(eventId);
        setMessage(
          result.created > 0
            ? `Created ${result.created} due entries of ৳${extraContributionAmount}.`
            : "All members already have this event's due."
        );
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      <h2 className="text-sm font-semibold">Admin Controls</h2>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Event Status
        </label>
        <div className="w-full sm:w-56">
          <Dropdown
            value={status}
            onValueChange={(value) => handleStatusChange(value as EventStatus)}
            options={[{ value: "upcoming", label: "Upcoming" }, { value: "ongoing", label: "Ongoing" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]}
            aria-label="Event status"
          />
        </div>
      </div>

      {extraContributionAmount > 0 && (
        <div>
          <button
            onClick={handleGenerateDues}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending
              ? "Working..."
              : `Generate ৳${extraContributionAmount} Due for All Members`}
          </button>
          {message && (
            <p className="text-xs text-muted-foreground mt-1.5">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
