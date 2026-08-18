"use client";

import { useTransition } from "react";
import { deleteExpense } from "@/app/(protected)/finance/expense-actions";
import { Paperclip, Trash2 } from "lucide-react";
import type { Expense } from "@/types/expense";

const categoryLabels: Record<string, string> = {
  sports_equipment: "Sports Equipment",
  venue: "Venue",
  tour: "Tour",
  misc: "Misc",
};

export function ExpenseList({
  expenses,
  canManage,
}: {
  expenses: Expense[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this expense?")) return;
    startTransition(async () => {
      await deleteExpense(id);
    });
  };

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
        >
          <div>
            <p className="text-sm font-medium">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {categoryLabels[e.category]} · {e.expense_date}
              {e.spent_by_name && ` · by ${e.spent_by_name}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {e.receipt_url && (
              <a
                href={e.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                title="View receipt"
              >
                <Paperclip size={14} />
              </a>
            )}
            <span className="text-sm font-semibold text-destructive">
              ৳{e.amount}
            </span>
            {canManage && (
              <button
                onClick={() => handleDelete(e.id)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
