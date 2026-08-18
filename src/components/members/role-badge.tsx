import type { UserRole } from "@/types/profile";

const roleStyles: Record<UserRole, string> = {
    super_admin: "bg-primary/15 text-primary border-primary/30",
    admin: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    treasurer: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    member: "bg-secondary text-muted-foreground border-border",
};

const roleLabels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    treasurer: "Treasurer",
    member: "Member",
};

export function RoleBadge({ role }: { role: UserRole }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleStyles[role]}`}
        >
            {roleLabels[role]}
        </span>
    );
}
