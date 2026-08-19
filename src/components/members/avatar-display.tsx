/* eslint-disable @next/next/no-img-element */

export function AvatarDisplay({
    name,
    avatarUrl,
    size = "md",
}: {
    name: string | null;
    avatarUrl?: string | null;
    size?: "md" | "card" | "lg";
}) {
    const initial = name?.charAt(0)?.toUpperCase() ?? "?";
    const dimensions = size === "lg"
        ? "h-20 w-20 text-2xl"
        : size === "card"
            ? "h-16 w-16 text-xl"
            : "h-9 w-9 text-sm";
    const normalizedAvatarUrl = avatarUrl?.trim();

    return (
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-primary-foreground ${dimensions}`}>
            {normalizedAvatarUrl ? (
                <img
                    src={normalizedAvatarUrl}
                    alt={`${name ?? "Member"} avatar`}
                    className="h-full w-full object-cover"
                />
            ) : (
                initial
            )}
        </div>
    );
}
