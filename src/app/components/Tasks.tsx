import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  Crown,
  Edit2,
  Flag,
  History,
  ListTodo,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import type { Task, TaskClaim, TaskFrequency, User, UserProgress } from "@/app/types";

interface TasksProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  claims: TaskClaim[];
  progress: UserProgress;
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
  onDeleteTask,
  onResetProgress
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
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState<"create" | "edit">("create");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    points: 50,
    xp: 25,
    frequency: "daily",
    active: true
  });

  const todayKey = useMemo(() => new Date().toDateString(), []);
  const currentUserClaims = useMemo(
    () => claims.filter((claim) => claim.userId === currentUser.id),
    [claims, currentUser.id]
  );
  const pendingClaims = useMemo(
    () =>
      claims
        .filter((claim) => claim.status === "pending")
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [claims]
  );

  const approvedToday = currentUserClaims.filter(
    (claim) =>
      claim.status === "approved" &&
      claim.approvedAt &&
      new Date(claim.approvedAt).toDateString() === todayKey
  );

  const progressValue = Math.min((approvedToday.length / dailyGoal) * 100, 100);
  const dailyBonusUnlocked = approvedToday.length >= dailyGoal;

  const activeTasks = tasks.filter((task) => task.active);

  const getLatestClaimForTask = (task: Task) => {
    const relevantClaims = currentUserClaims.filter((claim) => {
      if (claim.taskId !== task.id) return false;
      if (task.frequency === "daily") {
        return new Date(claim.timestamp).toDateString() === todayKey;
      }
      return true;
    });

    return relevantClaims.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const openTaskModal = (task: Task) => {
    setClaimModalTask(task);
    setClaimNote("");
  };

  const handleCreateClaim = () => {
    if (!claimModalTask) return;
    onCreateClaim(claimModalTask.id, claimNote);
    setClaimModalTask(null);
    setClaimNote("");
  };

  const handleAdminConfirm = () => {
    if (adminPin !== currentUser.pin) {
      setAdminError("PIN incorrecto");
      return;
    }

    if (adminAction?.type === "approve" && adminAction.claim) {
      onApproveClaim(adminAction.claim.id);
    }
    if (adminAction?.type === "reject" && adminAction.claim) {
      onRejectClaim(adminAction.claim.id, rejectionNote);
    }
    if (adminAction?.type === "reset") {
      onResetProgress();
    }

    setAdminAction(null);
    setAdminPin("");
    setAdminError("");
    setRejectionNote("");
  };

  const openTaskForm = (mode: "create" | "edit", task?: Task) => {
    setTaskFormMode(mode);
    if (task) {
      setTaskForm({
        title: task.title,
        description: task.description ?? "",
        points: task.points,
        xp: task.xp,
        frequency: task.frequency,
        active: task.active
      });
      setEditingTaskId(task.id);
    } else {
      setTaskForm({
        title: "",
        description: "",
        points: 50,
        xp: 25,
        frequency: "daily",
        active: true
      });
      setEditingTaskId(null);
    }
    setTaskFormOpen(true);
  };

  const handleSubmitTaskForm = () => {
    if (!taskForm.title.trim()) return;

    if (taskFormMode === "create") {
      onCreateTask(taskForm);
    }

    if (taskFormMode === "edit") {
      if (editingTaskId) {
        onUpdateTask(editingTaskId, taskForm);
      }
    }

    setTaskFormOpen(false);
    setEditingTaskId(null);
  };

  const modeLabel = isAdmin ? "Modo Adulto" : "Modo Aventura";


  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-6 py-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <ListTodo className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Tareas</h1>
              <p className="text-white/80 text-sm">{modeLabel}</p>
            </div>
          </div>
          {!isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 text-white hover:bg-white/30"
              onClick={() => setShowHistory(true)}
            >
              <History className="w-4 h-4 mr-2" />
              Historial
            </Button>
          )}
        </div>

        {!isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-0">
              <Flag className="w-3 h-3 mr-1" />
              Racha {progress.streak} días
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              Puntos: {progress.points}
            </Badge>
          </div>
        )}
      </div>

      <div className="px-6 pt-6 space-y-6">
        {!isAdmin && (
          <Card className="p-4 bg-white/95 border-2 border-[#386FA4]/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-[#386FA4] font-semibold">
                  Objetivo diario
                </p>
                <p className="text-lg font-bold text-[#12130F]">
                  {approvedToday.length}/{dailyGoal} tareas aprobadas hoy
                </p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-0">
                +{bonusPoints} bonus
              </Badge>
            </div>
            <Progress value={progressValue} className="h-2 bg-[#E2DADB]" />
            {dailyBonusUnlocked && (
              <p className="text-xs text-emerald-600 font-semibold mt-2">
                ¡Bonus desbloqueado!
              </p>
            )}
          </Card>
        )}

        {!isAdmin && (
          <div>
            <h2 className="text-lg font-bold text-[#12130F] mb-3">Para hoy</h2>
            <div className="space-y-4">
              {activeTasks.map((task, index) => {
                const latestClaim = getLatestClaimForTask(task);
                const status = latestClaim?.status ?? "idle";

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 bg-white/95 border-2 border-[#386FA4]/20">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <h3 className="font-bold text-[#12130F]">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-[#386FA4]/80">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border-0">
                              +{task.points} pts
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-0">
                              +{task.xp} XP
                            </Badge>
                            <Badge className="bg-slate-100 text-slate-700 border-0">
                              {frequencyLabels[task.frequency]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                          {status === "idle" && (
                            <Button
                              className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white sm:w-auto"
                              onClick={() => openTaskModal(task)}
                            >
                              Marcar como hecha
                            </Button>
                          )}
                          {status === "pending" && (
                            <Button variant="secondary" disabled className="w-full sm:w-auto">
                              Pendiente de aprobación
                            </Button>
                          )}
                          {status === "approved" && (
                            <Button variant="secondary" disabled className="w-full sm:w-auto">
                              Aprobada ✅
                            </Button>
                          )}
                          {status === "rejected" && (
                            <Button variant="secondary" disabled className="w-full sm:w-auto">
                              Rechazada ❌
                            </Button>
                          )}
                          {status === "rejected" && latestClaim?.rejectionNote && (
                            <p className="text-xs text-red-500">
                              Motivo: {latestClaim.rejectionNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2">
            {(["pending", "tasks", "user"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "secondary"}
                className={
                  activeTab === tab
                    ? "bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                    : "bg-white/70 text-[#386FA4]"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab === "pending" && "Pendientes"}
                {tab === "tasks" && "Tareas"}
                {tab === "user" && "Usuario"}
              </Button>
            ))}
          </div>
        )}

        {isAdmin && activeTab === "pending" && (
          <div className="space-y-3">
            {pendingClaims.length === 0 && (
              <Card className="p-6 bg-white/90 border-2 border-[#386FA4]/20 text-center">
                <p className="text-[#386FA4] font-semibold">
                  No hay tareas pendientes 🎉
                </p>
              </Card>
            )}
            {pendingClaims.map((claim) => {
              const task = tasks.find((item) => item.id === claim.taskId);
              const user = users.find((item) => item.id === claim.userId);

              return (
                <Card
                  key={claim.id}
                  className="p-4 bg-white/95 border-2 border-[#386FA4]/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#386FA4]/10 flex items-center justify-center">
                          <UserRound className="w-4 h-4 text-[#386FA4]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#12130F]">
                            {user?.name ?? "Usuario"}
                          </p>
                          <p className="text-xs text-[#386FA4]">
                            {formatTime(claim.timestamp)}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-[#12130F]">
                        {task?.title ?? "Tarea"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-blue-100 text-blue-700 border-0">
                          +{task?.points ?? 0} pts
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700 border-0">
                          +{task?.xp ?? 0} XP
                        </Badge>
                      </div>
                      {claim.note && (
                        <p className="text-sm text-[#386FA4] mt-2">
                          Nota: {claim.note}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => {
                          setAdminAction({ type: "approve", claim });
                          setAdminPin("");
                          setAdminError("");
                        }}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600"
                        onClick={() => {
                          setAdminAction({ type: "reject", claim });
                          setAdminPin("");
                          setAdminError("");
                        }}
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
              className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
              onClick={() => openTaskForm("create")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva tarea
            </Button>
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-4 bg-white/95 border-2 border-[#386FA4]/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#12130F]">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-[#386FA4]">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-blue-100 text-blue-700 border-0">
                          {frequencyLabels[task.frequency]}
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-700 border-0">
                          +{task.points} pts
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700 border-0">
                          +{task.xp} XP
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <Switch
                        checked={task.active}
                        onCheckedChange={(checked) =>
                          onUpdateTask(task.id, { active: checked })
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTaskForm("edit", task)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isAdmin && activeTab === "user" && (
          <div className="space-y-4">
            <Card className="p-5 bg-white/95 border-2 border-[#386FA4]/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#386FA4]/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#386FA4]" />
                </div>
                <div>
                  <p className="text-sm text-[#386FA4] font-semibold">Nivel</p>
                  <p className="text-xl font-bold text-[#12130F]">
                    {Math.floor(progress.xp / 1000) + 1}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-[#386FA4] font-semibold">XP</p>
                  <p className="text-xl font-bold text-[#12130F]">{progress.xp}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-[#386FA4]">Puntos totales</p>
                  <p className="text-lg font-bold text-[#12130F]">
                    {progress.points}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#386FA4]">Racha diaria</p>
                  <p className="text-lg font-bold text-[#12130F]">
                    {progress.streak} días
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#386FA4]">Aprobadas hoy</p>
                  <p className="text-lg font-bold text-[#12130F]">
                    {approvedToday.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#386FA4]">Aprobadas semana</p>
                  <p className="text-lg font-bold text-[#12130F]">
                    {
                      currentUserClaims.filter(
                        (claim) => claim.status === "approved"
                      ).length
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="mt-6 w-full"
                onClick={() => {
                  setAdminAction({ type: "reset" });
                  setAdminPin("");
                  setAdminError("");
                }}
              >
                Resetear progreso
              </Button>
            </Card>
          </div>
        )}
      </div>

      <AnimatePresence>
        {claimModalTask && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md p-6 bg-white">
              <h3 className="text-lg font-bold text-[#12130F] mb-2">
                ¿Confirmás que completaste "{claimModalTask.title}"?
              </h3>
              <p className="text-sm text-[#386FA4] mb-4">
                Se enviará para aprobación.
              </p>
              <Textarea
                value={claimNote}
                onChange={(event) => setClaimNote(event.target.value)}
                placeholder="Nota opcional"
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setClaimModalTask(null)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                  onClick={handleCreateClaim}
                >
                  Enviar para aprobación
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adminAction && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-sm p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-[#386FA4]" />
                <h3 className="text-lg font-bold text-[#12130F]">
                  Confirmar acción
                </h3>
              </div>
              <p className="text-sm text-[#386FA4] mb-3">
                Ingresá tu PIN para continuar.
              </p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={adminPin}
                onChange={(event) =>
                  setAdminPin(event.target.value.replace(/\D/g, ""))
                }
                className="mb-3"
              />
              {adminAction.type === "reject" && (
                <Textarea
                  value={rejectionNote}
                  onChange={(event) => setRejectionNote(event.target.value)}
                  placeholder="Motivo opcional del rechazo"
                  className="mb-3"
                />
              )}
              {adminError && (
                <p className="text-sm text-red-500 font-semibold mb-2">
                  {adminError}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAdminAction(null);
                    setAdminPin("");
                    setAdminError("");
                    setRejectionNote("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                  onClick={handleAdminConfirm}
                >
                  Confirmar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {taskFormOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md p-6 bg-white">
              <h3 className="text-lg font-bold text-[#12130F] mb-3">
                {taskFormMode === "create" ? "Nueva tarea" : "Editar tarea"}
              </h3>
              <div className="space-y-3">
                <Input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Título"
                />
                <Textarea
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      description: event.target.value
                    }))
                  }
                  placeholder="Descripción opcional"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    value={taskForm.points}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        points: Number(event.target.value)
                      }))
                    }
                    placeholder="Puntos"
                  />
                  <Input
                    type="number"
                    value={taskForm.xp}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        xp: Number(event.target.value)
                      }))
                    }
                    placeholder="XP"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["daily", "weekly", "once"] as TaskFrequency[]).map((freq) => (
                    <Button
                      key={freq}
                      variant={taskForm.frequency === freq ? "default" : "secondary"}
                      onClick={() =>
                        setTaskForm((prev) => ({ ...prev, frequency: freq }))
                      }
                    >
                      {frequencyLabels[freq]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTaskFormOpen(false);
                    setEditingTaskId(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
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
            className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#12130F]">Historial</h3>
                <Button variant="ghost" onClick={() => setShowHistory(false)}>
                  Cerrar
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentUserClaims.length === 0 && (
                  <p className="text-sm text-[#386FA4]">
                    Todavía no hay tareas registradas.
                  </p>
                )}
                {currentUserClaims.map((claim) => {
                  const task = tasks.find((item) => item.id === claim.taskId);
                  return (
                    <div
                      key={claim.id}
                      className="p-3 border rounded-lg border-[#386FA4]/20"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#12130F]">
                          {task?.title ?? "Tarea"}
                        </p>
                        <span className="text-xs text-[#386FA4]">
                          {formatDate(claim.timestamp)} {formatTime(claim.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {claim.status === "pending" && (
                          <Badge className="bg-amber-100 text-amber-700 border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                        {claim.status === "approved" && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Aprobada
                          </Badge>
                        )}
                        {claim.status === "rejected" && (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            <XCircle className="w-3 h-3 mr-1" />
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
