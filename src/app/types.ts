export type Role = "admin" | "user";
export type TaskFrequency = "once" | "daily" | "weekly";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type AppCategory =
  | "Alimentos"
  | "Bebidas"
  | "Higiene/Cuidado personal"
  | "Limpieza/Hogar"
  | "Mascotas"
  | "Salud/Farmacia"
  | "Otros";
export type ProductRarity = "común" | "raro" | "épico" | "legendario";

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
  scanStreak?: number;
  lastScanDate?: string;
}

export interface CollectedProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  offCategoriesRaw?: string;
  appCategory: AppCategory;
  rarity: ProductRarity;
  dateFirstScanned: string;
  lastScannedAt: string;
  scanCount: number;
  ingredients?: string;
  allergens?: string;
}
