import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Toaster, toast } from "sonner";
import { BottomNav } from "./components/BottomNav";
import { Collection } from "./components/Collection";
import { Home } from "./components/Home";
import { LoginScreen } from "./components/LoginScreen";
import { ProductDetail } from "./components/ProductDetail";
import { ScanResult } from "./components/ScanResult";
import { Scanner } from "./components/Scanner";
import { Tasks } from "./components/Tasks";
import { Button } from "./components/ui/button";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import type {
  AppCategory,
  CollectedProduct,
  ProductRarity,
  Task,
  TaskClaim,
  User,
  UserProgress
} from "./types";
import { normalizeCategory, rarityBaseXp, rarityFromBarcode, streakBonusByDays } from "./lib/products";
import avatarHoodie from "@/assets/avatars/avatar-hoodie.svg";
import avatarHeadset from "@/assets/avatars/avatar-headset.svg";
import avatarCap from "@/assets/avatars/avatar-cap.svg";
import avatarPlay from "@/assets/avatars/avatar-play.svg";
import avatarPepsi from "@/assets/avatars/avatar-pepsi.svg";
import avatarCamera from "@/assets/avatars/avatar-camera.svg";
import avatarGlasses from "@/assets/avatars/avatar-glasses.svg";

const DAILY_GOAL = 3;
const BONUS_POINTS = 50;

const initialUsers: User[] = [
  {
    id: "user-1",
    name: "Marti",
    username: "martialeixo",
    pin: "",
    role: "user",
    avatar: avatarHoodie
  },
  {
    id: "admin-1",
    name: "Onia",
    username: "onialeixo",
    pin: "",
    role: "admin",
    avatar: avatarHeadset
  }
];

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Hacer la cama",
    description: "Dejar la habitación prolija",
    points: 100,
    xp: 50,
    frequency: "daily",
    active: true
  },
  {
    id: "task-2",
    title: "Lavar los platos",
    description: "Después de comer",
    points: 80,
    xp: 40,
    frequency: "daily",
    active: true
  },
  {
    id: "task-3",
    title: "Leer 30 minutos",
    description: "Libro o cómic",
    points: 60,
    xp: 30,
    frequency: "daily",
    active: true
  },
  {
    id: "task-4",
    title: "Hacer la tarea",
    description: "Trabajo escolar",
    points: 120,
    xp: 60,
    frequency: "daily",
    active: true
  }
];

const initialProgress: UserProgress = {
  xp: 1250,
  points: 320,
  streak: 4,
  bonusAwardedOn: "",
  scanStreak: 0,
  lastScanDate: ""
};

