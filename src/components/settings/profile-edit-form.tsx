"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/app/(protected)/settings/settings-actions";

export function ProfileEditForm({
  fullName,
  batch,
  phone,
}: {
  fullName: string;
  batch: string;
  phone: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateMyProfile(formData);
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h2 className="text-sm font-semibold mb-4">Your Profile</h2>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Full Name
          </label>
          <input
            name="full_name"
            required
            defaultValue={fullName}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Batch
            </label>
            <input
              name="batch"
              defaultValue={batch}
              placeholder="e.g. CSE 45"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Phone
            </label>
            <input
              name="phone"
              defaultValue={phone}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {saved && <p className="text-xs text-primary">Profile updated.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
