"use client";

import { useState, useTransition } from "react";
import { createCommunity, deleteCommunity, updateCommunity } from "@/app/(protected)/owner/actions";

type Community = {
    id: string;
    name: string;
    domain: string;
    key: string;
    created_at: string;
    status: string;
    totalMembers: number;
    assignedAdminEmail: string;
};

export function OwnerCommunityList({ communities }: { communities: Community[] }) {
    const [items, setItems] = useState(communities);
    const [editing, setEditing] = useState<Community | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const create = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await createCommunity(formData);
            if (result.success) window.location.reload();
            else setError(result.error ?? "Community creation failed.");
        });
    };

    const save = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editing) return;
        setError(null);
        const formData = new FormData(event.currentTarget);
        formData.set("community_id", editing.id);
        startTransition(async () => {
            const result = await updateCommunity(formData);
            if (result.success) window.location.reload();
            else setError(result.error ?? "Community update failed.");
        });
    };

    const remove = (id: string) => {
        if (!window.confirm("Delete this community and free its slot? This cannot be undone.")) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteCommunity(id);
            if (result.success) setItems((current) => current.filter((item) => item.id !== id));
            else setError(result.error ?? "Community deletion failed.");
        });
    };

    return (
        <div className="space-y-6">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <form onSubmit={create} className="space-y-3 rounded-xl border border-primary/25 bg-card p-5">
                <h2 className="text-sm font-semibold">Create Community</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <input name="name" required placeholder="Community name" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                    <input name="domain" required placeholder="University domain" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                    <input name="admin_email" type="email" required placeholder="Super admin email" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                    <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                </div>
                <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{isPending ? "Creating..." : "Create Community"}</button>
            </form>

            {items.map((community) => (
                <div key={community.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="grid min-w-0 grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto]">
                        <div className="min-w-0">
                            <p className="truncate font-semibold" title={community.name}>{community.name}</p>
                            <p className="truncate text-xs text-muted-foreground" title={community.domain}>{community.domain}</p>
                        </div>
                        <p className="min-w-0 truncate font-mono text-xs text-muted-foreground" title={community.key}>{community.key}</p>
                        <p className="min-w-0 truncate text-sm" title={community.assignedAdminEmail || "Pending assignment"}>{community.assignedAdminEmail || "Pending assignment"}</p>
                        <span className={`w-fit whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium capitalize ${community.status === "active" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>{community.status}</span>
                        <p className="whitespace-nowrap text-sm text-muted-foreground">{community.totalMembers} members</p>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                            <button type="button" onClick={() => setEditing(community)} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary">Edit</button>
                            <button type="button" onClick={() => remove(community.id)} disabled={isPending} className="rounded-lg border border-destructive/50 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                        </div>
                    </div>
                </div>
            ))}

            {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Edit Community</h2><input name="name" required defaultValue={editing.name} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Name" /><input name="domain" required defaultValue={editing.domain} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Domain" /><input name="key" required defaultValue={editing.key} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Key" /><input name="admin_email" type="email" required defaultValue={editing.assignedAdminEmail} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Super admin email" /><input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm" /><div className="flex gap-2"><input type="hidden" name="status" value={editing.status === "active" ? "suspended" : "active"} /><button type="button" onClick={() => setEditing({ ...editing, status: editing.status === "active" ? "suspended" : "active" })} className="rounded-lg border border-border px-3 py-2 text-sm">Status: {editing.status}</button><button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div></form></div>}
        </div>
    );
}
