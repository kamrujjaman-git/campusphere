"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ProtectedError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center py-12">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl shadow-black/20">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <AlertTriangle size={24} aria-hidden="true" />
                </div>
                <h1 className="mt-5 text-xl font-bold text-foreground">
                    This page hit a snag
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    We could not load this part of Campusphere. Try again and we will take
                    another look.
                </p>
                <button
                    type="button"
                    onClick={() => reset()}
                    className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
                >
                    <RotateCcw size={15} aria-hidden="true" />
                    Try Again
                </button>
            </div>
        </div>
    );
}
