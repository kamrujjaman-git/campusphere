"use client";

import { useState, useTransition } from "react";
import { updateCommunityBranding } from "@/app/(protected)/settings/settings-actions";

export function CommunityBrandingSettings({
    communityName,
    logoUrl,
    faviconUrl,
}: {
    communityName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
}) {
    const [name, setName] = useState(communityName);
    const [logo, setLogo] = useState(logoUrl ?? "");
    const [favicon, setFavicon] = useState(faviconUrl ?? "");
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            try {
                await updateCommunityBranding(formData);
                setMessage("Community branding updated.");
            } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "Unable to update branding.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div>
                <h2 className="text-sm font-semibold">Community Branding</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Customize the name and artwork shown across your community.
                </p>
            </div>

            <label className="block text-xs text-muted-foreground">
                Community Name
                <input
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={120}
                    className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
            </label>

            <label className="block text-xs text-muted-foreground">
                Community Logo URL
                <input
                    name="logo_url"
                    type="url"
                    value={logo}
                    onChange={(event) => setLogo(event.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="mt-1 block text-[11px]">Recommended: Square PNG/JPEG, 1:1 ratio (e.g. 512x512px, max 2MB)</span>
            </label>

            <label className="block text-xs text-muted-foreground">
                Community Favicon URL
                <input
                    name="favicon_url"
                    type="url"
                    value={favicon}
                    onChange={(event) => setFavicon(event.target.value)}
                    placeholder="https://example.com/favicon.png"
                    className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="mt-1 block text-[11px]">Recommended: ICO/PNG format, 1:1 ratio (e.g. 32x32px or 64x64px, max 500KB)</span>
            </label>

            <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
                {isPending ? "Saving..." : "Save Branding"}
            </button>

            {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
            {message && <p className="text-xs text-primary" role="status">{message}</p>}
        </form>
    );
}
