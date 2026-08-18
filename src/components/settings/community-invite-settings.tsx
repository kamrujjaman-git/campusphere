"use client";

import { useState, useTransition } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { regenerateCommunityKey } from "@/app/(protected)/settings/settings-actions";

export function CommunityInviteSettings({
    communityDomain,
    communityKey,
}: {
    communityDomain: string;
    communityKey: string;
}) {
    const [key, setKey] = useState(communityKey);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    const copyKey = async () => {
        await navigator.clipboard.writeText(key);
        setMessage("Community key copied.");
    };

    const regenerate = () => {
        if (!window.confirm("Regenerate this key? Existing invite links using it will stop working.")) return;
        setMessage(null);
        startTransition(async () => {
            try {
                const result = await regenerateCommunityKey();
                if (!result.success) {
                    setMessage(result.error ?? "Unable to regenerate key.");
                    return;
                }
                setKey(result.key ?? key);
                setMessage("Community key regenerated.");
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "Unable to regenerate key.");
            }
        });
    };

    return (
        <div className="rounded-xl border border-primary/25 bg-card p-5">
            <div className="mb-4">
                <h2 className="text-sm font-semibold">Community Invite Settings</h2>
                <p className="mt-1 text-xs text-muted-foreground">Share this key only with members from the verified university domain.</p>
            </div>
            <div className="space-y-3">
                <div>
                    <p className="text-xs text-muted-foreground">Community Domain</p>
                    <p className="mt-1 font-mono text-sm">{communityDomain}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Community Secret Key</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                        <code className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-sm tracking-wide">{key}</code>
                        <button type="button" onClick={copyKey} aria-label="Copy community key" title="Copy key" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                            <Copy size={15} aria-hidden="true" /> Copy Key
                        </button>
                    </div>
                </div>
                <button type="button" onClick={regenerate} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">
                    <RefreshCw size={15} aria-hidden="true" />
                    {isPending ? "Regenerating..." : "Regenerate Key"}
                </button>
                {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
            </div>
        </div>
    );
}
