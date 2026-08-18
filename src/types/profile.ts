export type UserRole = "super_admin" | "admin" | "treasurer" | "member";
export type UserStatus = "active" | "inactive";

export interface Profile {
  id: string;
  full_name: string | null;
  batch: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  profile_completed: boolean;
  created_at: string;
}
