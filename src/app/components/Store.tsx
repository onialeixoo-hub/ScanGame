import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where
} from "firebase/firestore";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Coins,
  Edit2,
  FolderPlus,
  Gift,
  History,
  Plus,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/firebase";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import type {
  RewardRequest,
  StoreCategory,
  StoreReward,
  TaskPriority,
  TaskRequest,
  User,
  UserProgress
} from "@/app/types";
import {
  getPriorityFromPoints,
  TASK_PRIORITY_CONFIG
} from "@/app/lib/task-priority";

import { seedStarterStore } from "@/app/lib/store-starter";

interface StoreProps {
  currentUser: User;
  progress: UserProgress;
}

type AdminTab = "requests" | "rewards" | "categories" | "tasks";

interface RewardDraft {
  name: string;
  description: string;
  categoryId: string;
  cost: number;
  active: boolean;
  emoji: string;
}

interface TaskDraft {
  title: string;
  description: string;
  points: number;
  xp: number;
  priority: TaskPriority;
}

const emptyRewardDraft: RewardDraft = {
  name: "",
  description: "",
  categoryId: "",
  cost: 150,
  active: true,
  emoji: "🎁"
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

export function Store({ currentUser, progress }: StoreProps) {
  const isAdmin = currentUser.role === "admin";

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [rewards, setRewards] = useState<StoreReward[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>([]);

  const [adminTab, setAdminTab] = useState<AdminTab>("requests");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);

  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardDraft, setRewardDraft] = useState<RewardDraft>(emptyRewardDraft);

  const [rejectRewardRequest, setRejectRewardRequest] =
    useState<RewardRequest | null>(null);
  const [rejectTaskRequest, setRejectTaskRequest] =
    useState<TaskRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const [taskRequestBeingResolved, setTaskRequestBeingResolved] =
    useState<TaskRequest | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({
    title: "",
    description: "",
    points: 60,
    xp: 30,
    priority: "medium"
  });

  useEffect(() => {
  if (isAdmin) {
    void seedStarterStore();
  }

  const unsubscribeCategories = onSnapshot(
      collection(db, "storeCategories"),
      (snapshot) => {
        const nextCategories = snapshot.docs
          .map((categoryDocument) => ({
            id: categoryDocument.id,
            ...(categoryDocument.data() as Omit<StoreCategory, "id">)
          }))
          .sort((a, b) => a.order - b.order);

        setCategories(nextCategories);
      },
      () => toast.error("No se pudieron cargar las categorías")
    );

    const unsubscribeRewards = onSnapshot(
      collection(db, "storeRewards"),
      (snapshot) => {
        const nextRewards = snapshot.docs
          .map((rewardDocument) => ({
            id: rewardDocument.id,
            ...(rewardDocument.data() as Omit<StoreReward, "id">)
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setRewards(nextRewards);
      },
      () => toast.error("No se pudieron cargar los premios")
    );

    const rewardRequestsReference = isAdmin
      ? collection(db, "rewardRequests")
      : query(
          collection(db, "rewardRequests"),
          where("userId", "==", currentUser.id)
        );

    const taskRequestsReference = isAdmin
      ? collection(db, "taskRequests")
      : query(
          collection(db, "taskRequests"),
          where("userId", "==", currentUser.id)
        );

    const unsubscribeRewardRequests = onSnapshot(
      rewardRequestsReference,
      (snapshot) => {
        const nextRequests = snapshot.docs
          .map((requestDocument) => ({
            id: requestDocument.id,
            ...(requestDocument.data() as Omit<RewardRequest, "id">)
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        setRewardRequests(nextRequests);
      },
      () => toast.error("No se pudieron cargar las solicitudes de premios")
    );

    const unsubscribeTaskRequests = onSnapshot(
      taskRequestsReference,
      (snapshot) => {
        const nextRequests = snapshot.docs
          .map((requestDocument) => ({
            id: requestDocument.id,
            ...(requestDocument.data() as Omit<TaskRequest, "id">)
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        setTaskRequests(nextRequests);
      },
      () => toast.error("No se pudieron cargar los pedidos de tareas")
    );

    return () => {
      unsubscribeCategories();
      unsubscribeRewards();
      unsubscribeRewardRequests();
      unsubscribeTaskRequests();
    };
  }, [currentUser.id, isAdmin]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active),
    [categories]
  );

  const visibleRewards = useMemo(
    () =>
      rewards.filter(
        (reward) =>
          reward.active &&
          categories.some(
            (category) =>
              category.id === reward.categoryId &&
              category.active
          )
      ),
    [categories, rewards]
  );

  const pendingRewardRequests = rewardRequests.filter(
    (request) => request.status === "pending"
  );

  const pendingTaskRequests = taskRequests.filter(
    (request) => request.status === "pending"
  );

  const hasPendingRewardRequest = (rewardId: string) =>
    rewardRequests.some(
      (request) =>
        request.rewardId === rewardId &&
        request.status === "pending"
    );

  const hasPendingTaskRequest = (rewardId: string) =>
    taskRequests.some(
      (request) =>
        request.rewardId === rewardId &&
        request.status === "pending"
    );

  const createCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;

    if (
      categories.some(
        (category) =>
          category.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      toast.error("Ya existe una categoría con ese nombre");
      return;
    }

    try {
      await addDoc(collection(db, "storeCategories"), {
        name,
        description: "",
        order:
          categories.length > 0
            ? Math.max(...categories.map((category) => category.order)) + 1
            : 0,
        active: true,
        createdAt: new Date().toISOString()
      });

      setCategoryName("");
      toast.success("Categoría creada");
    } catch {
      toast.error("No se pudo crear la categoría");
    }
  };

  const saveCategoryName = async () => {
    if (!editingCategory) return;

    const name = categoryName.trim();
    if (!name) return;

    try {
      await updateDoc(
        doc(db, "storeCategories", editingCategory.id),
        { name }
      );

      setEditingCategory(null);
      setCategoryName("");
      toast.success("Categoría actualizada");
    } catch {
      toast.error("No se pudo actualizar la categoría");
    }
  };

  const removeCategory = async (category: StoreCategory) => {
    if (
      rewards.some((reward) => reward.categoryId === category.id)
    ) {
      toast.error(
        "Mové o eliminá los premios de esta categoría antes de borrarla"
      );
      return;
    }

    try {
      await deleteDoc(doc(db, "storeCategories", category.id));
      toast.success("Categoría eliminada");
    } catch {
      toast.error("No se pudo eliminar la categoría");
    }
  };

  const moveCategory = async (
    category: StoreCategory,
    direction: -1 | 1
  ) => {
    const index = categories.findIndex(
      (item) => item.id === category.id
    );
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= categories.length) {
      return;
    }

    const target = categories[targetIndex];

    try {
      await Promise.all([
        updateDoc(doc(db, "storeCategories", category.id), {
          order: target.order
        }),
        updateDoc(doc(db, "storeCategories", target.id), {
          order: category.order
        })
      ]);
    } catch {
      toast.error("No se pudo reordenar la categoría");
    }
  };

  const openRewardForm = (reward?: StoreReward) => {
    if (reward) {
      setEditingRewardId(reward.id);
      setRewardDraft({
        name: reward.name,
        description: reward.description ?? "",
        categoryId: reward.categoryId,
        cost: reward.cost,
        active: reward.active,
        emoji: reward.emoji ?? "🎁"
      });
    } else {
      setEditingRewardId(null);
      setRewardDraft({
        ...emptyRewardDraft,
        categoryId: activeCategories[0]?.id ?? ""
      });
    }

    setRewardFormOpen(true);
  };

  const saveReward = async () => {
    const name = rewardDraft.name.trim();

    if (!name || !rewardDraft.categoryId || rewardDraft.cost <= 0) {
      toast.error("Completá nombre, categoría y costo");
      return;
    }

    const payload = {
      name,
      description: rewardDraft.description.trim(),
      categoryId: rewardDraft.categoryId,
      cost: Math.round(rewardDraft.cost),
      active: rewardDraft.active,
      emoji: rewardDraft.emoji.trim() || "🎁"
    };

    try {
      if (editingRewardId) {
        await updateDoc(
          doc(db, "storeRewards", editingRewardId),
          payload
        );
        toast.success("Premio actualizado");
      } else {
        await addDoc(collection(db, "storeRewards"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        toast.success("Premio creado");
      }

      setRewardFormOpen(false);
      setEditingRewardId(null);
      setRewardDraft(emptyRewardDraft);
    } catch {
      toast.error("No se pudo guardar el premio");
    }
  };

  const requestReward = async (reward: StoreReward) => {
    if (progress.points < reward.cost) return;

    if (hasPendingRewardRequest(reward.id)) {
      toast.error("Ya tenés una solicitud pendiente para este premio");
      return;
    }

    try {
      await addDoc(collection(db, "rewardRequests"), {
        rewardId: reward.id,
        rewardName: reward.name,
        userId: currentUser.id,
        cost: reward.cost,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      toast.success("Solicitud enviada");
    } catch {
      toast.error("No se pudo enviar la solicitud");
    }
  };

  const requestTaskForReward = async (reward: StoreReward) => {
    const missingPoints = Math.max(
      reward.cost - progress.points,
      1
    );

    if (hasPendingTaskRequest(reward.id)) {
      toast.error("Ya pediste una tarea para este premio");
      return;
    }

    try {
      await addDoc(collection(db, "taskRequests"), {
        userId: currentUser.id,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsNeeded: missingPoints,
        pointsAvailable: progress.points,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      toast.success(
        `Pedido enviado. Te faltan ${missingPoints} puntos.`
      );
    } catch {
      toast.error("No se pudo pedir una tarea");
    }
  };

  const approveRewardRequest = async (request: RewardRequest) => {
    const requestReference = doc(
      db,
      "rewardRequests",
      request.id
    );
    const progressReference = doc(
      db,
      "userProgress",
      request.userId
    );

    try {
      await runTransaction(db, async (transaction) => {
        const [requestSnapshot, progressSnapshot] =
          await Promise.all([
            transaction.get(requestReference),
            transaction.get(progressReference)
          ]);

        if (!requestSnapshot.exists()) {
          throw new Error("Solicitud inexistente");
        }

        const requestData =
          requestSnapshot.data() as RewardRequest;

        if (requestData.status !== "pending") {
          throw new Error("Solicitud ya resuelta");
        }

        const currentProgress = progressSnapshot.exists()
          ? (progressSnapshot.data() as UserProgress)
          : {
              xp: 0,
              points: 0,
              streak: 0
            };

        if ((currentProgress.points ?? 0) < requestData.cost) {
          throw new Error("Puntos insuficientes");
        }

        transaction.set(
          progressReference,
          {
            points:
              (currentProgress.points ?? 0) -
              requestData.cost
          },
          { merge: true }
        );

        transaction.update(requestReference, {
          status: "approved",
          approvedAt: new Date().toISOString()
        });
      });

      toast.success("Premio aprobado y puntos descontados");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "";

      if (message.includes("Puntos insuficientes")) {
        toast.error(
          "Marti ya no tiene los puntos necesarios para este canje"
        );
      } else {
        toast.error("No se pudo aprobar el premio");
      }
    }
  };

  const confirmRejectReward = async () => {
    if (!rejectRewardRequest) return;

    try {
      await updateDoc(
        doc(db, "rewardRequests", rejectRewardRequest.id),
        {
          status: "rejected",
          rejectedAt: new Date().toISOString(),
          rejectionNote: rejectionNote.trim()
        }
      );

      toast.success("Solicitud rechazada");
      setRejectRewardRequest(null);
      setRejectionNote("");
    } catch {
      toast.error("No se pudo rechazar la solicitud");
    }
  };

  const openTaskRequestForm = (request: TaskRequest) => {
    const points = Math.max(request.pointsNeeded, 30);
    const priority = getPriorityFromPoints(points);

    setTaskRequestBeingResolved(request);
    setTaskDraft({
      title: `Tarea para conseguir ${request.rewardName}`,
      description: `Objetivo: sumar puntos para ${request.rewardName}.`,
      points,
      xp: Math.max(Math.round(points / 2), 15),
      priority
    });
  };

  const saveTaskFromRequest = async () => {
    if (!taskRequestBeingResolved || !taskDraft.title.trim()) return;

    try {
      const createdTask = await addDoc(collection(db, "tasks"), {
        title: taskDraft.title.trim(),
        description: taskDraft.description.trim(),
        points: Math.max(Math.round(taskDraft.points), 1),
        xp: Math.max(Math.round(taskDraft.xp), 1),
        frequency: "once",
        active: true,
        priority: taskDraft.priority
      });

      await updateDoc(
        doc(db, "taskRequests", taskRequestBeingResolved.id),
        {
          status: "accepted",
          createdTaskId: createdTask.id,
          resolvedAt: new Date().toISOString()
        }
      );

      toast.success("Tarea creada para Marti");
      setTaskRequestBeingResolved(null);
    } catch {
      toast.error("No se pudo crear la tarea");
    }
  };

  const confirmRejectTask = async () => {
    if (!rejectTaskRequest) return;

    try {
      await updateDoc(
        doc(db, "taskRequests", rejectTaskRequest.id),
        {
          status: "rejected",
          resolvedAt: new Date().toISOString(),
          rejectionNote: rejectionNote.trim()
        }
      );

      toast.success("Pedido de tarea rechazado");
      setRejectTaskRequest(null);
      setRejectionNote("");
    } catch {
      toast.error("No se pudo rechazar el pedido");
    }
  };

  const renderUserStore = () => {
    const categoriesToRender =
      activeCategory === "all"
        ? activeCategories
        : activeCategories.filter(
            (category) => category.id === activeCategory
          );

    return (
      <>
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-5 py-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/75">
                Tienda de premios
              </p>
              <h1 className="text-2xl font-bold">¿Qué querés canjear?</h1>
            </div>

            <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
              <p className="text-[11px] text-white/75">Disponibles</p>
              <p className="text-lg font-bold">{progress.points} pts</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={activeCategory === "all" ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setActiveCategory("all")}
            >
              Todo
            </Button>

            {activeCategories.map((category) => (
              <Button
                key={category.id}
                size="sm"
                variant={
                  activeCategory === category.id
                    ? "secondary"
                    : "outline"
                }
                className="whitespace-nowrap"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-7 px-5 py-6">
          {categoriesToRender.map((category) => {
            const categoryRewards = visibleRewards.filter(
              (reward) => reward.categoryId === category.id
            );

            if (categoryRewards.length === 0) return null;

            return (
              <section key={category.id}>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-[#12130F]">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-xs text-[#386FA4]">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {categoryRewards.map((reward) => {
                    const hasEnough = progress.points >= reward.cost;
                    const missing = Math.max(
                      reward.cost - progress.points,
                      0
                    );
                    const rewardPending =
                      hasPendingRewardRequest(reward.id);
                    const taskPending =
                      hasPendingTaskRequest(reward.id);

                    return (
                      <Card
                        key={reward.id}
                        className="border-2 border-[#386FA4]/15 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#386FA4]/10 text-2xl">
                            {reward.emoji ?? "🎁"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-[#12130F]">
                                  {reward.name}
                                </h3>
                                {reward.description && (
                                  <p className="mt-1 text-sm text-[#386FA4]/80">
                                    {reward.description}
                                  </p>
                                )}
                              </div>

                              <Badge className="border-0 bg-amber-100 text-amber-700">
                                <Coins className="mr-1 h-3 w-3" />
                                {reward.cost}
                              </Badge>
                            </div>

                            <div className="mt-3">
                              {rewardPending ? (
                                <Button
                                  disabled
                                  className="w-full"
                                  variant="secondary"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Solicitud pendiente
                                </Button>
                              ) : hasEnough ? (
                                <Button
                                  className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                                  onClick={() => void requestReward(reward)}
                                >
                                  <Gift className="mr-2 h-4 w-4" />
                                  Solicitar por {reward.cost} pts
                                </Button>
                              ) : taskPending ? (
                                <Button
                                  disabled
                                  className="w-full"
                                  variant="secondary"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Pedido de tarea enviado
                                </Button>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-rose-600">
                                    Te faltan {missing} puntos
                                  </p>
                                  <Button
                                    variant="outline"
                                    className="w-full border-[#386FA4]/30 text-[#386FA4]"
                                    onClick={() =>
                                      void requestTaskForReward(reward)
                                    }
                                  >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Pedir una tarea para conseguirlo
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {visibleRewards.length === 0 && (
            <Card className="border-2 border-dashed border-[#386FA4]/25 bg-white/70 p-6 text-center">
              <Gift className="mx-auto mb-2 h-8 w-8 text-[#386FA4]" />
              <p className="font-bold text-[#12130F]">
                Todavía no hay premios disponibles
              </p>
            </Card>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-[#386FA4]" />
              <h2 className="text-lg font-bold text-[#12130F]">
                Mis solicitudes
              </h2>
            </div>

            <div className="space-y-2">
              {rewardRequests.slice(0, 8).map((request) => (
                <Card
                  key={request.id}
                  className="border border-[#386FA4]/15 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#12130F]">
                        {request.rewardName}
                      </p>
                      <p className="text-xs text-[#386FA4]">
                        {formatDateTime(request.createdAt)}
                      </p>
                    </div>

                    <Badge
                      className={
                        request.status === "approved"
                          ? "border-0 bg-emerald-100 text-emerald-700"
                          : request.status === "rejected"
                            ? "border-0 bg-red-100 text-red-700"
                            : "border-0 bg-amber-100 text-amber-700"
                      }
                    >
                      {request.status === "approved"
                        ? "Aprobado"
                        : request.status === "rejected"
                          ? "Rechazado"
                          : "Pendiente"}
                    </Badge>
                  </div>

                  {request.status === "rejected" &&
                    request.rejectionNote && (
                      <p className="mt-2 text-xs text-red-600">
                        Motivo: {request.rejectionNote}
                      </p>
                    )}
                </Card>
              ))}

              {rewardRequests.length === 0 && (
                <p className="text-sm text-[#386FA4]">
                  Todavía no pediste ningún premio.
                </p>
              )}
            </div>
          </section>
        </div>
      </>
    );
  };

  const renderAdminStore = () => (
    <>
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-5 py-5 text-white shadow-lg">
        <p className="text-xs font-semibold text-white/75">
          Modo Adulto
        </p>
        <h1 className="text-2xl font-bold">Tienda</h1>

        <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-white/10 p-1">
          {(
            [
              ["requests", "Canjes"],
              ["tasks", "Tareas"],
              ["rewards", "Premios"],
              ["categories", "Categorías"]
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setAdminTab(tab)}
              className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${
                adminTab === tab
                  ? "bg-white text-[#386FA4]"
                  : "text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-5 py-6">
        {adminTab === "requests" && (
          <>
            <div>
              <h2 className="text-lg font-bold text-[#12130F]">
                Solicitudes de premios
              </h2>
              <p className="text-sm text-[#386FA4]">
                Los puntos se descuentan recién cuando aprobás.
              </p>
            </div>

            {pendingRewardRequests.map((request) => (
              <Card
                key={request.id}
                className="border-2 border-[#386FA4]/15 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#12130F]">
                      {request.rewardName}
                    </p>
                    <p className="mt-1 text-sm text-[#386FA4]">
                      Costo: {request.cost} puntos
                    </p>
                    <p className="mt-1 text-xs text-[#386FA4]/70">
                      {formatDateTime(request.createdAt)}
                    </p>
                  </div>

                  <Badge className="border-0 bg-amber-100 text-amber-700">
                    Pendiente
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                    onClick={() =>
                      void approveRewardRequest(request)
                    }
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>

                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600"
                    onClick={() => {
                      setRejectRewardRequest(request);
                      setRejectionNote("");
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}

            {pendingRewardRequests.length === 0 && (
              <Card className="border-2 border-dashed border-[#386FA4]/25 bg-white/70 p-6 text-center">
                <p className="font-semibold text-[#386FA4]">
                  No hay canjes pendientes.
                </p>
              </Card>
            )}

            <div className="pt-2">
              <h3 className="mb-2 font-bold text-[#12130F]">
                Historial reciente
              </h3>
              <div className="space-y-2">
                {rewardRequests
                  .filter((request) => request.status !== "pending")
                  .slice(0, 8)
                  .map((request) => (
                    <Card
                      key={request.id}
                      className="border border-[#386FA4]/15 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[#12130F]">
                          {request.rewardName}
                        </p>
                        <Badge
                          className={
                            request.status === "approved"
                              ? "border-0 bg-emerald-100 text-emerald-700"
                              : "border-0 bg-red-100 text-red-700"
                          }
                        >
                          {request.status === "approved"
                            ? "Aprobado"
                            : "Rechazado"}
                        </Badge>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </>
        )}

        {adminTab === "tasks" && (
          <>
            <div>
              <h2 className="text-lg font-bold text-[#12130F]">
                Pedidos de tareas
              </h2>
              <p className="text-sm text-[#386FA4]">
                Marti puede pedir una tarea cuando no le alcanzan los puntos.
              </p>
            </div>

            {pendingTaskRequests.map((request) => (
              <Card
                key={request.id}
                className="border-2 border-[#386FA4]/15 bg-white p-4"
              >
                <p className="font-bold text-[#12130F]">
                  Quiere conseguir: {request.rewardName}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Tiene</p>
                    <p className="font-bold text-slate-800">
                      {request.pointsAvailable} pts
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs text-amber-600">Le faltan</p>
                    <p className="font-bold text-amber-800">
                      {request.pointsNeeded} pts
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    className="bg-[#386FA4] text-white hover:bg-[#2d5a85]"
                    onClick={() => openTaskRequestForm(request)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear tarea
                  </Button>

                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600"
                    onClick={() => {
                      setRejectTaskRequest(request);
                      setRejectionNote("");
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}

            {pendingTaskRequests.length === 0 && (
              <Card className="border-2 border-dashed border-[#386FA4]/25 bg-white/70 p-6 text-center">
                <p className="font-semibold text-[#386FA4]">
                  No hay pedidos de tareas.
                </p>
              </Card>
            )}
          </>
        )}

        {adminTab === "rewards" && (
          <>
            <Button
              className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
              onClick={() => openRewardForm()}
              disabled={activeCategories.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo premio
            </Button>

            {activeCategories.length === 0 && (
              <p className="text-sm text-amber-700">
                Primero creá al menos una categoría.
              </p>
            )}

            <div className="space-y-3">
              {rewards.map((reward) => {
                const category = categories.find(
                  (item) => item.id === reward.categoryId
                );

                return (
                  <Card
                    key={reward.id}
                    className="border-2 border-[#386FA4]/15 bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {reward.emoji ?? "🎁"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-[#12130F]">
                              {reward.name}
                            </p>
                            <p className="text-xs text-[#386FA4]">
                              {category?.name ?? "Sin categoría"} ·{" "}
                              {reward.cost} pts
                            </p>
                          </div>

                          <Switch
                            checked={reward.active}
                            onCheckedChange={(checked) =>
                              void updateDoc(
                                doc(db, "storeRewards", reward.id),
                                { active: checked }
                              )
                            }
                          />
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRewardForm(reward)}
                          >
                            <Edit2 className="mr-1 h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() =>
                              void deleteDoc(
                                doc(db, "storeRewards", reward.id)
                              ).catch(() =>
                                toast.error(
                                  "No se pudo eliminar el premio"
                                )
                              )
                            }
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Borrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {adminTab === "categories" && (
          <>
            <Card className="border-2 border-[#386FA4]/15 bg-white p-4">
              <div className="flex gap-2">
                <Input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(event.target.value)
                  }
                  placeholder={
                    editingCategory
                      ? "Nuevo nombre"
                      : "Ej: Bebidas, Salidas, Comida"
                  }
                />

                <Button
                  onClick={() =>
                    void (
                      editingCategory
                        ? saveCategoryName()
                        : createCategory()
                    )
                  }
                  className="bg-[#386FA4] text-white"
                >
                  {editingCategory ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <FolderPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {editingCategory && (
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-[#386FA4]"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </Card>

            <div className="space-y-3">
              {categories.map((category, index) => (
                <Card
                  key={category.id}
                  className="border-2 border-[#386FA4]/15 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#12130F]">
                        {category.name}
                      </p>
                      <p className="text-xs text-[#386FA4]">
                        {
                          rewards.filter(
                            (reward) =>
                              reward.categoryId === category.id
                          ).length
                        }{" "}
                        premios
                      </p>
                    </div>

                    <Switch
                      checked={category.active}
                      onCheckedChange={(checked) =>
                        void updateDoc(
                          doc(db, "storeCategories", category.id),
                          { active: checked }
                        )
                      }
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() =>
                        void moveCategory(category, -1)
                      }
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === categories.length - 1}
                      onClick={() =>
                        void moveCategory(category, 1)
                      }
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryName(category.name);
                      }}
                    >
                      <Edit2 className="mr-1 h-4 w-4" />
                      Renombrar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => void removeCategory(category)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Borrar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      {isAdmin ? renderAdminStore() : renderUserStore()}

      {rewardFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/50 px-5 py-8">
          <Card className="w-full max-w-md bg-white p-5">
            <h3 className="text-lg font-bold text-[#12130F]">
              {editingRewardId ? "Editar premio" : "Nuevo premio"}
            </h3>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-[72px_1fr] gap-2">
                <Input
                  value={rewardDraft.emoji}
                  onChange={(event) =>
                    setRewardDraft((previous) => ({
                      ...previous,
                      emoji: event.target.value
                    }))
                  }
                  placeholder="🎁"
                />
                <Input
                  value={rewardDraft.name}
                  onChange={(event) =>
                    setRewardDraft((previous) => ({
                      ...previous,
                      name: event.target.value
                    }))
                  }
                  placeholder="Nombre del premio"
                />
              </div>

              <Textarea
                value={rewardDraft.description}
                onChange={(event) =>
                  setRewardDraft((previous) => ({
                    ...previous,
                    description: event.target.value
                  }))
                }
                placeholder="Descripción opcional"
              />

              <select
                value={rewardDraft.categoryId}
                onChange={(event) =>
                  setRewardDraft((previous) => ({
                    ...previous,
                    categoryId: event.target.value
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Elegí una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#386FA4]">
                  Costo en puntos
                </label>
                <Input
                  type="number"
                  min={1}
                  value={rewardDraft.cost}
                  onChange={(event) =>
                    setRewardDraft((previous) => ({
                      ...previous,
                      cost: Number(event.target.value)
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-sm font-semibold text-slate-700">
                  Premio activo
                </span>
                <Switch
                  checked={rewardDraft.active}
                  onCheckedChange={(checked) =>
                    setRewardDraft((previous) => ({
                      ...previous,
                      active: checked
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRewardFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#386FA4] text-white"
                onClick={() => void saveReward()}
              >
                Guardar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {rejectRewardRequest && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-5">
          <Card className="w-full max-w-sm bg-white p-5">
            <h3 className="font-bold text-[#12130F]">
              Rechazar {rejectRewardRequest.rewardName}
            </h3>
            <Textarea
              className="mt-3"
              value={rejectionNote}
              onChange={(event) =>
                setRejectionNote(event.target.value)
              }
              placeholder="Motivo opcional"
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRejectRewardRequest(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-500 text-white"
                onClick={() => void confirmRejectReward()}
              >
                Rechazar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {rejectTaskRequest && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-5">
          <Card className="w-full max-w-sm bg-white p-5">
            <h3 className="font-bold text-[#12130F]">
              Rechazar pedido de tarea
            </h3>
            <Textarea
              className="mt-3"
              value={rejectionNote}
              onChange={(event) =>
                setRejectionNote(event.target.value)
              }
              placeholder="Motivo opcional"
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRejectTaskRequest(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-500 text-white"
                onClick={() => void confirmRejectTask()}
              >
                Rechazar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {taskRequestBeingResolved && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-black/50 px-5 py-8">
          <Card className="w-full max-w-md bg-white p-5">
            <h3 className="text-lg font-bold text-[#12130F]">
              Crear tarea para {taskRequestBeingResolved.rewardName}
            </h3>

            <p className="mt-1 text-sm text-[#386FA4]">
              Le faltan {taskRequestBeingResolved.pointsNeeded} puntos.
              Podés cambiar la recompensa antes de guardar.
            </p>

            <div className="mt-4 space-y-3">
              <Input
                value={taskDraft.title}
                onChange={(event) =>
                  setTaskDraft((previous) => ({
                    ...previous,
                    title: event.target.value
                  }))
                }
                placeholder="Título de la tarea"
              />

              <Textarea
                value={taskDraft.description}
                onChange={(event) =>
                  setTaskDraft((previous) => ({
                    ...previous,
                    description: event.target.value
                  }))
                }
                placeholder="Descripción"
              />

              <div>
                <p className="mb-2 text-xs font-semibold text-[#386FA4]">
                  Prioridad sugerida
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {(
                    [
                      "low",
                      "medium",
                      "high",
                      "very_high",
                      "special"
                    ] as TaskPriority[]
                  ).map((priority) => {
                    const config = TASK_PRIORITY_CONFIG[priority];

                    return (
                      <button
                        key={priority}
                        type="button"
                        className={`rounded-xl border px-1 py-2 text-[10px] font-bold ${
                          taskDraft.priority === priority
                            ? config.buttonClass
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                        onClick={() =>
                          setTaskDraft((previous) => ({
                            ...previous,
                            priority,
                            points: config.points,
                            xp: config.xp
                          }))
                        }
                      >
                        {config.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#386FA4]">
                    Puntos
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={taskDraft.points}
                    onChange={(event) => {
                      const points = Number(event.target.value);
                      setTaskDraft((previous) => ({
                        ...previous,
                        points,
                        priority: getPriorityFromPoints(points)
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#386FA4]">
                    XP
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={taskDraft.xp}
                    onChange={(event) =>
                      setTaskDraft((previous) => ({
                        ...previous,
                        xp: Number(event.target.value)
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setTaskRequestBeingResolved(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#386FA4] text-white"
                onClick={() => void saveTaskFromRequest()}
              >
                Crear tarea
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
