export type ExpenseCategory =
  | "sports_equipment"
  | "venue"
  | "tour"
  | "misc";

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  event_id: string | null;
  receipt_url: string | null;
  spent_by: string | null;
  approved_by: string | null;
  expense_date: string;
  created_at: string;
  spent_by_name?: string;
}
