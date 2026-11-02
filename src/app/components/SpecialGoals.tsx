import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where
} from "firebase/firestore";
import {
  Check,
  Edit2,
  Gamepad2,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  X
} from "lucide-react";
import { toast } from "sonner";

import { db } from "@/firebase";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Progress } from "@/app/components/ui/progress";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import type { User, UserProgress } from "@/app/types";

interface SpecialGoalsProps {
  currentUser: User;
  progress: UserProgress;
}

interface SpecialGoal {
  id: string;
  name: string;
  description?: string;
  targetPoints: number;
  emoji?: string;
  active: boolean;
  createdAt: string;
}

interface GoalProgress {
  id: string;
  userId: string;
  goalId: string;
  savedPoints: number;
  updatedAt: string;
  completedAt?: string | null;
}

interface GoalDraft {
  name: string;
  description: string;
  targetPoints: number;
  emoji: string;
  active: boolean;
}

interface GoalTaskRequest {
  id: string;
  rewardId: string;
  userId: string;
  status: string;
  requestType?: string;
}

const emptyGoalDraft: GoalDraft = {
  name: "",
  description: "",
  targetPoints: 8000,
  emoji: "🎮",
  active: true
};

export function SpecialGoals({
  currentUser,
  progress
}: SpecialGoalsProps) {
  const isAdmin = currentUser.role === "admin";

  const [goals, setGoals] = useState<SpecialGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [goalTaskRequests, setGoalTaskRequests] =
    useState<GoalTaskRequest[]>([]);

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] =
    useState<GoalDraft>(emptyGoalDraft);

  const [savingGoal, setSavingGoal] =
    useState<SpecialGoal | null>(null);
  const [contribution, setContribution] = useState(100);

  useEffect(() => {
    const unsubscribeGoals = onSnapshot(
      collection(db, "specialGoals"),
      (snapshot) => {
        const nextGoals = snapshot.docs
          .map((goalDocument) => ({
            id: goalDocument.id,
            ...(goalDocument.data() as Omit<SpecialGoal, "id">)
          }))
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );

        setGoals(nextGoals);
      },
      () => toast.error("No se pudieron cargar las metas especiales")
    );

    const progressReference = isAdmin
      ? collection(db, "goalProgress")
      : query(
          collection(db, "goalProgress"),
          where("userId", "==", currentUser.id)
        );

    const unsubscribeProgress = onSnapshot(
      progressReference,
      (snapshot) => {
        setGoalProgress(
          snapshot.docs.map((progressDocument) => ({
            id: progressDocument.id,
            ...(progressDocument.data() as Omit<GoalProgress, "id">)
          }))
        );
      },
      () => toast.error("No se pudo cargar el progreso de las metas")
    );

    let unsubscribeTaskRequests = () => {};

    if (!isAdmin) {
      const taskRequestsReference = query(
        collection(db, "taskRequests"),
        where("userId", "==", currentUser.id)
      );

      unsubscribeTaskRequests = onSnapshot(
        taskRequestsReference,
        (snapshot) => {
          setGoalTaskRequests(
            snapshot.docs.map((requestDocument) => ({
              id: requestDocument.id,
              ...(requestDocument.data() as Omit<
                GoalTaskRequest,
                "id"
              >)
            }))
          );
        }
      );
    }

    return () => {
      unsubscribeGoals();
      unsubscribeProgress();
      unsubscribeTaskRequests();
    };
  }, [currentUser.id, isAdmin]);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.active),
    [goals]
  );

  const savedForGoal = (goalId: string) =>
    goalProgress
      .filter((item) => item.goalId === goalId)
      .reduce((total, item) => total + (item.savedPoints ?? 0), 0);

  const userSavedForGoal = (goalId: string) =>
    goalProgress.find(
      (item) =>
        item.goalId === goalId &&
        item.userId === currentUser.id
    )?.savedPoints ?? 0;

  const openGoalForm = (goal?: SpecialGoal) => {
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalDraft({
        name: goal.name,
        description: goal.description ?? "",
        targetPoints: goal.targetPoints,
        emoji: goal.emoji ?? "🎯",
        active: goal.active
      });
    } else {
      setEditingGoalId(null);
      setGoalDraft(emptyGoalDraft);
    }

    setGoalFormOpen(true);
  };

  const saveGoal = async () => {
    const name = goalDraft.name.trim();
    const targetPoints = Math.round(goalDraft.targetPoints);

    if (!name || targetPoints <= 0) {
      toast.error("Completá el nombre y una meta de puntos válida");
      return;
    }

    const payload = {
      name,
      description: goalDraft.description.trim(),
      targetPoints,
      emoji: goalDraft.emoji.trim() || "🎯",
      active: goalDraft.active
    };

    try {
      if (editingGoalId) {
        await updateDoc(
          doc(db, "specialGoals", editingGoalId),
          payload
        );
        toast.success("Meta actualizada");
      } else {
        await addDoc(collection(db, "specialGoals"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast.success("Meta creada");
      }

      setGoalFormOpen(false);
      setEditingGoalId(null);
      setGoalDraft(emptyGoalDraft);
    } catch {
      toast.error("No se pudo guardar la meta");
    }
  };

  const createGtaGoal = async () => {
    const exists = goals.some((goal) =>
      goal.name.toLowerCase().includes("gta")
    );

    if (exists) {
      toast.error("Ya existe una meta de GTA");
      return;
    }

    try {
      await addDoc(collection(db, "specialGoals"), {
        name: "GTA VI",
        description:
          "Ahorrar puntos para comprar GTA VI. Cada aporte queda reservado para esta meta.",
        targetPoints: 8000,
        emoji: "🎮",
        active: true,
        createdAt: new Date().toISOString()
      });

      toast.success("Meta GTA VI creada");
    } catch {
      toast.error("No se pudo crear la meta de GTA VI");
    }
  };

  const openContribution = (goal: SpecialGoal) => {
    const saved = userSavedForGoal(goal.id);
    const remaining = Math.max(goal.targetPoints - saved, 0);

    setSavingGoal(goal);
    setContribution(
      Math.min(
        100,
        progress.points,
        remaining
      )
    );
  };

  const contributeToGoal = async () => {
    if (!savingGoal) return;

    const requestedAmount = Math.max(
      Math.round(contribution),
      0
    );

    if (requestedAmount <= 0) {
      toast.error("Elegí cuántos puntos querés guardar");
      return;
    }

    const progressReference = doc(
      db,
      "userProgress",
      currentUser.id
    );

    const goalReference = doc(
      db,
      "specialGoals",
      savingGoal.id
    );

    const goalProgressReference = doc(
      db,
      "goalProgress",
      `${currentUser.id}_${savingGoal.id}`
    );

    try {
      await runTransaction(db, async (transaction) => {
        const [
          userProgressSnapshot,
          goalSnapshot,
          savedSnapshot
        ] = await Promise.all([
          transaction.get(progressReference),
          transaction.get(goalReference),
          transaction.get(goalProgressReference)
        ]);

        if (!goalSnapshot.exists()) {
          throw new Error("La meta ya no existe");
        }

        const currentGoal = goalSnapshot.data() as Omit<
          SpecialGoal,
          "id"
        >;

        if (!currentGoal.active) {
          throw new Error("La meta está pausada");
        }

        const availablePoints = userProgressSnapshot.exists()
          ? Number(userProgressSnapshot.data().points ?? 0)
          : 0;

        const currentSaved = savedSnapshot.exists()
          ? Number(savedSnapshot.data().savedPoints ?? 0)
          : 0;

        const remaining = Math.max(
          currentGoal.targetPoints - currentSaved,
          0
        );

        const amount = Math.min(
          requestedAmount,
          availablePoints,
          remaining
        );

        if (amount <= 0) {
          throw new Error("No hay puntos disponibles para aportar");
        }

        const nextSaved = currentSaved + amount;
        const now = new Date().toISOString();

        transaction.set(
          progressReference,
          {
            points: availablePoints - amount
          },
          { merge: true }
        );

        transaction.set(
          goalProgressReference,
          {
            userId: currentUser.id,
            goalId: savingGoal.id,
            savedPoints: nextSaved,
            updatedAt: now,
            completedAt:
              nextSaved >= currentGoal.targetPoints
                ? now
                : null
          },
          { merge: true }
        );
      });

      toast.success(
        `${requestedAmount} puntos guardados para ${savingGoal.name}`
      );
      setSavingGoal(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los puntos"
      );
    }
  };

  const hasPendingGoalTask = (goalId: string) =>
    goalTaskRequests.some(
      (request) =>
        request.rewardId === goalId &&
        request.status === "pending" &&
        request.requestType === "goal"
    );

  const requestTaskForGoal = async (goal: SpecialGoal) => {
    if (hasPendingGoalTask(goal.id)) {
      toast.error("Ya pediste una tarea para avanzar en esta meta");
      return;
    }

    const saved = userSavedForGoal(goal.id);
    const remaining = Math.max(goal.targetPoints - saved, 0);

    if (remaining <= 0) {
      toast.success("¡Esta meta ya está completa!");
      return;
    }

    const suggestedTaskPoints = Math.min(remaining, 100);

    try {
      await addDoc(collection(db, "taskRequests"), {
        userId: currentUser.id,
        rewardId: goal.id,
        rewardName: goal.name,
        pointsNeeded: suggestedTaskPoints,
        pointsAvailable: progress.points,
        requestType: "goal",
        status: "pending",
        createdAt: new Date().toISOString()
      });

      toast.success("Pedido de tarea enviado");
    } catch {
      toast.error("No se pudo pedir una tarea");
    }
  };

  const renderGoalCard = (goal: SpecialGoal) => {
    const saved = isAdmin
      ? savedForGoal(goal.id)
      : userSavedForGoal(goal.id);

    const percentage = Math.min(
      (saved / Math.max(goal.targetPoints, 1)) * 100,
      100
    );

    const remaining = Math.max(goal.targetPoints - saved, 0);
    const completed = remaining === 0;

    return (
      <Card
        key={goal.id}
        className="overflow-hidden border-2 border-violet-200 bg-white shadow-md"
      >
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              {goal.emoji ?? "🎯"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                    Meta especial
                  </p>
                  <h3 className="text-xl font-bold">
                    {goal.name}
                  </h3>
                </div>

                {completed && (
                  <Badge className="border-0 bg-emerald-400 text-emerald-950">
                    ¡Completa!
                  </Badge>
                )}
              </div>

              {goal.description && (
                <p className="mt-1 text-sm text-white/80">
                  {goal.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-violet-600">
                Ahorrado
              </p>
              <p className="text-xl font-bold text-[#12130F]">
                {saved} / {goal.targetPoints} pts
              </p>
            </div>

            {!completed && (
              <p className="text-right text-xs font-semibold text-[#386FA4]">
                Faltan {remaining} pts
              </p>
            )}
          </div>

          <Progress
            value={percentage}
            className="mt-3 h-3 bg-violet-100"
          />

          {!isAdmin && !completed && (
            <div className="mt-4 grid gap-2">
              <Button
                onClick={() => openContribution(goal)}
                disabled={progress.points <= 0}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                <PiggyBank className="mr-2 h-4 w-4" />
                Guardar puntos
              </Button>

              <Button
                variant="outline"
                className="border-violet-200 text-violet-700"
                onClick={() => void requestTaskForGoal(goal)}
                disabled={hasPendingGoalTask(goal.id)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {hasPendingGoalTask(goal.id)
                  ? "Tarea solicitada"
                  : "Pedir una tarea para avanzar"}
              </Button>
            </div>
          )}

          {isAdmin && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openGoalForm(goal)}
              >
                <Edit2 className="mr-1 h-4 w-4" />
                Editar
              </Button>

              <Switch
                checked={goal.active}
                onCheckedChange={(checked) =>
                  void updateDoc(
                    doc(db, "specialGoals", goal.id),
                    { active: checked }
                  ).catch(() =>
                    toast.error("No se pudo cambiar el estado")
                  )
                }
              />
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (isAdmin) {
    return (
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Objetivos grandes
          </p>
          <h2 className="text-xl font-bold text-[#12130F]">
            Metas especiales
          </h2>
          <p className="mt-1 text-sm text-[#386FA4]">
            Los puntos que Marti aporta quedan reservados y dejan de estar disponibles en la tienda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            onClick={() => openGoalForm()}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva meta
          </Button>

          <Button
            variant="outline"
            className="border-violet-200 text-violet-700"
            onClick={() => void createGtaGoal()}
          >
            <Gamepad2 className="mr-2 h-4 w-4" />
            Crear GTA VI · 8000 pts
          </Button>
        </div>

        <div className="space-y-3">
          {goals.map(renderGoalCard)}

          {goals.length === 0 && (
            <Card className="border-2 border-dashed border-violet-200 bg-white/70 p-6 text-center">
              <Target className="mx-auto mb-2 h-8 w-8 text-violet-600" />
              <p className="font-bold text-[#12130F]">
                Todavía no hay metas especiales
              </p>
              <p className="mt-1 text-sm text-[#386FA4]">
                Podés arrancar creando GTA VI.
              </p>
            </Card>
          )}
        </div>

        {goalFormOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center overflow-y-auto bg-black/55 px-5 py-8">
            <Card className="w-full max-w-md bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#12130F]">
                  {editingGoalId ? "Editar meta" : "Nueva meta"}
                </h3>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setGoalFormOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-[72px_1fr] gap-2">
                  <Input
                    value={goalDraft.emoji}
                    onChange={(event) =>
                      setGoalDraft((previous) => ({
                        ...previous,
                        emoji: event.target.value
                      }))
                    }
                    placeholder="🎯"
                  />

                  <Input
                    value={goalDraft.name}
                    onChange={(event) =>
                      setGoalDraft((previous) => ({
                        ...previous,
                        name: event.target.value
                      }))
                    }
                    placeholder="Nombre de la meta"
                  />
                </div>

                <Textarea
                  value={goalDraft.description}
                  onChange={(event) =>
                    setGoalDraft((previous) => ({
                      ...previous,
                      description: event.target.value
                    }))
                  }
                  placeholder="Descripción opcional"
                />

                <div>
                  <p className="mb-1 text-xs font-semibold text-[#386FA4]">
                    Objetivo en puntos
                  </p>
                  <Input
                    type="number"
                    min={1}
                    value={goalDraft.targetPoints}
                    onChange={(event) =>
                      setGoalDraft((previous) => ({
                        ...previous,
                        targetPoints: Number(event.target.value)
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#E2DADB]/60 p-3">
                  <div>
                    <p className="font-semibold text-[#12130F]">
                      Meta activa
                    </p>
                    <p className="text-xs text-[#386FA4]">
                      Marti puede verla y aportar.
                    </p>
                  </div>

                  <Switch
                    checked={goalDraft.active}
                    onCheckedChange={(checked) =>
                      setGoalDraft((previous) => ({
                        ...previous,
                        active: checked
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => void saveGoal()}
                className="mt-4 w-full bg-violet-600 text-white hover:bg-violet-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Guardar meta
              </Button>
            </Card>
          </div>
        )}
      </section>
    );
  }

  if (activeGoals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-violet-600" />
        <div>
          <h2 className="text-lg font-bold text-[#12130F]">
            Metas especiales
          </h2>
          <p className="text-xs text-[#386FA4]">
            Ahorrá puntos para premios grandes.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activeGoals.map(renderGoalCard)}
      </div>

      {savingGoal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/55 px-5">
          <Card className="w-full max-w-sm bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                  Ahorro
                </p>
                <h3 className="text-lg font-bold text-[#12130F]">
                  {savingGoal.emoji} {savingGoal.name}
                </h3>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSavingGoal(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-4 rounded-2xl bg-violet-50 p-4">
              <p className="text-xs text-violet-600">
                Tenés disponibles
              </p>
              <p className="text-2xl font-bold text-violet-950">
                {progress.points} pts
              </p>
              <p className="mt-1 text-xs text-violet-700">
                Los puntos que guardes dejan de estar disponibles para canjes normales.
              </p>
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold text-[#386FA4]">
                ¿Cuántos querés guardar?
              </p>
              <Input
                type="number"
                min={1}
                max={progress.points}
                value={contribution}
                onChange={(event) =>
                  setContribution(Number(event.target.value))
                }
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[100, 250, 500].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={progress.points < amount}
                  onClick={() => setContribution(amount)}
                >
                  {amount}
                </Button>
              ))}
            </div>

            <Button
              onClick={() => void contributeToGoal()}
              disabled={contribution <= 0 || progress.points <= 0}
              className="mt-4 w-full bg-violet-600 text-white hover:bg-violet-700"
            >
              <PiggyBank className="mr-2 h-4 w-4" />
              Guardar {Math.max(Math.round(contribution), 0)} pts
            </Button>
          </Card>
        </div>
      )}
    </section>
  );
}
