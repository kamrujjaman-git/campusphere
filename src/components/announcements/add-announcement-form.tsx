"use client";

import { useState, useRef, useTransition } from "react";
import { createAnnouncement } from "@/app/(protected)/announcements/announcement-actions";
import { Plus, X } from "lucide-react";

export function AddAnnouncementForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await createAnnouncement(formData);
        formRef.current?.reset();
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus size={14} />
        New Announcement
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Post Announcement</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Title
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Practice moved to Saturday"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Message
          </label>
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Details for everyone..."
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post Announcement"}
        </button>
      </form>
    </div>
  );
}
