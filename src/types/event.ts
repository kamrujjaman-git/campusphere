export type EventType = "sports" | "tour";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type RsvpStatus = "going" | "not_going" | "pending";

export interface Event {
  id: string;
  title: string;
  type: EventType;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  budget: number;
  extra_contribution_amount: number;
  status: EventStatus;
  cover_image_url: string | null;
  created_by: string | null;
  created_at: string;
  going_count?: number;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  rsvp_status: RsvpStatus;
  created_at: string;
  full_name?: string;
}
