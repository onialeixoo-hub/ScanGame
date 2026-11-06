import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Crown,
  Edit2,
  Flag,
  History,
  List,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/firebase";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import type {
  Task,
  TaskClaim,
  TaskFrequency,
  User,
  UserProgress
} from "@/app/types";
import {
  getPriorityFromPoints,
  resolveTaskPriority,
  TASK_PRIORITY_CONFIG,
  TASK_PRIORITY_ORDER
} from "@/app/lib/task-priority";

interface TasksProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  claims: TaskClaim[];
  progress: UserProgress;
  productsCount: number;
  categoriesCount: number;
  dailyGoal: number;
  bonusPoints: number;
  onCreateClaim: (taskId: string, note: string) => void;
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string, note: string) => void;
  onCreateTask: (task: Omit<Task, "id">) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onResetProgress: () => void;
}

const frequencyLabels: Record<TaskFrequency, string> = {
  once: "Una vez",
  daily: "Diaria",
  weekly: "Semanal"
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short"
  });

const emptyProgress: UserProgress = {
  xp: 0,
  points: 0,
  streak: 0,
  bonusAwardedOn: "",
  scanStreak: 0,
  lastScanDate: "",
  lastSeenRejectionAt: ""
};

export function Tasks({
  currentUser,
  users,
  tasks,
  claims,
  progress,
  dailyGoal,
  bonusPoints,
  onCreateClaim,
  onApproveClaim,
  onRejectClaim,
  onCreateTask,
  onUpdateTask,
  onDeleteTask
}: TasksProps) {
  const isAdmin = currentUser.role === "admin";

  const [activeTab, setActiveTab] = useState<"pending" | "tasks" | "user">(
    "pending"
  );
  const [showHistory, setShowHistory] = useState(false);
  const [claimModalTask, setClaimModalTask] = useState<Task | null>(null);
  const [claimNote, setClaimNote] = useState("");
  const [adminAction, setAdminAction] = useState<{
    type: "approve" | "reject" | "reset";
    claim?: TaskClaim;
  } | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState<"create" | "edit">("create");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState(false);

  const [taskForm, setTaskForm] = useState<Omit<Task, "id">>(
    {
      title: "",
      description: "",
      points: 60,
      xp: 30,
      frequency: "daily",
      active: true,
      priority: "medium"
    } as Omit<Task, "id">
  );

  const todayKey = useMemo(() => new Date().toDateString(), []);

  const trackedUser = isAdmin
    ? users.find((user) => user.role === "user" && user.id !== "user-1") ??
      currentUser
    : currentUser;

  const trackedUserClaims = useMemo(
    () =>
      claims
        .filter((claim) => claim.userId === trackedUser.id)
        .sort(
          (a, b) =>
            new Date(
              b.rejectedAt ?? b.approvedAt ?? b.timestamp
            ).getTime() -
            new Date(
              a.rejectedAt ?? a.approvedAt ?? a.timestamp
            ).getTime()
        ),
    [claims, trackedUser.id]
  );

  const pendingClaims = useMemo(
    () =>
      claims
        .filter((claim) => claim.status === "pending")
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        ),
    [claims]
  );

  const startOfCurrentWeek = useMemo(() => {
    const date = new Date();
    const day = date.getDay();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    return date;
  }, []);

  const approvedClaims = trackedUserClaims.filter(
    (claim) => claim.status === "approved"
  );

  const approvedToday = approvedClaims.filter(
    (claim) =>
      claim.approvedAt &&
      new Date(claim.approvedAt).toDateString() === todayKey
  );

  const approvedThisWeek = approvedClaims.filter(
    (claim) =>
      claim.approvedAt &&
      new Date(claim.approvedAt).getTime() >=
        startOfCurrentWeek.getTime()
  );

  const rejectedClaims = trackedUserClaims.filter(
    (claim) => claim.status === "rejected"
  );

  const pendingUserClaims = trackedUserClaims.filter(
    (claim) => claim.status === "pending"
  );

  const latestRejectedClaim = rejectedClaims[0];

  const latestRejectionDate = latestRejectedClaim
    ? latestRejectedClaim.rejectedAt ?? latestRejectedClaim.timestamp
    : undefined;

  const hasUnseenRejection =
    Boolean(latestRejectedClaim && latestRejectionDate) &&
    (!progress.lastSeenRejectionAt ||
      new Date(latestRejectionDate as string).getTime() >
        new Date(progress.lastSeenRejectionAt).getTime());

  const latestRejectedTask = latestRejectedClaim
    ? tasks.find((task) => task.id === latestRejectedClaim.taskId)
    : undefined;

  const progressValue = Math.min(
    (approvedToday.length / dailyGoal) * 100,
    100
  );

  const dailyBonusUnlocked = approvedToday.length >= dailyGoal;
  const activeTasks = tasks.filter((task) => task.active);

  const getLatestClaimForTask = (task: Task) => {
  const relevantClaims = trackedUserClaims.filter((claim) => {
    if (claim.taskId !== task.id) return false;

    const claimDate = new Date(claim.timestamp);

    if (task.frequency === "daily") {
      return (
        claimDate.toDateString() ===
        todayKey
      );
    }

    if (task.frequency === "weekly") {
      return (
        claimDate.getTime() >=
        startOfCurrentWeek.getTime()
      );
    }

    return true;
  });

  return relevantClaims.sort(
    (a, b) =>
      new Date(
        b.rejectedAt ??
          b.approvedAt ??
          b.timestamp
      ).getTime() -
      new Date(
        a.rejectedAt ??
          a.approvedAt ??
          a.timestamp
      ).getTime()
  )[0];
};

  const openTaskForm = (mode: "create" | "edit", task?: Task) => {
    setTaskFormMode(mode);

    if (task) {
      setTaskForm(
        {
          title: task.title,
          description: task.description ?? "",
          points: task.points,
          xp: task.points,
          frequency: task.frequency,
          active: task.active,
          priority: resolveTaskPriority(
            (task as Task & { priority?: any }).priority,
            task.points
          )
        } as Omit<Task, "id">
      );
      setEditingTaskId(task.id);
    } else {
      setTaskForm(
        {
          title: "",
          description: "",
          points: 60,
          xp: 30,
          frequency: "daily",
          active: true,
          priority: "medium"
        } as Omit<Task, "id">
      );
      setEditingTaskId(null);
    }

    setTaskFormOpen(true);
  };

  const handleSubmitTaskForm = () => {
    if (!taskForm.title.trim()) return;

    const normalizedTask = {
      ...taskForm,
      title: taskForm.title.trim(),
      points: Math.max(Math.round(taskForm.points), 1),
      xp: Math.max(Math.round(taskForm.points), 1),
      priority: getPriorityFromPoints(taskForm.points)
    } as Omit<Task, "id">;

    if (taskFormMode === "create") {
      onCreateTask(normalizedTask);
    } else if (editingTaskId) {
      onUpdateTask(editingTaskId, normalizedTask);
    }

    setTaskFormOpen(false);
    setEditingTaskId(null);
  };

  const deleteReferencesInBatches = async (
    references: Array<{ ref: any }>
  ) => {
    const BATCH_SIZE = 400;

    for (let index = 0; index < references.length; index += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = references.slice(index, index + BATCH_SIZE);

      chunk.forEach((documentSnapshot) => {
        batch.delete(documentSnapshot.ref);
      });

      await batch.commit();
    }
  };

  const handleFullUserReset = async () => {
    if (!isAdmin || trackedUser.role !== "user") {
      toast.error("No se encontró la cuenta de Marti");
      return;
    }

    setResettingUser(true);

    try {
      const [
        claimsSnapshot,
        rewardRequestsSnapshot,
        taskRequestsSnapshot,
        goalProgressSnapshot,
        productsSnapshot,
        scansSnapshot,
        achievementsSnapshot,
        xpLedgerSnapshot,
        receivedNotificationsSnapshot,
        sentNotificationsSnapshot
      ] = await Promise.all([
        getDocs(
          query(
            collection(db, "taskClaims"),
            where("userId", "==", trackedUser.id)
          )
        ),
        getDocs(
          query(
            collection(db, "rewardRequests"),
            where("userId", "==", trackedUser.id)
          )
        ),
        getDocs(
          query(
            collection(db, "taskRequests"),
            where("userId", "==", trackedUser.id)
          )
        ),
        getDocs(
          query(
            collection(db, "goalProgress"),
            where("userId", "==", trackedUser.id)
          )
        ),
        getDocs(
          collection(db, "users", trackedUser.id, "products")
        ),
        getDocs(
          collection(db, "users", trackedUser.id, "scans")
        ),
        getDocs(
          collection(db, "users", trackedUser.id, "achievements")
        ),
        getDocs(
          collection(db, "users", trackedUser.id, "xpLedger")
        ),
        getDocs(
          query(
            collection(db, "notifications"),
            where("recipientId", "==", trackedUser.id)
          )
        ),
        getDocs(
          query(
            collection(db, "notifications"),
            where("senderId", "==", trackedUser.id)
          )
        )
      ]);

      const documentsToDelete = Array.from(
        new Map(
          [
            ...claimsSnapshot.docs,
            ...rewardRequestsSnapshot.docs,
            ...taskRequestsSnapshot.docs,
            ...goalProgressSnapshot.docs,
            ...productsSnapshot.docs,
            ...scansSnapshot.docs,
            ...achievementsSnapshot.docs,
            ...xpLedgerSnapshot.docs,
            ...receivedNotificationsSnapshot.docs,
            ...sentNotificationsSnapshot.docs
          ].map((documentSnapshot) => [
            documentSnapshot.ref.path,
            documentSnapshot
          ])
        ).values()
      );

      await deleteReferencesInBatches(documentsToDelete);

      await setDoc(
        doc(db, "userProgress", trackedUser.id),
        emptyProgress
      );

      toast.success(
        `Marti fue reiniciado por completo: ${documentsToDelete.length} registros eliminados`
      );
    } catch (error) {
      console.error("Error al reiniciar usuario:", error);

      const message =
        error instanceof Error ? error.message : "";

      if (
        message.includes("permission-denied") ||
        message.includes("Missing or insufficient permissions")
      ) {
        toast.error(
          "Firebase no dio permiso para borrar todos los datos. Hay que ampliar las reglas de administrador."
        );
      } else {
        toast.error("No se pudo reiniciar completamente a Marti");
      }
    } finally {
      setResettingUser(false);
      setAdminAction(null);
      setRejectionNote("");
    }
  };

  const confirmAdminAction = () => {
    if (adminAction?.type === "approve" && adminAction.claim) {
      onApproveClaim(adminAction.claim.id);
      setAdminAction(null);
      return;
    }

    if (adminAction?.type === "reject" && adminAction.claim) {
      onRejectClaim(adminAction.claim.id, rejectionNote);
      setAdminAction(null);
      setRejectionNote("");
      return;
    }

    if (adminAction?.type === "reset") {
      void handleFullUserReset();
    }
  };

  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-6 py-5 shadow-lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <List className="h-6 w-6 text-white" />

            <div>
              <h1 className="text-2xl font-bold text-white">Tareas</h1>
              <p className="text-sm text-white/80">
                {isAdmin ? "Modo Adulto" : "Modo Aventura"}
              </p>
            </div>
          </div>

          {!isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 text-white hover:bg-white/30"
              onClick={() => setShowHistory(true)}
            >
              <History className="mr-2 h-4 w-4" />
              Historial
            </Button>
          )}
        </div>

        {!isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Badge className="border-0 bg-white/20 text-white">
              <Flag className="mr-1 h-3 w-3" />
              Racha {progress.streak} días
            </Badge>

            <Badge className="border-0 bg-white/20 text-white">
              <Crown className="mr-1 h-3 w-3" />
              XP disponibles: {progress.points}
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-6 px-6 pt-6">
        {!isAdmin && latestRejectedClaim && hasUnseenRejection && (
          <Card className="border-2 border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Bell className="h-5 w-5 text-red-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-700">
                  Último rechazo
                </p>

                <p className="mt-1 font-bold text-[#12130F]">
                  {latestRejectedTask?.title ?? "Tarea"}
                </p>

                <p className="mt-1 text-sm text-red-600">
                  Motivo:{" "}
                  {latestRejectedClaim.rejectionNote?.trim() ||
                    "No se informó un motivo"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {!isAdmin && (
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-[#386FA4]">
                {approvedToday.length}/{dailyGoal} aprobadas hoy
              </span>
            </div>

            <Badge className="border-0 bg-amber-100 text-amber-700">
              +{bonusPoints} bonus
            </Badge>
          </div>
        )}

        {!isAdmin && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-[#12130F]">
              Para hoy
            </h2>

            <div className="space-y-4">
              {activeTasks.map((task, index) => {
                const latestClaim = getLatestClaimForTask(task);
                const status = latestClaim?.status ?? "idle";
                const priority = resolveTaskPriority(
                  (task as Task & { priority?: any }).priority,
                  task.points
                );
                const priorityConfig = TASK_PRIORITY_CONFIG[priority];

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card
                      className={`border-2 bg-white/95 p-4 ${priorityConfig.borderClass}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-[#12130F]">
                              {task.title}
                            </h3>

                            <Badge className={priorityConfig.badgeClass}>
                              {priorityConfig.shortLabel}
                            </Badge>
                          </div>

                          {task.description && (
                            <p className="mt-1 text-sm text-[#386FA4]/80">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className="border-0 bg-blue-100 text-blue-700">
                            +{task.points} XP
                          </Badge>

                          <Badge className="border-0 bg-slate-100 text-slate-700">
                            {frequencyLabels[task.frequency]}
                          </Badge>
                        </div>

                        {status === "idle" && (
                          <Button
                            className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                            onClick={() => {
                              setClaimModalTask(task);
                              setClaimNote("");
                            }}
                          >
                            Marcar como hecha
                          </Button>
                        )}

                        {status === "pending" && (
                          <Button disabled className="w-full">
                            Pendiente de aprobación
                          </Button>
                        )}

                        {status === "approved" && (
                          <Button disabled className="w-full">
                            Aprobada ✅
                          </Button>
                        )}

                        {status === "rejected" && (
                          <div>
                            <Button
                              className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                              onClick={() => {
                                setClaimModalTask(task);
                                setClaimNote("");
                              }}
                            >
                              Volver a enviar
                            </Button>

                            {latestClaim?.rejectionNote && (
                              <p className="mt-2 text-xs text-red-500">
                                Motivo: {latestClaim.rejectionNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {!isAdmin && (
          <section className="space-y-3 pb-2">
            <div>
              <h2 className="text-lg font-bold text-[#12130F]">
                Tus estadísticas
              </h2>

              <p className="text-sm text-[#386FA4]">
                Resumen de tu progreso
              </p>
            </div>

            <Card className="border-2 border-[#386FA4]/15 bg-white/95 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#386FA4]">
                    Objetivo diario
                  </p>

                  <p className="font-bold text-[#12130F]">
                    {approvedToday.length}/{dailyGoal} aprobadas
                  </p>
                </div>

                <Badge className="border-0 bg-amber-100 text-amber-700">
                  +{bonusPoints} bonus
                </Badge>
              </div>

              <Progress
                value={progressValue}
                className="h-2 bg-[#E2DADB]"
              />

              {dailyBonusUnlocked && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  ¡Bonus desbloqueado!
                </p>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-emerald-50 p-4">
                <p className="text-2xl font-bold text-emerald-700">
                  {approvedToday.length}
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  Aprobadas hoy
                </p>
              </Card>

              <Card className="bg-blue-50 p-4">
                <p className="text-2xl font-bold text-blue-700">
                  {approvedThisWeek.length}
                </p>
                <p className="text-xs font-semibold text-blue-600">
                  Esta semana
                </p>
              </Card>

              <Card className="bg-purple-50 p-4">
                <p className="text-2xl font-bold text-purple-700">
                  {approvedClaims.length}
                </p>
                <p className="text-xs font-semibold text-purple-600">
                  Aprobadas totales
                </p>
              </Card>

              <Card className="bg-amber-50 p-4">
                <p className="text-2xl font-bold text-amber-700">
                  {pendingUserClaims.length}
                </p>
                <p className="text-xs font-semibold text-amber-600">
                  Pendientes
                </p>
              </Card>
            </div>
          </section>
        )}

        {isAdmin && (
          <div className="grid grid-cols-3 gap-2">
            {(["pending", "tasks", "user"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "secondary"}
                className={
                  activeTab === tab
                    ? "bg-[#386FA4] text-white"
                    : "bg-white text-[#386FA4]"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab === "pending"
                  ? "Pendientes"
                  : tab === "tasks"
                    ? "Tareas"
                    : "Usuario"}
              </Button>
            ))}
          </div>
        )}

        {isAdmin && activeTab === "pending" && (
          <div className="space-y-3">
            {pendingClaims.length === 0 && (
              <Card className="border-2 border-[#386FA4]/15 bg-white p-6 text-center text-[#386FA4]">
                No hay tareas pendientes 🎉
              </Card>
            )}

            {pendingClaims.map((claim) => {
              const task = tasks.find(
                (item) => item.id === claim.taskId
              );
              const user = users.find(
                (item) => item.id === claim.userId
              );

              return (
                <Card
                  key={claim.id}
                  className="border-2 border-[#386FA4]/15 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-[#386FA4]" />

                        <div>
                          <p className="text-sm font-semibold">
                            {user?.name ?? "Usuario"}
                          </p>

                          <p className="text-xs text-[#386FA4]">
                            {formatTime(claim.timestamp)}
                          </p>
                        </div>
                      </div>

                      <p className="font-bold">
                        {task?.title ?? "Tarea"}
                      </p>

                      {claim.note && (
                        <p className="mt-2 text-sm text-[#386FA4]">
                          Nota: {claim.note}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        className="bg-emerald-500 text-white hover:bg-emerald-600"
                        onClick={() =>
                          setAdminAction({
                            type: "approve",
                            claim
                          })
                        }
                      >
                        Aprobar
                      </Button>

                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600"
                        onClick={() =>
                          setAdminAction({
                            type: "reject",
                            claim
                          })
                        }
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {isAdmin && activeTab === "tasks" && (
          <div className="space-y-4">
            <Button
              className="w-full bg-[#386FA4] text-white"
              onClick={() => openTaskForm("create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva tarea
            </Button>

            {tasks.map((task) => {
              const priority = resolveTaskPriority(
                (task as Task & { priority?: any }).priority,
                task.points
              );

              return (
                <Card
                  key={task.id}
                  className="border-2 border-[#386FA4]/15 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{task.title}</p>

                        <Badge
                          className={
                            TASK_PRIORITY_CONFIG[priority].badgeClass
                          }
                        >
                          {TASK_PRIORITY_CONFIG[priority].shortLabel}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-sm text-[#386FA4]">
                          {task.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-500">
                        {task.points} XP ·{" "}
                        {frequencyLabels[task.frequency]}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <Switch
                        checked={task.active}
                        onCheckedChange={(checked) =>
                          onUpdateTask(task.id, {
                            active: checked
                          })
                        }
                      />

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openTaskForm("edit", task)
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {isAdmin && activeTab === "user" && (
          <Card className="border-2 border-[#386FA4]/15 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#386FA4]/10 p-3">
                <ShieldCheck className="h-6 w-6 text-[#386FA4]" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#386FA4]">
                  Estadísticas de {trackedUser.name}
                </p>

                <p className="text-xl font-bold">
                  {progress.points} XP disponibles
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <b className="text-xl text-emerald-700">
                  {approvedToday.length}
                </b>
                <p className="text-xs text-emerald-600">Hoy</p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <b className="text-xl text-blue-700">
                  {approvedThisWeek.length}
                </b>
                <p className="text-xs text-blue-600">Semana</p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3">
                <b className="text-xl text-purple-700">
                  {approvedClaims.length}
                </b>
                <p className="text-xs text-purple-600">Aprobadas</p>
              </div>

              <div className="rounded-xl bg-red-50 p-3">
                <b className="text-xl text-red-700">
                  {rejectedClaims.length}
                </b>
                <p className="text-xs text-red-600">Rechazadas</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="font-bold text-red-700">
                Reinicio completo de Marti
              </p>

              <p className="mt-1 text-xs text-red-600">
                Borra XP, XP disponibles, rachas, historial de tareas,
                productos, escaneos, pedidos y progreso de metas.
                La cuenta y el perfil se conservan.
              </p>

              <Button
                variant="destructive"
                className="mt-3 w-full"
                disabled={resettingUser}
                onClick={() =>
                  setAdminAction({ type: "reset" })
                }
              >
                {resettingUser
                  ? "Reiniciando..."
                  : "Reiniciar usuario completo"}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <AnimatePresence>
        {claimModalTask && (
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md bg-white p-6">
              <h3 className="text-lg font-bold">
                ¿Confirmás que completaste “{claimModalTask.title}”?
              </h3>

              <p className="mb-4 mt-1 text-sm text-[#386FA4]">
                Se enviará para aprobación.
              </p>

              <Textarea
                value={claimNote}
                onChange={(event) =>
                  setClaimNote(event.target.value)
                }
                placeholder="Nota opcional"
                className="mb-4"
              />

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setClaimModalTask(null)}
                >
                  Cancelar
                </Button>

                <Button
                  className="bg-[#386FA4] text-white"
                  onClick={() => {
                    onCreateClaim(
                      claimModalTask.id,
                      claimNote
                    );
                    setClaimModalTask(null);
                    setClaimNote("");
                  }}
                >
                  Enviar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adminAction && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-sm bg-white p-6">
              <h3 className="text-lg font-bold">
                {adminAction.type === "reset"
                  ? "Reiniciar a Marti"
                  : "Confirmar acción"}
              </h3>

              <p className="mb-3 mt-1 text-sm text-[#386FA4]">
                {adminAction.type === "approve" &&
                  "¿Aprobar esta tarea?"}

                {adminAction.type === "reject" &&
                  "¿Rechazar esta tarea?"}

                {adminAction.type === "reset" &&
                  "Se borrarán todos los datos de juego de Marti: XP acumulada, XP disponible, rachas, tareas completadas, colección, escaneos, pedidos y progreso de metas. Su cuenta, nombre y avatar se conservarán. Esta acción no se puede deshacer."}
              </p>

              {adminAction.type === "reject" && (
                <Textarea
                  value={rejectionNote}
                  onChange={(event) =>
                    setRejectionNote(event.target.value)
                  }
                  placeholder="Motivo opcional"
                  className="mb-3"
                />
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  disabled={resettingUser}
                  onClick={() => {
                    setAdminAction(null);
                    setRejectionNote("");
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  variant={
                    adminAction.type === "reset"
                      ? "destructive"
                      : "default"
                  }
                  className={
                    adminAction.type === "reset"
                      ? ""
                      : "bg-[#386FA4] text-white"
                  }
                  disabled={resettingUser}
                  onClick={confirmAdminAction}
                >
                  {resettingUser
                    ? "Reiniciando..."
                    : adminAction.type === "reset"
                      ? "Sí, borrar todo"
                      : "Confirmar"}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {taskFormOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto bg-white p-6">
              <h3 className="mb-4 text-lg font-bold">
                {taskFormMode === "create"
                  ? "Nueva tarea"
                  : "Editar tarea"}
              </h3>

              <div className="space-y-3">
                <Input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      title: event.target.value
                    }))
                  }
                  placeholder="Título"
                />

                <Textarea
                  value={taskForm.description ?? ""}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      description: event.target.value
                    }))
                  }
                  placeholder="Descripción opcional"
                />

                <div>
                  <p className="mb-2 text-sm font-bold">
                    Prioridad
                  </p>

                  <div className="grid grid-cols-5 gap-1">
                    {TASK_PRIORITY_ORDER.map((priority) => {
                      const config =
                        TASK_PRIORITY_CONFIG[priority];
                      const selected =
                        getPriorityFromPoints(
                          taskForm.points
                        ) === priority;

                      return (
                        <button
                          key={priority}
                          type="button"
                          className={`rounded-xl border px-1 py-2 text-[10px] font-bold ${
                            selected
                              ? config.buttonClass
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                          onClick={() =>
                            setTaskForm(
                              (prev) =>
                                ({
                                  ...prev,
                                  points: config.points,
                                  xp: config.points,
                                  priority
                                }) as Omit<Task, "id">
                            )
                          }
                        >
                          {config.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-[#386FA4]">
                    Recompensa en XP
                  </p>
                  <Input
                    type="number"
                    min={1}
                    value={taskForm.points}
                    onChange={(event) => {
                      const xp = Number(event.target.value);
                      setTaskForm((prev) => ({
                        ...prev,
                        points: xp,
                        xp
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    ["daily", "weekly", "once"] as TaskFrequency[]
                  ).map((frequency) => (
                    <Button
                      key={frequency}
                      variant={
                        taskForm.frequency === frequency
                          ? "default"
                          : "secondary"
                      }
                      onClick={() =>
                        setTaskForm((prev) => ({
                          ...prev,
                          frequency
                        }))
                      }
                    >
                      {frequencyLabels[frequency]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setTaskFormOpen(false)}
                >
                  Cancelar
                </Button>

                <Button
                  className="bg-[#386FA4] text-white"
                  onClick={handleSubmitTaskForm}
                >
                  Guardar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Historial</h3>

                <Button
                  variant="ghost"
                  onClick={() => setShowHistory(false)}
                >
                  Cerrar
                </Button>
              </div>

              <div className="max-h-96 space-y-3 overflow-y-auto">
                {trackedUserClaims.length === 0 && (
                  <p className="text-sm text-[#386FA4]">
                    Todavía no hay tareas registradas.
                  </p>
                )}

                {trackedUserClaims.map((claim) => {
                  const task = tasks.find(
                    (item) => item.id === claim.taskId
                  );

                  const date =
                    claim.status === "approved"
                      ? claim.approvedAt ?? claim.timestamp
                      : claim.status === "rejected"
                        ? claim.rejectedAt ?? claim.timestamp
                        : claim.timestamp;

                  return (
                    <div
                      key={claim.id}
                      className="rounded-lg border border-[#386FA4]/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">
                          {task?.title ?? "Tarea"}
                        </p>

                        <span className="text-right text-xs text-[#386FA4]">
                          {formatDate(date)}
                          <br />
                          {formatTime(date)}
                        </span>
                      </div>

                      <div className="mt-2">
                        {claim.status === "pending" && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}

                        {claim.status === "approved" && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Aprobada
                          </Badge>
                        )}

                        {claim.status === "rejected" && (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="mr-1 h-3 w-3" />
                            Rechazada
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
