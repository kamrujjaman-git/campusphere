export type ContributionType = "weekly" | "event";
export type ContributionStatus = "due" | "paid";

export interface Contribution {
  id: string;
  user_id: string;
  type: ContributionType;
  event_id: string | null;
  amount: number;
  week_start_date: string | null;
  status: ContributionStatus;
  paid_at: string | null;
  marked_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}
