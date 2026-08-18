export function AvatarDisplay({
    name,
    avatarUrl,
    size = "md",
}: {
    name: string | null;
    avatarUrl?: string | null;
    size?: "md" | "lg";
}) {
    const initial = name?.charAt(0)?.toUpperCase() ?? "?";
    const dimensions = size === "lg" ? "h-20 w-20 text-2xl" : "h-9 w-9 text-sm";

    return (
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground ${dimensions}`}>
            {avatarUrl ? (
                <div
                    role="img"
                    aria-label={`${name ?? "Member"} avatar`}
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarUrl})` }}
                />
            ) : (
                initial
            )}
        </div>
    );
}
