"use client";

import { useState, useTransition } from "react";
import { deleteCommunity, updateCommunity } from "@/app/(protected)/owner/actions";

type Community = {
    id: string;
    name: string;
    domain: string;
    key: string;
    created_at: string;
    status: string;
    totalMembers: number;
};

export function OwnerCommunityList({ communities }: { communities: Community[] }) {
    const [items, setItems] = useState(communities);
    const [editing, setEditing] = useState<Community | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const save = () => {
        if (!editing) return;
        startTransition(async () => {
            const result = await updateCommunity(editing.id, editing.name, editing.domain, editing.key, editing.status as "active" | "suspended");
            if (result.success) {
                setItems((current) => current.map((item) => item.id === editing.id ? editing : item));
                setEditing(null);
            } else setError(result.error ?? null);
        });
    };

    const remove = (id: string) => {
        if (!window.confirm("Delete this community and free its slot? This cannot be undone.")) return;
        startTransition(async () => {
            const result = await deleteCommunity(id);
            if (result.success) setItems((current) => current.filter((item) => item.id !== id));
            else setError(result.error ?? null);
        });
    };

    return (
        <div className="space-y-3">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {items.map((community) => (
                <div key={community.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="grid gap-3 md:grid-cols-6 md:items-center">
                        <div><p className="font-semibold">{community.name}</p><p className="text-xs text-muted-foreground">{community.domain}</p></div>
                        <p className="font-mono text-xs text-muted-foreground">{community.key}</p>
                        <p className="text-sm">{new Date(community.created_at).toLocaleDateString()}</p>
                        <p className="text-sm">{community.status}</p>
                        <p className="text-sm">{community.totalMembers} members</p>
                        <div className="flex gap-2 md:justify-end"><button type="button" onClick={() => setEditing(community)} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary">Edit</button><button type="button" onClick={() => remove(community.id)} disabled={isPending} className="rounded-lg border border-destructive/50 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">Delete</button></div>
                    </div>
                </div>
            ))}
            {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Edit Community</h2><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Name" /><input value={editing.domain} onChange={(event) => setEditing({ ...editing, domain: event.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Domain" /><input value={editing.key} onChange={(event) => setEditing({ ...editing, key: event.target.value })} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Key" /><div className="flex gap-2"><button type="button" onClick={() => setEditing({ ...editing, status: editing.status === "active" ? "suspended" : "active" })} className="rounded-lg border border-border px-3 py-2 text-sm">Status: {editing.status}</button><button type="button" onClick={save} disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div></div></div>}
        </div>
    );
}
