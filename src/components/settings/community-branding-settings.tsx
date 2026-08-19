"use client";

import { useRef, useState, useTransition } from "react";
import { updateCommunityBranding } from "@/app/(protected)/settings/settings-actions";
import { ImagePlus } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"];

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
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const chooseFile = (file: File | undefined, setFile: (value: File | null) => void) => {
        setError(null);
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Choose a JPEG, PNG, WEBP, or ICO image.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError("Branding images must be 2 MB or smaller.");
            return;
        }
        setFile(file);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        const formData = new FormData(event.currentTarget);
        if (logoFile) formData.set("logo", logoFile);
        if (faviconFile) formData.set("favicon", faviconFile);
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

            <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Community Logo</p>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0], setLogoFile)} className="sr-only" />
                <button type="button" onClick={() => logoInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0], setLogoFile); }} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-secondary px-3 py-4 text-left text-sm hover:border-primary">
                    <ImagePlus size={18} aria-hidden="true" />
                    <span>{logoFile?.name ?? (logoUrl ? "Replace current logo" : "Choose or drop a logo")}</span>
                </button>
                <span className="block text-[11px] text-muted-foreground">JPEG, PNG, or WEBP, up to 2 MB.</span>
            </div>

            <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Community Favicon</p>
                <input ref={faviconInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/x-icon" onChange={(event) => chooseFile(event.target.files?.[0], setFaviconFile)} className="sr-only" />
                <button type="button" onClick={() => faviconInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0], setFaviconFile); }} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-secondary px-3 py-4 text-left text-sm hover:border-primary">
                    <ImagePlus size={18} aria-hidden="true" />
                    <span>{faviconFile?.name ?? (faviconUrl ? "Replace current favicon" : "Choose or drop a favicon")}</span>
                </button>
                <span className="block text-[11px] text-muted-foreground">JPEG, PNG, WEBP, or ICO, up to 2 MB.</span>
            </div>

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
