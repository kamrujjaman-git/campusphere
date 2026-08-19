"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CommunityInviteSettings({
    communityDomain,
    communityKey,
}: {
    communityDomain: string;
    communityKey: string;
}) {
    const key = communityKey;
    const [message, setMessage] = useState<string | null>(null);

    const copyKey = async () => {
        await navigator.clipboard.writeText(key);
        setMessage("Community key copied.");
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
                {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
            </div>
        </div>
    );
}
