export type Role = "admin" | "user";
export type TaskFrequency = "once" | "daily" | "weekly";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type TaskPriority = "low" | "medium" | "high" | "very_high" | "special";

export type AppCategory =
  | "Alimentos"
  | "Bebidas"
  | "Higiene/Cuidado personal"
  | "Limpieza/Hogar"
  | "Mascotas"
  | "Salud/Farmacia"
  | "Otros";

export type ProductRarity =
  | "común"
  | "raro"
  | "épico"
  | "legendario";

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
  /**
   * Se conserva por compatibilidad con la base existente.
   * Desde esta versión representa XP disponible otorgada por la tarea.
   */
  points: number;
  /** XP acumulada otorgada por la tarea. Debe coincidir con points. */
  xp: number;
  frequency: TaskFrequency;
  active: boolean;
  priority?: TaskPriority;
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
  rejectedAt?: string;
  rejectionNote?: string;
}

export interface UserProgress {
  /** XP histórica. Nunca se descuenta al comprar premios. */
  xp: number;
  /** XP disponible para gastar. El nombre viejo se conserva para no romper Firestore. */
  points: number;
  streak: number;
  bonusAwardedOn?: string;
  scanStreak?: number;
  lastScanDate?: string;
  lastSeenRejectionAt?: string;
  xpSystemMigrated?: boolean;
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

export type NotificationType =
  | "scan"
  | "task_new"
  | "task_sent"
  | "task_approved"
  | "task_rejected"
  | "store_request"
  | "store_resolved"
  | "achievement"
  | "reminder"
  | "system";

export interface ScanGameNotification {
  id: string;
  recipientId: string;
  senderId: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  sourceId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  bonusXp: number;
  unlockedAt: string;
}
