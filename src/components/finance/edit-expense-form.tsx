"use client";

import { useState, useTransition } from "react";
import { updateExpense } from "@/app/(protected)/finance/expense-actions";
import type { Expense } from "@/types/expense";
import { Pencil, X } from "lucide-react";

const categories = [
    ["sports_equipment", "Sports Equipment"],
    ["venue", "Venue"],
    ["tour", "Tour"],
    ["misc", "Miscellaneous"],
] as const;

export function EditExpenseForm({ expense }: { expense: Expense }) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            try {
                await updateExpense(expense.id, formData);
                setOpen(false);
            } catch (saveError) {
                setError(saveError instanceof Error ? saveError.message : "Unable to update expense.");
            }
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={isPending}
                aria-label="Edit expense"
                title="Edit expense"
                className="text-muted-foreground hover:text-primary disabled:opacity-50"
            >
                <Pencil size={14} aria-hidden="true" />
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Edit Expense</h2>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close edit expense">
                                <X size={18} />
                            </button>
                        </div>
                        <form action={handleSubmit} className="space-y-4">
                            <label className="block text-sm">
                                <span className="mb-1 block text-xs text-muted-foreground">Title</span>
                                <input name="title" required defaultValue={expense.title} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" />
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block text-xs text-muted-foreground">Category</span>
                                <select name="category" defaultValue={expense.category} className="w-full rounded-lg border border-border bg-secondary px-3 py-2">
                                    {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block text-xs text-muted-foreground">Amount</span>
                                <input name="amount" type="number" min="0.01" step="0.01" required defaultValue={expense.amount} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" />
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block text-xs text-muted-foreground">Date</span>
                                <input name="expense_date" type="date" required defaultValue={expense.expense_date} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" />
                            </label>
                            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                            <button type="submit" disabled={isPending} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                                {isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
