function Skeleton({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-lg bg-secondary ${className}`} />;
}

export default function ProtectedLoading() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading content">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 max-w-[70vw]" />
                </div>
                <Skeleton className="hidden h-10 w-32 sm:block" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28 sm:col-span-2 lg:col-span-1" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>

            <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
            </div>

            <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        </div>
    );
}
