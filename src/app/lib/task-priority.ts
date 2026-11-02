import type { TaskPriority } from "@/app/types";

export const TASK_PRIORITY_ORDER: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "very_high",
  "special"
];

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  {
    label: string;
    shortLabel: string;
    points: number;
    xp: number;
    description: string;
    badgeClass: string;
    buttonClass: string;
    borderClass: string;
  }
> = {
  low: {
    label: "Prioridad baja",
    shortLabel: "Baja",
    points: 30,
    xp: 15,
    description: "Tarea chica o rápida",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    buttonClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
    borderClass: "border-emerald-300"
  },
  medium: {
    label: "Prioridad media",
    shortLabel: "Media",
    points: 60,
    xp: 30,
    description: "Tarea normal",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    buttonClass: "border-blue-300 bg-blue-50 text-blue-700",
    borderClass: "border-blue-300"
  },
  high: {
    label: "Prioridad alta",
    shortLabel: "Alta",
    points: 100,
    xp: 50,
    description: "Tarea importante",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    buttonClass: "border-amber-300 bg-amber-50 text-amber-700",
    borderClass: "border-amber-300"
  },
  very_high: {
    label: "Prioridad muy alta",
    shortLabel: "Muy alta",
    points: 160,
    xp: 80,
    description: "Mucho esfuerzo o prioridad",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    buttonClass: "border-rose-300 bg-rose-50 text-rose-700",
    borderClass: "border-rose-300"
  },
  special: {
    label: "Especial",
    shortLabel: "Especial",
    points: 250,
    xp: 125,
    description: "Tarea excepcional",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
    buttonClass: "border-violet-300 bg-violet-50 text-violet-700",
    borderClass: "border-violet-300"
  }
};

export function getPriorityFromPoints(points: number): TaskPriority {
  if (points <= 40) return "low";
  if (points <= 80) return "medium";
  if (points <= 130) return "high";
  if (points <= 200) return "very_high";
  return "special";
}

export function resolveTaskPriority(
  priority: TaskPriority | undefined,
  points: number
): TaskPriority {
  return priority ?? getPriorityFromPoints(points);
}
