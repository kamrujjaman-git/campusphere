"use client";

import { useTransition } from "react";
import { deleteAnnouncement } from "@/app/(protected)/announcements/announcement-actions";
import { Megaphone, Trash2 } from "lucide-react";
import type { Announcement } from "@/types/announcement";

export function AnnouncementCard({
  announcement,
  canManage,
}: {
  announcement: Announcement;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      await deleteAnnouncement(announcement.id);
    });
  };

  const date = new Date(announcement.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Megaphone size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {announcement.body}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {announcement.author_name && `${announcement.author_name} · `}
              {date}
            </p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive disabled:opacity-50 flex-shrink-0"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