const COLLECTION_STORAGE_KEY = "scanGame.collection";
const PROGRESS_STORAGE_KEY = "scanGame.progress";
const TASKS_STORAGE_KEY = "scanGame.tasks";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const tasksSeededRef = useRef(false);
  const [progressByUser, setProgressByUser] = useState<Record<string, UserProgress>>(
    () => {
      if (typeof window === "undefined") {
        return { "user-1": initialProgress };
      }
      try {
        const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
        return stored
          ? (JSON.parse(stored) as Record<string, UserProgress>)
          : { "user-1": initialProgress };
      } catch (error) {
        return { "user-1": initialProgress };
      }
    }
  );
  const [collectionByUser, setCollectionByUser] = useState<
    Record<string, CollectedProduct[]>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(COLLECTION_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Record<string, CollectedProduct[]>) : {};
    } catch (error) {
      return {};
    }
  });
  const [activeTab, setActiveTab] = useState<"home" | "collection" | "tasks">("home");
  const [showScanner, setShowScanner] = useState(false);
  const [scanPopup, setScanPopup] = useState<{
    title: string;
    message: string;
    details: string[];
    ctaLabel: string;
  } | null>(null);
  const [scannedProduct, setScannedProduct] = useState<{
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    offCategoriesRaw?: string;
    appCategory: AppCategory;
    rarity: ProductRarity;
    isNew: boolean;
    isDuplicateToday: boolean;
    xpBase: number;
    xpReward: number;
    bonusDaily: number;
    bonusStreak: number;
    ingredients?: string;
    allergens?: string;
  } | null>(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CollectedProduct | null>(null);

  const todayKey = useMemo(() => new Date().toDateString(), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(
          doc(db, "users", firebaseUser.uid)
        );

        if (!profileSnapshot.exists()) {
          await signOut(auth);
          setCurrentUser(null);
          return;
        }

        const profile = profileSnapshot.data() as {
          name?: string;
          email?: string;
          role?: "admin" | "user";
        };

        if (profile.role !== "admin" && profile.role !== "user") {
          await signOut(auth);
          setCurrentUser(null);
          return;
        }

        const restoredUser: User = {
          id: firebaseUser.uid,
          name: profile.name ?? "Usuario",
          username: firebaseUser.email ?? profile.email ?? "",
          pin: "",
          role: profile.role,
          avatar: profile.role === "admin" ? avatarHeadset : avatarHoodie
        };

        setCurrentUser(restoredUser);
        setUsers((previousUsers) => {
          const remainingUsers = previousUsers.filter(
            (user) => user.id !== restoredUser.id
          );

          return [...remainingUsers, restoredUser];
        });
      } catch {
        await signOut(auth).catch(() => undefined);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collectionByUser));
  }, [collectionByUser]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressByUser));
  }, [progressByUser]);

  useEffect(() => {
    if (authLoading) {
    return (
      <div className="min-h-screen bg-[#E2DADB] flex items-center justify-center">
        <p className="text-[#386FA4] font-semibold">Cargando ScanGame...</p>
      </div>
    );
  }

  if (!currentUser) {
      setTasks([]);
      setClaims([]);
      tasksSeededRef.current = false;
      return;
    }

    tasksSeededRef.current = false;

    const usersCollection = collection(db, "users");
    const tasksCollection = collection(db, "tasks");
    const claimsCollection = collection(db, "taskClaims");

    const unsubscribeUsers = onSnapshot(
      usersCollection,
      (snapshot) => {
        const remoteUsers: User[] = [];

        snapshot.docs.forEach((userDocument) => {
          const profile = userDocument.data() as {
            name?: string;
            email?: string;
            role?: "admin" | "user";
          };

          if (profile.role !== "admin" && profile.role !== "user") return;

          remoteUsers.push({
            id: userDocument.id,
            name: profile.name ?? "Usuario",
            username: profile.email ?? "",
            pin: "",
            role: profile.role,
            avatar: profile.role === "admin" ? avatarHeadset : avatarHoodie
          });
        });

        setUsers(remoteUsers);
      },
      () => {
        toast.error("No se pudieron cargar los usuarios");
      }
    );

    const unsubscribeTasks = onSnapshot(
      tasksCollection,
      (snapshot) => {
        const remoteTasks = snapshot.docs.map((taskDocument) => ({
          id: taskDocument.id,
          ...(taskDocument.data() as Omit<Task, "id">)
        }));

        setTasks(remoteTasks);

        if (
          snapshot.empty &&
          currentUser.role === "admin" &&
          !tasksSeededRef.current
        ) {
          tasksSeededRef.current = true;

          let tasksToMigrate = initialTasks;

          try {
            const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
            const parsedTasks = storedTasks ? JSON.parse(storedTasks) : null;

            if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
              tasksToMigrate = parsedTasks as Task[];
            }
          } catch {
            tasksToMigrate = initialTasks;
          }

          void Promise.all(
            tasksToMigrate.map(async ({ id, ...taskData }) => {
              await setDoc(doc(db, "tasks", id), taskData);
            })
          ).catch(() => {
            toast.error("No se pudieron migrar las tareas a Firebase");
          });
        }
      },
      () => {
        toast.error("No se pudieron cargar las tareas");
      }
    );

    const visibleClaims =
      currentUser.role === "admin"
        ? claimsCollection
        : query(
            claimsCollection,
            where("userId", "==", currentUser.id)
          );

    const unsubscribeClaims = onSnapshot(
      visibleClaims,
      (snapshot) => {
        const remoteClaims = snapshot.docs.map((claimDocument) => ({
          id: claimDocument.id,
          ...(claimDocument.data() as Omit<TaskClaim, "id">)
        }));

        setClaims(remoteClaims);
      },
      () => {
        toast.error("No se pudieron cargar las solicitudes");
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeClaims();
    };
  }, [currentUser]);

  const isSameDay = (dateValue: string | undefined) => {
    if (!dateValue) return false;
    return new Date(dateValue).toDateString() === todayKey;
  };

  const getNextScanStreak = (currentProgress: UserProgress) => {
    if (!currentProgress.lastScanDate) return 1;
    const lastDate = new Date(currentProgress.lastScanDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate.toDateString() === todayKey) return currentProgress.scanStreak ?? 0;
    if (lastDate.toDateString() === yesterday.toDateString()) {
      return (currentProgress.scanStreak ?? 0) + 1;
    }
    return 1;
  };

  const fetchOpenFoodFactsProduct = async (barcode: string) => {
    const fields = [
      "product_name_es",
      "product_name",
      "brands",
      "categories",
      "categories_tags",
      "image_url",
      "ingredients_text_es",
      "ingredients_text",
      "allergens"
    ].join(",");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`,
      { signal: controller.signal }
    ).finally(() => window.clearTimeout(timeoutId));
    const data = await response.json();
    return data?.product ?? null;
  };

  const handleScan = async (barcode: string) => {
    setShowScanner(false);
    setIsFetchingProduct(true);
    const productFromOff = await fetchOpenFoodFactsProduct(barcode).catch(() => null);

    const name =
      productFromOff?.product_name_es ||
      productFromOff?.product_name ||
      `Producto sin nombre (barcode ${barcode})`;
    const brand = productFromOff?.brands?.split(",")[0]?.trim();
    const offCategoriesRaw = productFromOff?.categories;
    const categoriesTags = productFromOff?.categories_tags;
    const appCategory = normalizeCategory(categoriesTags, offCategoriesRaw);
    const rarity = rarityFromBarcode(barcode);

    const currentProgress = progressByUser[currentUser?.id ?? "user-1"] ?? initialProgress;
    const userCollection = collectionByUser[currentUser?.id ?? "user-1"] ?? [];
    const existingProduct = userCollection.find((item) => item.barcode === barcode);
    const duplicateToday = existingProduct ? isSameDay(existingProduct.lastScannedAt) : false;
    const isNew = !existingProduct;

    const xpBase = rarityBaseXp[rarity];
    const multiplier = isNew ? 1 : 0.15;
    const baseReward = Math.round(xpBase * multiplier);
    const isFirstScanToday = !isSameDay(currentProgress.lastScanDate);
    const nextScanStreak = getNextScanStreak(currentProgress);
    const bonusDaily = isFirstScanToday ? 40 : 0;
    const bonusStreak = isFirstScanToday ? streakBonusByDays(nextScanStreak) : 0;
    const xpReward = duplicateToday ? 0 : baseReward + bonusDaily + bonusStreak;

    if (duplicateToday) {
      setScanPopup({
        title: "Ya escaneaste este producto hoy",
        message: "Volvé mañana para ganar puntos extra.",
        details: ["Escaneo repetido en el día: 0 XP"],
        ctaLabel: "Entendido"
      });
    }

    setScannedProduct({
      barcode,
      name,
      brand,
      imageUrl: productFromOff?.image_url,
      offCategoriesRaw,
      appCategory,
      rarity,
      isNew,
      isDuplicateToday: duplicateToday,
      xpBase,
      xpReward,
      bonusDaily,
      bonusStreak,
      ingredients: productFromOff?.ingredients_text_es || productFromOff?.ingredients_text,
      allergens: productFromOff?.allergens
    });
    const rewardLines = [
      baseReward > 0 ? `Base: +${baseReward} XP` : null,
      bonusDaily > 0 ? `Bonus primer producto del día: +${bonusDaily} XP` : null,
      bonusStreak > 0 ? `Bonus racha: +${bonusStreak} XP` : null
    ].filter(Boolean) as string[];

    if (xpReward === 0) {
      setScanPopup({
        title: "Ya escaneaste este producto hoy",
        message: "Volvé mañana para ganar puntos extra.",
        details: ["Escaneo repetido en el día: 0 XP"],
        ctaLabel: "Entendido"
      });
    } else {
      setScanPopup({
        title: "¡Felicitaciones!",
        message: `Ganaste ${xpReward} XP por el escaneo.`,
        details: rewardLines,
        ctaLabel: "Seguir jugando"
      });
    }
    setIsFetchingProduct(false);
  };

  const handleAddToCollection = () => {
    if (!currentUser || !scannedProduct) return;

    const userCollection = collectionByUser[currentUser.id] ?? [];
    const existingProduct = userCollection.find(
      (item) => item.barcode === scannedProduct.barcode
    );
    if (existingProduct && isSameDay(existingProduct.lastScannedAt)) {
      return;
    }

    const now = new Date().toISOString();
    const updatedProduct: CollectedProduct = existingProduct
      ? {
          ...existingProduct,
          name: scannedProduct.name,
          brand: scannedProduct.brand,
          imageUrl: scannedProduct.imageUrl,
          offCategoriesRaw: scannedProduct.offCategoriesRaw,
          appCategory: scannedProduct.appCategory,
          rarity: scannedProduct.rarity,
          lastScannedAt: now,
          scanCount: existingProduct.scanCount + 1,
          ingredients: scannedProduct.ingredients,
          allergens: scannedProduct.allergens
        }
      : {
          barcode: scannedProduct.barcode,
          name: scannedProduct.name,
          brand: scannedProduct.brand,
          imageUrl: scannedProduct.imageUrl,
          offCategoriesRaw: scannedProduct.offCategoriesRaw,
          appCategory: scannedProduct.appCategory,
          rarity: scannedProduct.rarity,
          dateFirstScanned: now,
          lastScannedAt: now,
          scanCount: 1,
          ingredients: scannedProduct.ingredients,
          allergens: scannedProduct.allergens
        };

    const nextCollection = existingProduct
      ? userCollection.map((item) =>
          item.barcode === updatedProduct.barcode ? updatedProduct : item
        )
      : [updatedProduct, ...userCollection];

    setCollectionByUser((prev) => ({
      ...prev,
      [currentUser.id]: nextCollection
    }));

    setProgressByUser((prev) => {
      const currentProgress = prev[currentUser.id] ?? initialProgress;
      const nextStreak = getNextScanStreak(currentProgress);
      const isFirstScanToday = !isSameDay(currentProgress.lastScanDate);

      return {
        ...prev,
        [currentUser.id]: {
          ...currentProgress,
          xp: currentProgress.xp + scannedProduct.xpReward,
          scanStreak: isFirstScanToday ? nextStreak : currentProgress.scanStreak,
          lastScanDate: isFirstScanToday ? now : currentProgress.lastScanDate
        }
      };
    });

    const baseReward = Math.max(
      scannedProduct.xpReward - scannedProduct.bonusDaily - scannedProduct.bonusStreak,
      0
    );
    const rewardLines = [
      baseReward > 0 ? `Base: +${baseReward} XP` : null,
      scannedProduct.bonusDaily > 0
        ? `Bonus primer producto del día: +${scannedProduct.bonusDaily} XP`
        : null,
      scannedProduct.bonusStreak > 0
        ? `Bonus racha: +${scannedProduct.bonusStreak} XP`
        : null
    ].filter(Boolean) as string[];

    if (scannedProduct.xpReward === 0) {
      setScanPopup({
        title: "Ya escaneaste este producto hoy",
        message: "Volvé mañana para ganar puntos extra.",
        details: ["Escaneo repetido en el día: 0 XP"],
        ctaLabel: "Entendido"
      });
    } else {
      setScanPopup({
        title: "¡Felicitaciones!",
        message: `Ganaste ${scannedProduct.xpReward} XP por el escaneo.`,
        details: rewardLines,
        ctaLabel: "Seguir jugando"
      });
    }

    setScannedProduct(null);
    setActiveTab("collection");
  };

  const handleRescan = () => {
    setScannedProduct(null);
    setShowScanner(true);
  };

  const handleGoHome = () => {
    setScannedProduct(null);
    setActiveTab("home");
  };

  const handleCreateClaim = async (taskId: string, note: string) => {
    if (!currentUser) return;

    const trimmedNote = note.trim();

    try {
      await addDoc(collection(db, "taskClaims"), {
        taskId,
        userId: currentUser.id,
        status: "pending",
        timestamp: new Date().toISOString(),
        ...(trimmedNote ? { note: trimmedNote } : {})
      });
    } catch {
      toast.error("No se pudo enviar la tarea para aprobación");
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    if (!currentUser) return;

    const approvedClaim = claims.find((claim) => claim.id === claimId);
    if (!approvedClaim) return;

    const task = tasks.find((item) => item.id === approvedClaim.taskId);
    if (!task) return;

    const approvedAt = new Date().toISOString();

    try {
      await updateDoc(doc(db, "taskClaims", claimId), {
        status: "approved",
        approvedBy: currentUser.id,
        approvedAt
      });
    } catch {
      toast.error("No se pudo aprobar la tarea");
      return;
    }

    setProgressByUser((prev) => {
      const currentProgress = prev[approvedClaim.userId] ?? initialProgress;
      const nextXP = currentProgress.xp + task.xp;
      const nextPoints = currentProgress.points + task.points;

      const approvedTodayCount =
        claims.filter(
          (claim) =>
            claim.userId === approvedClaim.userId &&
            claim.status === "approved" &&
            claim.approvedAt &&
            new Date(claim.approvedAt).toDateString() === todayKey
        ).length + 1;

      const shouldApplyBonus =
        approvedTodayCount >= DAILY_GOAL &&
        currentProgress.bonusAwardedOn !== todayKey;

      return {
        ...prev,
        [approvedClaim.userId]: {
          ...currentProgress,
          xp: nextXP + (shouldApplyBonus ? BONUS_POINTS : 0),
          points: nextPoints + (shouldApplyBonus ? BONUS_POINTS : 0),
          bonusAwardedOn: shouldApplyBonus
            ? todayKey
            : currentProgress.bonusAwardedOn
        }
      };
    });
  };

  const handleRejectClaim = async (claimId: string, note: string) => {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, "taskClaims", claimId), {
        status: "rejected",
        rejectionNote: note.trim()
      });
    } catch {
      toast.error("No se pudo rechazar la tarea");
    }
  };

  const handleCreateTask = async (task: Omit<Task, "id">) => {
    try {
      await addDoc(collection(db, "tasks"), task);
    } catch {
      toast.error("No se pudo crear la tarea");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<Task>
  ) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), updates);
    } catch {
      toast.error("No se pudo actualizar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch {
      toast.error("No se pudo eliminar la tarea");
    }
  };

  const handleResetProgress = async () => {
    try {
      await Promise.all(
        claims.map((claim) =>
          deleteDoc(doc(db, "taskClaims", claim.id))
        )
      );

      const affectedUserIds = [
        ...new Set(claims.map((claim) => claim.userId))
      ];

      setProgressByUser((prev) => {
        const nextProgress = { ...prev };

        affectedUserIds.forEach((userId) => {
          nextProgress[userId] = { ...initialProgress };
        });

        return nextProgress;
      });
    } catch {
      toast.error("No se pudo resetear el progreso");
    }
  };

  const handleUpdateProfileName = (name: string) => {
    if (!currentUser) return;
    setCurrentUser((prev) => (prev ? { ...prev, name } : prev));
    setUsers((prev) =>
      prev.map((user) => (user.id === currentUser.id ? { ...user, name } : user))
    );
  };

  const handleUpdateAvatar = (avatar: string) => {
    if (!currentUser) return;
    setCurrentUser((prev) => (prev ? { ...prev, avatar } : prev));
    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id ? { ...user, avatar } : user
      )
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      toast.error("No se pudo cerrar la sesión");
    } finally {
      setCurrentUser(null);
      setActiveTab("home");
      setShowScanner(false);
      setScannedProduct(null);
      setSelectedProduct(null);
    }
  };

  const getLevelInfo = (xp: number) => {
    let level = 1;
    let threshold = 1000;
    let totalRequired = 0;

    while (xp >= totalRequired + threshold) {
      totalRequired += threshold;
      level += 1;
      threshold += 200;
    }

    return {
      level,
      nextLevelXpTotal: totalRequired + threshold
    };
  };

  const activeProgress = currentUser
    ? progressByUser[currentUser.id] ?? initialProgress
    : initialProgress;

  const currentUserClaims = currentUser
    ? claims.filter((claim) => claim.userId === currentUser.id)
    : [];

  const userCollection = currentUser ? collectionByUser[currentUser.id] ?? [] : [];

  const approvedTodayCount = currentUserClaims.filter(
    (claim) =>
      claim.status === "approved" &&
      claim.approvedAt &&
      new Date(claim.approvedAt).toDateString() === todayKey
  ).length;

  const homeTasks = tasks.map((task) => {
    const latestClaim = currentUserClaims
      .filter((claim) => claim.taskId === task.id)
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    const isCompleted = latestClaim?.status === "approved";

    return {
      id: task.id,
      title: task.title,
      xpReward: task.xp,
      pointsReward: task.points,
      completed: isCompleted
    };
  });

  const levelInfo = getLevelInfo(activeProgress.xp);

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={setCurrentUser} />;
  }

  if (currentUser.role === "admin") {
    return (
      <div className="bg-[#E2DADB] min-h-screen font-sans text-[#12130F]">
        <Toaster position="top-center" richColors />
        <div className="pb-20 max-w-md mx-auto bg-[#E2DADB] min-h-screen relative shadow-2xl overflow-hidden">
          <Tasks
            currentUser={currentUser}
            users={users}
            tasks={tasks}
            claims={claims}
            progress={activeProgress}
            productsCount={userCollection.length}
            categoriesCount={
              new Set(userCollection.map((product) => product.appCategory)).size
            }
            dailyGoal={DAILY_GOAL}
            bonusPoints={BONUS_POINTS}
            onCreateClaim={handleCreateClaim}
            onApproveClaim={handleApproveClaim}
            onRejectClaim={handleRejectClaim}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onResetProgress={handleResetProgress}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#E2DADB] min-h-screen font-sans text-[#12130F]">
      <Toaster position="top-center" richColors />
      {scanPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="rounded-t-3xl bg-gradient-to-br from-indigo-500 to-blue-500 px-6 py-8 text-center text-white">
              <p className="text-2xl font-semibold">{scanPopup.title}</p>
              <p className="mt-2 text-sm text-white/90">{scanPopup.message}</p>
            </div>
            <div className="px-6 py-5 text-left">
              <ul className="space-y-2 text-sm text-slate-600">
                {scanPopup.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    {detail}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setScanPopup(null)}
                className="mt-6 w-full bg-indigo-500 text-white hover:bg-indigo-600"
              >
                {scanPopup.ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="pb-20 max-w-md mx-auto bg-[#E2DADB] min-h-screen relative shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {showScanner ? (
            <Scanner
              key="scanner"
              onScanComplete={handleScan}
              onClose={() => setShowScanner(false)}
            />
          ) : isFetchingProduct ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-[#386FA4]">Buscando producto...</p>
                <p className="text-sm text-[#386FA4]/70">Conectando con OpenFoodFacts</p>
              </div>
            </div>
          ) : selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
            />
          ) : scannedProduct ? (
            <ScanResult
              key="result"
              product={scannedProduct}
              onAddToCollection={handleAddToCollection}
              onRescan={handleRescan}
              onGoHome={handleGoHome}
            />
          ) : activeTab === "home" ? (
            <Home
              userLevel={levelInfo.level}
              currentXP={activeProgress.xp}
              xpToNextLevel={levelInfo.nextLevelXpTotal}
              totalPoints={activeProgress.points}
              dailyStreak={activeProgress.streak}
              username={currentUser.name}
              avatar={currentUser.avatar}
              activeTasks={homeTasks.filter((task) => !task.completed).length}
              totalProducts={userCollection.length}
              categoriesCount={
                new Set(userCollection.map((product) => product.appCategory)).size
              }
              completedTasksToday={approvedTodayCount}
              tasks={homeTasks}
              onScanClick={() => setShowScanner(true)}
              onCollectionClick={() => setActiveTab("collection")}
              onTasksClick={() => setActiveTab("tasks")}
              onCompleteTask={() => setActiveTab("tasks")}
              onLogout={() => void handleLogout()}
              onUpdateProfileName={handleUpdateProfileName}
              onUpdateAvatar={handleUpdateAvatar}
            />
          ) : activeTab === "collection" ? (
            <Collection
              products={userCollection}
              onProductClick={(product) => setSelectedProduct(product)}
            />
          ) : activeTab === "tasks" ? (
            <Tasks
              currentUser={currentUser}
              users={users}
              tasks={tasks}
              claims={claims}
              progress={activeProgress}
              productsCount={userCollection.length}
              categoriesCount={
                new Set(userCollection.map((product) => product.appCategory)).size
              }
              dailyGoal={DAILY_GOAL}
              bonusPoints={BONUS_POINTS}
              onCreateClaim={handleCreateClaim}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onResetProgress={handleResetProgress}
            />
          ) : null}
        </AnimatePresence>

        {!showScanner && !scannedProduct && !selectedProduct && !isFetchingProduct && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeTasks={homeTasks.filter((task) => !task.completed).length}
          />
        )}
      </div>
    </div>
  );
}
