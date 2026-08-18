"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/app/(protected)/events/event-actions";
import { Trash2 } from "lucide-react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleDelete = () => {
        if (!window.confirm("Delete this event, its RSVPs, and its event contributions?")) return;
        setError(null);
        startTransition(async () => {
            try {
                await deleteEvent(eventId);
                router.push("/events");
                router.refresh();
            } catch (deleteError) {
                setError(deleteError instanceof Error ? deleteError.message : "Unable to delete event.");
            }
        });
    };

    return (
        <div>
            <button type="button" onClick={handleDelete} disabled={isPending} aria-label="Delete event" title="Delete event" className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">
                <Trash2 size={13} aria-hidden="true" />
                {isPending ? "Deleting..." : "Delete"}
            </button>
            {error && <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>}
        </div>
    );
}
