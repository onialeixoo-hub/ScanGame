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
  Coins,
  History,
  Sparkles,
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
import type { User, UserProgress } from "@/app/types";
import { getPriorityFromPoints, TASK_PRIORITY_CONFIG } from "@/app/lib/task-priority";
import { seedStarterStore } from "@/app/lib/store-starter";

type TaskPriority = keyof typeof TASK_PRIORITY_CONFIG;
type AdminTab = "requests" | "tasks" | "rewards" | "categories";

interface StoreProps {
  currentUser: User;
  progress: UserProgress;
}

interface StoreCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  active: boolean;
}

interface StoreReward {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  cost: number;
  active: boolean;
  emoji?: string;
}

interface RewardRequest {
  id: string;
  rewardId: string;
  rewardName: string;
  userId: string;
  cost: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  rejectionNote?: string;
}

interface TaskRequest {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  pointsNeeded: number;
  pointsAvailable: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  requestType?: "custom";
  customNote?: string;
}

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

const statusLabel = (status: string) => {
  if (status === "pending") return "Pendiente";
  if (status === "approved") return "Aprobado";
  if (status === "accepted") return "Aceptado";
  if (status === "rejected") return "Rechazado";
  return status;
};

export function Store({ currentUser, progress }: StoreProps) {
  const isAdmin = currentUser.role === "admin";
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [rewards, setRewards] = useState<StoreReward[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [taskRequests, setTaskRequests] = useState<TaskRequest[]>([]);
  const [adminTab, setAdminTab] = useState<AdminTab>("requests");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardDraft, setRewardDraft] = useState<RewardDraft>(emptyRewardDraft);
  const [customRequestOpen, setCustomRequestOpen] = useState(false);
  const [customRequestTitle, setCustomRequestTitle] = useState("");
  const [customRequestNote, setCustomRequestNote] = useState("");
  const [taskRequestBeingResolved, setTaskRequestBeingResolved] = useState<TaskRequest | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({
    title: "",
    description: "",
    points: 60,
    xp: 30,
    priority: "medium"
  });

  useEffect(() => {
    if (isAdmin) void seedStarterStore();

    const unsubscribeCategories = onSnapshot(
      collection(db, "storeCategories"),
      (snapshot) => {
        setCategories(
          snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as Omit<StoreCategory, "id">) }))
            .sort((a, b) => a.order - b.order)
        );
      },
      () => toast.error("No se pudieron cargar las categorías")
    );

    const unsubscribeRewards = onSnapshot(
      collection(db, "storeRewards"),
      (snapshot) => {
        setRewards(
          snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as Omit<StoreReward, "id">) }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      },
      () => toast.error("No se pudieron cargar los premios")
    );

    const rewardReference = isAdmin
      ? collection(db, "rewardRequests")
      : query(collection(db, "rewardRequests"), where("userId", "==", currentUser.id));

    const taskReference = isAdmin
      ? collection(db, "taskRequests")
      : query(collection(db, "taskRequests"), where("userId", "==", currentUser.id));

    const unsubscribeRewardRequests = onSnapshot(
      rewardReference,
      (snapshot) => {
        setRewardRequests(
          snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as Omit<RewardRequest, "id">) }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      },
      () => toast.error("No se pudieron cargar las solicitudes")
    );

    const unsubscribeTaskRequests = onSnapshot(
      taskReference,
      (snapshot) => {
        setTaskRequests(
          snapshot.docs
            .map((item) => ({ id: item.id, ...(item.data() as Omit<TaskRequest, "id">) }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      },
      () => toast.error("No se pudieron cargar los pedidos")
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
          categories.some((category) => category.id === reward.categoryId && category.active)
      ),
    [categories, rewards]
  );

  const pendingRewardRequests = rewardRequests.filter((request) => request.status === "pending");
  const pendingTaskRequests = taskRequests.filter((request) => request.status === "pending");

  const hasPendingRewardRequest = (rewardId: string) =>
    rewardRequests.some((request) => request.rewardId === rewardId && request.status === "pending");

  const hasPendingTaskRequest = (rewardId: string) =>
    taskRequests.some(
      (request) =>
        request.rewardId === rewardId &&
        request.status === "pending" &&
        request.requestType !== "custom"
    );

  const createCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Ya existe una categoría con ese nombre");
      return;
    }

    try {
      await addDoc(collection(db, "storeCategories"), {
        name,
        description: "",
        order: categories.length ? Math.max(...categories.map((category) => category.order)) + 1 : 0,
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
      await updateDoc(doc(db, "storeCategories", editingCategory.id), { name });
      setEditingCategory(null);
      setCategoryName("");
      toast.success("Categoría actualizada");
    } catch {
      toast.error("No se pudo actualizar");
    }
  };

  const removeCategory = async (category: StoreCategory) => {
    if (rewards.some((reward) => reward.categoryId === category.id)) {
      toast.error("Eliminá los premios de esta categoría primero");
      return;
    }
    try {
      await deleteDoc(doc(db, "storeCategories", category.id));
      toast.success("Categoría eliminada");
    } catch {
      toast.error("No se pudo eliminar");
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
      setRewardDraft({ ...emptyRewardDraft, categoryId: activeCategories[0]?.id ?? "" });
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
        await updateDoc(doc(db, "storeRewards", editingRewardId), payload);
      } else {
        await addDoc(collection(db, "storeRewards"), { ...payload, createdAt: new Date().toISOString() });
      }
      setRewardFormOpen(false);
      setEditingRewardId(null);
      setRewardDraft(emptyRewardDraft);
      toast.success("Premio guardado");
    } catch {
      toast.error("No se pudo guardar");
    }
  };

  const requestReward = async (reward: StoreReward) => {
    if (progress.points < reward.cost) return;
    if (hasPendingRewardRequest(reward.id)) {
      toast.error("Ya hay una solicitud pendiente");
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
      toast.error("No se pudo enviar");
    }
  };

  const requestTaskForReward = async (reward: StoreReward) => {
    if (hasPendingTaskRequest(reward.id)) {
      toast.error("Ya pediste una tarea");
      return;
    }

    try {
      await addDoc(collection(db, "taskRequests"), {
        userId: currentUser.id,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsNeeded: Math.max(reward.cost - progress.points, 1),
        pointsAvailable: progress.points,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      toast.success("Pedido enviado");
    } catch {
      toast.error("No se pudo pedir la tarea");
    }
  };

  const requestCustomItem = async () => {
    const title = customRequestTitle.trim();
    if (!title) {
      toast.error("Contame qué querés pedir");
      return;
    }

    const duplicate = taskRequests.some(
      (request) =>
        request.status === "pending" &&
        request.requestType === "custom" &&
        request.rewardName.trim().toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      toast.error("Ya tenés un pedido igual pendiente");
      return;
    }

    try {
      await addDoc(collection(db, "taskRequests"), {
        userId: currentUser.id,
        rewardId: "custom",
        rewardName: title,
        pointsNeeded: 0,
        pointsAvailable: progress.points,
        requestType: "custom",
        customNote: customRequestNote.trim(),
        status: "pending",
        createdAt: new Date().toISOString()
      });
      setCustomRequestTitle("");
      setCustomRequestNote("");
      setCustomRequestOpen(false);
      toast.success("Pedido enviado a Ona");
    } catch {
      toast.error("No se pudo enviar el pedido");
    }
  };

  const approveRewardRequest = async (request: RewardRequest) => {
    const requestReference = doc(db, "rewardRequests", request.id);
    const progressReference = doc(db, "userProgress", request.userId);

    try {
      await runTransaction(db, async (transaction) => {
        const [requestSnapshot, progressSnapshot] = await Promise.all([
          transaction.get(requestReference),
          transaction.get(progressReference)
        ]);
        if (!requestSnapshot.exists()) throw new Error("Solicitud inexistente");
        const data = requestSnapshot.data() as RewardRequest;
        const currentPoints = progressSnapshot.exists() ? Number(progressSnapshot.data().points ?? 0) : 0;
        if (currentPoints < data.cost) throw new Error("Puntos insuficientes");

        transaction.set(progressReference, { points: currentPoints - data.cost }, { merge: true });
        transaction.update(requestReference, { status: "approved", approvedAt: new Date().toISOString() });
      });
      toast.success("Premio aprobado");
    } catch {
      toast.error("No se pudo aprobar");
    }
  };

  const rejectRewardRequest = async (request: RewardRequest) => {
    try {
      await updateDoc(doc(db, "rewardRequests", request.id), {
        status: "rejected",
        rejectedAt: new Date().toISOString()
      });
      toast.success("Solicitud rechazada");
    } catch {
      toast.error("No se pudo rechazar");
    }
  };

  const openTaskRequestForm = (request: TaskRequest) => {
    const isCustom = request.requestType === "custom";
    const points = isCustom ? 60 : Math.max(request.pointsNeeded, 30);
    const priority = getPriorityFromPoints(points) as TaskPriority;
    setTaskRequestBeingResolved(request);
    setTaskDraft({
      title: isCustom ? `Tarea para: ${request.rewardName}` : `Tarea para conseguir ${request.rewardName}`,
      description: isCustom
        ? request.customNote
          ? `Pedido de Marti: ${request.rewardName}. Nota: ${request.customNote}`
          : `Pedido de Marti: ${request.rewardName}.`
        : `Objetivo: sumar puntos para ${request.rewardName}.`,
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
      await updateDoc(doc(db, "taskRequests", taskRequestBeingResolved.id), {
        status: "accepted",
        createdTaskId: createdTask.id,
        resolvedAt: new Date().toISOString()
      });
      setTaskRequestBeingResolved(null);
      toast.success("Tarea creada para Marti");
    } catch {
      toast.error("No se pudo crear la tarea");
    }
  };

  const rejectTaskRequest = async (request: TaskRequest) => {
    try {
      await updateDoc(doc(db, "taskRequests", request.id), {
        status: "rejected",
        resolvedAt: new Date().toISOString()
      });
      toast.success("Pedido rechazado");
    } catch {
      toast.error("No se pudo rechazar");
    }
  };

  const renderUserStore = () => {
    const categoriesToRender = activeCategory === "all"
      ? activeCategories
      : activeCategories.filter((category) => category.id === activeCategory);

    return (
      <>
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-5 py-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/75">Tienda de premios</p>
              <h1 className="text-2xl font-bold">¿Qué querés canjear?</h1>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
              <p className="text-[11px] text-white/75">Disponibles</p>
              <p className="text-lg font-bold">{progress.points} pts</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5">
          <Card className="border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="rounded-2xl bg-violet-100 p-3">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Pedido personalizado</p>
                <h2 className="mt-1 text-lg font-bold text-[#12130F]">¿Querés algo que no está en la tienda?</h2>
                <p className="mt-1 text-sm text-[#386FA4]">Pedilo acá y Ona puede convertirlo en una tarea para que lo consigas.</p>
                <Button className="mt-4 w-full bg-violet-600 text-white hover:bg-violet-700" onClick={() => setCustomRequestOpen(true)}>
                  Pedir algo personalizado
                </Button>
              </div>
            </div>
          </Card>

          <div>
            <p className="mb-2 text-sm font-bold text-[#12130F]">Filtrar premios</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button size="sm" variant={activeCategory === "all" ? "default" : "outline"} onClick={() => setActiveCategory("all")}>
                Todo
              </Button>
              {activeCategories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={activeCategory === category.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {categoriesToRender.map((category) => {
            const categoryRewards = visibleRewards.filter((reward) => reward.categoryId === category.id);
            if (!categoryRewards.length) return null;

            return (
              <section key={category.id}>
                <h2 className="mb-3 text-lg font-bold text-[#12130F]">{category.name}</h2>
                <div className="space-y-3">
                  {categoryRewards.map((reward) => {
                    const hasEnough = progress.points >= reward.cost;
                    const missing = Math.max(reward.cost - progress.points, 0);
                    const rewardPending = hasPendingRewardRequest(reward.id);
                    const taskPending = hasPendingTaskRequest(reward.id);

                    return (
                      <Card key={reward.id} className="border-2 border-[#386FA4]/15 bg-white p-4">
                        <div className="flex gap-3">
                          <div className="text-3xl">{reward.emoji ?? "🎁"}</div>
                          <div className="flex-1">
                            <div className="flex justify-between gap-2">
                              <div>
                                <p className="font-bold">{reward.name}</p>
                                {reward.description && <p className="text-sm text-[#386FA4]">{reward.description}</p>}
                              </div>
                              <Badge className="bg-amber-100 text-amber-700"><Coins className="mr-1 h-3 w-3" />{reward.cost}</Badge>
                            </div>

                            <div className="mt-3">
                              {rewardPending ? (
                                <Button disabled className="w-full">Canje pendiente</Button>
                              ) : hasEnough ? (
                                <Button className="w-full bg-[#386FA4] text-white" onClick={() => void requestReward(reward)}>Solicitar premio</Button>
                              ) : taskPending ? (
                                <Button disabled className="w-full">Pedido de tarea enviado</Button>
                              ) : (
                                <>
                                  <p className="mb-2 text-xs text-red-600">Te faltan {missing} puntos</p>
                                  <Button variant="outline" className="w-full" onClick={() => void requestTaskForReward(reward)}>Pedir una tarea para conseguirlo</Button>
                                </>
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

          <section className="pb-2">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-[#386FA4]" />
              <h2 className="font-bold">Mis solicitudes</h2>
            </div>
            <div className="space-y-2">
              {rewardRequests.length === 0 && taskRequests.length === 0 && (
                <Card className="bg-white p-4 text-sm text-[#386FA4]">Todavía no hiciste solicitudes.</Card>
              )}
              {rewardRequests.map((request) => (
                <Card key={request.id} className="bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div><p className="text-xs font-bold text-amber-600">CANJE</p><p className="font-semibold">{request.rewardName}</p></div>
                    <Badge>{statusLabel(request.status)}</Badge>
                  </div>
                </Card>
              ))}
              {taskRequests.map((request) => (
                <Card key={request.id} className="bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-xs font-bold ${request.requestType === "custom" ? "text-violet-600" : "text-blue-600"}`}>
                        {request.requestType === "custom" ? "PEDIDO PERSONALIZADO" : "PEDIDO DE TAREA"}
                      </p>
                      <p className="font-semibold">{request.rewardName}</p>
                    </div>
                    <Badge>{statusLabel(request.status)}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </>
    );
  };

  const renderAdminStore = () => (
    <>
      <div className="sticky top-0 z-10 bg-[#386FA4] px-5 py-5 text-white shadow-lg">
        <p className="text-xs text-white/80">Modo Adulto</p>
        <h1 className="text-2xl font-bold">Tienda</h1>
        <div className="mt-4 grid grid-cols-4 gap-1">
          {([
            ["requests", "Canjes"],
            ["tasks", "Pedidos"],
            ["rewards", "Premios"],
            ["categories", "Categorías"]
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={`rounded-xl p-2 text-xs font-bold ${adminTab === tab ? "bg-white text-[#386FA4]" : "text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {adminTab === "requests" && (
          <>
            <h2 className="font-bold">Canjes pendientes</h2>
            {!pendingRewardRequests.length && <Card className="bg-white p-4 text-sm text-[#386FA4]">No hay canjes pendientes.</Card>}
            {pendingRewardRequests.map((request) => (
              <Card key={request.id} className="bg-white p-4">
                <p className="font-bold">{request.rewardName}</p>
                <p className="text-sm text-[#386FA4]">{request.cost} puntos</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button onClick={() => void approveRewardRequest(request)}>Aprobar</Button>
                  <Button variant="outline" onClick={() => void rejectRewardRequest(request)}>Rechazar</Button>
                </div>
              </Card>
            ))}
          </>
        )}

        {adminTab === "tasks" && (
          <>
            <h2 className="font-bold">Pedidos de Marti</h2>
            {!pendingTaskRequests.length && <Card className="bg-white p-4 text-sm text-[#386FA4]">No hay pedidos pendientes.</Card>}
            {pendingTaskRequests.map((request) => (
              <Card key={request.id} className={`bg-white p-4 ${request.requestType === "custom" ? "border-2 border-violet-200" : ""}`}>
                {request.requestType === "custom" ? (
                  <>
                    <Badge className="bg-violet-100 text-violet-700">Pedido personalizado</Badge>
                    <p className="mt-2 font-bold">Marti quiere: {request.rewardName}</p>
                    {request.customNote && <p className="mt-2 rounded-xl bg-violet-50 p-3 text-sm">{request.customNote}</p>}
                  </>
                ) : (
                  <>
                    <p className="font-bold">Quiere conseguir: {request.rewardName}</p>
                    <p className="text-sm text-[#386FA4]">Le faltan {request.pointsNeeded} puntos</p>
                  </>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button onClick={() => openTaskRequestForm(request)}>Crear tarea</Button>
                  <Button variant="outline" onClick={() => void rejectTaskRequest(request)}>Rechazar</Button>
                </div>
              </Card>
            ))}
          </>
        )}

        {adminTab === "rewards" && (
          <>
            <Button className="w-full" onClick={() => openRewardForm()}>Nuevo premio</Button>
            {rewards.map((reward) => (
              <Card key={reward.id} className="bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-bold">{reward.emoji} {reward.name}</p><p className="text-sm text-[#386FA4]">{reward.cost} pts</p></div>
                  <Switch checked={reward.active} onCheckedChange={(checked) => void updateDoc(doc(db, "storeRewards", reward.id), { active: checked })} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => openRewardForm(reward)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => void deleteDoc(doc(db, "storeRewards", reward.id))}>Borrar</Button>
                </div>
              </Card>
            ))}
          </>
        )}

        {adminTab === "categories" && (
          <>
            <Card className="bg-white p-4">
              <div className="flex gap-2">
                <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nombre" />
                <Button onClick={() => void (editingCategory ? saveCategoryName() : createCategory())}>Guardar</Button>
              </div>
            </Card>
            {categories.map((category) => (
              <Card key={category.id} className="bg-white p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-bold">{category.name}</p>
                  <Switch checked={category.active} onCheckedChange={(checked) => void updateDoc(doc(db, "storeCategories", category.id), { active: checked })} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => { setEditingCategory(category); setCategoryName(category.name); }}>Renombrar</Button>
                  <Button size="sm" variant="ghost" onClick={() => void removeCategory(category)}>Borrar</Button>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      {isAdmin ? renderAdminStore() : renderUserStore()}

      {customRequestOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-5">
          <Card className="w-full max-w-sm bg-white p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold text-violet-600">PEDIDO PERSONALIZADO</p><h3 className="text-lg font-bold">¿Qué querés?</h3></div>
              <Button size="icon" variant="ghost" onClick={() => setCustomRequestOpen(false)}><X /></Button>
            </div>
            <Input className="mt-4" value={customRequestTitle} onChange={(event) => setCustomRequestTitle(event.target.value)} placeholder="Ej: GTA VI, una camiseta..." />
            <Textarea className="mt-3" value={customRequestNote} onChange={(event) => setCustomRequestNote(event.target.value)} placeholder="Contale a Ona algún detalle (opcional)" />
            <Button className="mt-4 w-full bg-violet-600 text-white" onClick={() => void requestCustomItem()}>Enviar pedido</Button>
          </Card>
        </div>
      )}

      {rewardFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 px-5">
          <Card className="w-full max-w-sm bg-white p-5">
            <h3 className="mb-4 font-bold">{editingRewardId ? "Editar premio" : "Nuevo premio"}</h3>
            <Input value={rewardDraft.emoji} onChange={(event) => setRewardDraft((previous) => ({ ...previous, emoji: event.target.value }))} placeholder="🎁" />
            <Input className="mt-2" value={rewardDraft.name} onChange={(event) => setRewardDraft((previous) => ({ ...previous, name: event.target.value }))} placeholder="Premio" />
            <Textarea className="mt-2" value={rewardDraft.description} onChange={(event) => setRewardDraft((previous) => ({ ...previous, description: event.target.value }))} placeholder="Descripción" />
            <select className="mt-2 h-10 w-full rounded-md border px-3" value={rewardDraft.categoryId} onChange={(event) => setRewardDraft((previous) => ({ ...previous, categoryId: event.target.value }))}>
              <option value="">Categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <Input className="mt-2" type="number" value={rewardDraft.cost} onChange={(event) => setRewardDraft((previous) => ({ ...previous, cost: Number(event.target.value) }))} />
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRewardFormOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => void saveReward()}>Guardar</Button>
            </div>
          </Card>
        </div>
      )}

      {taskRequestBeingResolved && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-5">
          <Card className="w-full max-w-sm bg-white p-5">
            <h3 className="font-bold">Crear tarea para {taskRequestBeingResolved.rewardName}</h3>
            <Input className="mt-4" value={taskDraft.title} onChange={(event) => setTaskDraft((previous) => ({ ...previous, title: event.target.value }))} />
            <Textarea className="mt-2" value={taskDraft.description} onChange={(event) => setTaskDraft((previous) => ({ ...previous, description: event.target.value }))} />
            <div className="mt-3 grid grid-cols-5 gap-1">
              {(Object.keys(TASK_PRIORITY_CONFIG) as TaskPriority[]).map((priority) => {
                const config = TASK_PRIORITY_CONFIG[priority];
                return (
                  <button key={priority} className={`rounded-xl border p-2 text-[10px] font-bold ${config.buttonClass}`} onClick={() => setTaskDraft((previous) => ({ ...previous, priority, points: config.points, xp: config.xp }))}>
                    {config.shortLabel}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Input type="number" value={taskDraft.points} onChange={(event) => { const points = Number(event.target.value); setTaskDraft((previous) => ({ ...previous, points, priority: getPriorityFromPoints(points) as TaskPriority })); }} />
              <Input type="number" value={taskDraft.xp} onChange={(event) => setTaskDraft((previous) => ({ ...previous, xp: Number(event.target.value) }))} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setTaskRequestBeingResolved(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => void saveTaskFromRequest()}>Crear tarea</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
