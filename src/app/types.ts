export type Role = "admin" | "user";
export type TaskFrequency = "once" | "daily" | "weekly";
export type ClaimStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: Role;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  xp: number;
  frequency: TaskFrequency;
  active: boolean;
}

export interface TaskClaim {
  id: string;
  taskId: string;
  userId: string;
  status: ClaimStatus;
  timestamp: string;
  note?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionNote?: string;
}

export interface UserProgress {
  xp: number;
  points: number;
  streak: number;
  bonusAwardedOn?: string;
}
