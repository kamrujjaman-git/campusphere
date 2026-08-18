"use client";

import { useRef, useState, useTransition } from "react";
import { saveAvatar } from "@/app/(protected)/settings/settings-actions";
import { ImagePlus, RotateCcw } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export function AvatarUpload({ avatarUrl }: { avatarUrl: string | null }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState(avatarUrl);
    const [source, setSource] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleFile = (file: File | undefined) => {
        setError(null);
        setSaved(false);
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Choose a JPEG or PNG image.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError("Avatar images must be 2 MB or smaller.");
            return;
        }
        setSource(URL.createObjectURL(file));
        setZoom(1);
    };

    const handleSave = () => {
        if (!source) return;
        setError(null);
        startTransition(async () => {
            const image = new Image();
            image.src = source;
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Unable to read this image."));
            });

            const size = 512;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext("2d");
            if (!context) {
                setError("Your browser could not prepare the avatar image.");
                return;
            }

            const cropSize = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
            const sourceX = (image.naturalWidth - cropSize) / 2;
            const sourceY = (image.naturalHeight - cropSize) / 2;
            context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, size, size);

            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", 0.82)
            );
            if (!blob || blob.size > MAX_FILE_SIZE) {
                setError("The cropped avatar must be 2 MB or smaller.");
                return;
            }

            const formData = new FormData();
            formData.append("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
            try {
                const result = await saveAvatar(formData);
                if (!result.success) {
                    setError(result.error ?? null);
                    return;
                }
                setPreview(result.avatarUrl ?? null);
                setSource(null);
                setSaved(true);
            } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "Unable to save avatar.");
            }
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {source || preview ? (
                    <div
                        role="img"
                        aria-label="Profile avatar preview"
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${source ?? preview})` }}
                    />
                ) : (
                    <ImagePlus size={28} className="text-muted-foreground" aria-hidden="true" />
                )}
            </div>
            <div className="w-full space-y-3">
                <div>
                    <p className="text-sm font-semibold">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">Square JPEG or PNG, up to 2 MB.</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                    className="sr-only"
                />
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
                        Choose Image
                    </button>
                    {source && (
                        <button type="button" onClick={() => setSource(null)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                            <RotateCcw size={14} aria-hidden="true" /> Cancel
                        </button>
                    )}
                </div>
                {source && (
                    <label className="block text-xs text-muted-foreground">
                        Crop zoom
                        <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-primary" />
                    </label>
                )}
                {source && <button type="button" onClick={handleSave} disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{isPending ? "Saving..." : "Save Picture"}</button>}
                {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
                {saved && <p className="text-xs text-primary" role="status">Profile picture updated.</p>}
            </div>
        </div>
    );
}
