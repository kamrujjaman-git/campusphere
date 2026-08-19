"use client";

import { useState, useTransition, type FormEvent } from "react";
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

const INVALID_EMAIL_MESSAGE = "Invalid email! Only official university emails ending in .edu or .edu.bd are allowed.";
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const UNIVERSITY_DOMAIN_PATTERN = /\.edu(?:\.bd)?$/i;

function getEmailDomain(email: string) {
    const atIndex = email.lastIndexOf("@");
    return atIndex >= 0 ? email.slice(atIndex + 1).trim().toLowerCase() : "";
}

function isUniversityEmail(email: string) {
    return EMAIL_PATTERN.test(email) && UNIVERSITY_DOMAIN_PATTERN.test(getEmailDomain(email));
}

export function OwnerCommunityList({ communities }: { communities: Community[] }) {
    const [items, setItems] = useState(communities);
    const [editing, setEditing] = useState<Community | null>(null);
    const [createEmail, setCreateEmail] = useState("");
    const [createDomain, setCreateDomain] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editDomain, setEditDomain] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const updateEmailAndDomain = (email: string, setEmail: (value: string) => void, setDomain: (value: string) => void) => {
        setEmail(email);
        const domain = getEmailDomain(email);
        if (domain) setDomain(domain);
    };

    const create = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!isUniversityEmail(createEmail)) {
            setError(INVALID_EMAIL_MESSAGE);
            return;
        }
        const formData = new FormData(event.currentTarget);
        formData.set("admin_email", createEmail.trim().toLowerCase());
        formData.set("domain", createDomain.trim().toLowerCase());
        startTransition(async () => {
            const result = await createCommunity(formData);
            if (result.success) window.location.reload();
            else setError(result.error ?? "Community creation failed.");
        });
    };

    const save = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editing) return;
        setError(null);
        if (!isUniversityEmail(editEmail)) {
            setError(INVALID_EMAIL_MESSAGE);
            return;
        }
        const formData = new FormData(event.currentTarget);
        formData.set("community_id", editing.id);
        formData.set("admin_email", editEmail.trim().toLowerCase());
        formData.set("domain", editDomain.trim().toLowerCase());
        startTransition(async () => {
            const result = await updateCommunity(formData);
            if (result.success) window.location.reload();
            else setError(result.error ?? "Community update failed.");
        });
    };

    const openEditor = (community: Community) => {
        setEditing(community);
        setEditEmail(community.assignedAdminEmail);
        setEditDomain(community.domain);
        setError(null);
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

    const createEmailValid = !createEmail || isUniversityEmail(createEmail);
    const editEmailValid = !editEmail || isUniversityEmail(editEmail);

    return (
        <div className="space-y-6">
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <form onSubmit={create} className="space-y-3 rounded-xl border border-primary/25 bg-card p-5">
                <h2 className="text-sm font-semibold">Create Community</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <input name="name" required placeholder="Community name" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                    <input name="domain" required value={createDomain} onChange={(event) => setCreateDomain(event.target.value.toLowerCase())} placeholder="University domain" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                    <div className="space-y-1">
                        <input name="admin_email" type="email" required value={createEmail} onChange={(event) => updateEmailAndDomain(event.target.value, setCreateEmail, setCreateDomain)} placeholder="Super admin email" className={`w-full rounded-lg border bg-secondary px-3 py-2 text-sm ${createEmailValid ? "border-border" : "border-destructive"}`} aria-invalid={!createEmailValid} />
                        {!createEmailValid && <p className="text-xs text-destructive">{INVALID_EMAIL_MESSAGE}</p>}
                    </div>
                    <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm" />
                </div>
                <button type="submit" disabled={isPending || !isUniversityEmail(createEmail) || !createDomain || !createEmail} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{isPending ? "Creating..." : "Create Community"}</button>
            </form>

            {items.map((community) => (
                <div key={community.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="grid min-w-0 grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto]">
                        <div className="min-w-0"><p className="truncate font-semibold" title={community.name}>{community.name}</p><p className="truncate text-xs text-muted-foreground" title={community.domain}>{community.domain}</p></div>
                        <p className="min-w-0 truncate font-mono text-xs text-muted-foreground" title={community.key}>{community.key}</p>
                        <p className="min-w-0 truncate text-sm" title={community.assignedAdminEmail || "Pending assignment"}>{community.assignedAdminEmail || "Pending assignment"}</p>
                        <span className={`w-fit whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium capitalize ${community.status === "active" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>{community.status}</span>
                        <p className="whitespace-nowrap text-sm text-muted-foreground">{community.totalMembers} members</p>
                        <div className="flex flex-wrap gap-2 md:justify-end"><button type="button" onClick={() => openEditor(community)} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary">Edit</button><button type="button" onClick={() => remove(community.id)} disabled={isPending} className="rounded-lg border border-destructive/50 px-3 py-2 text-xs text-destructive hover:bg-destructive/10">Delete</button></div>
                    </div>
                </div>
            ))}

            {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Edit Community</h2><input name="name" required defaultValue={editing.name} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Name" /><input name="domain" required value={editDomain} onChange={(event) => setEditDomain(event.target.value.toLowerCase())} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Domain" /><input name="key" required defaultValue={editing.key} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" placeholder="Key" /><div className="space-y-1"><input name="admin_email" type="email" required value={editEmail} onChange={(event) => updateEmailAndDomain(event.target.value, setEditEmail, setEditDomain)} className={`w-full rounded-lg border bg-secondary px-3 py-2 ${editEmailValid ? "border-border" : "border-destructive"}`} aria-invalid={!editEmailValid} placeholder="Super admin email" />{!editEmailValid && <p className="text-xs text-destructive">{INVALID_EMAIL_MESSAGE}</p>}</div><input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm" /><div className="flex gap-2"><input type="hidden" name="status" value={editing.status} /><button type="button" onClick={() => setEditing({ ...editing, status: editing.status === "active" ? "suspended" : "active" })} className="rounded-lg border border-border px-3 py-2 text-sm">Status: {editing.status}</button><button type="submit" disabled={isPending || !isUniversityEmail(editEmail) || !editDomain || !editEmail} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button></div></form></div>}
        </div>
    );
}
