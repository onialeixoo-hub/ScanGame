import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { BottomNav } from "./components/BottomNav";
import { Collection } from "./components/Collection";
import { Home } from "./components/Home";
import { LoginScreen } from "./components/LoginScreen";
import { ProductDetail } from "./components/ProductDetail";
import { ScanResult } from "./components/ScanResult";
import { Scanner } from "./components/Scanner";
import { Tasks } from "./components/Tasks";
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

const DAILY_GOAL = 3;
const BONUS_POINTS = 50;

const users: User[] = [
  {
    id: "user-1",
    name: "Marti",
    username: "martialeixo",
    pin: "1508",
    role: "user",
    avatar: "🦸"
  },
  {
    id: "admin-1",
    name: "Onia",
    username: "onialeixo",
    pin: "2601",
    role: "admin",
    avatar: "🛡️"
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
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
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collectionByUser));
  }, [collectionByUser]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressByUser));
  }, [progressByUser]);

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
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`
    );
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
        : null,
      scannedProduct.xpReward === 0
        ? "Sin recompensa por escaneo repetido hoy."
        : null
    ].filter(Boolean) as string[];

    toast("Recompensas del escaneo", {
      description: (
        <div className="space-y-1">
          {rewardLines.map((line) => (
            <p key={line} className="text-sm text-slate-700">
              {line}
            </p>
          ))}
        </div>
      )
    });

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

  const handleCreateClaim = (taskId: string, note: string) => {
    if (!currentUser) return;

    const newClaim: TaskClaim = {
      id: `claim-${Date.now()}`,
      taskId,
      userId: currentUser.id,
      status: "pending",
      timestamp: new Date().toISOString(),
      note: note.trim() ? note.trim() : undefined
    };

    setClaims((prev) => [newClaim, ...prev]);
  };

  const handleApproveClaim = (claimId: string) => {
    if (!currentUser) return;
    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId
          ? {
              ...claim,
              status: "approved",
              approvedBy: currentUser.id,
              approvedAt: new Date().toISOString()
            }
          : claim
      )
    );

    const approvedClaim = claims.find((claim) => claim.id === claimId);
    if (!approvedClaim) return;

    const task = tasks.find((item) => item.id === approvedClaim.taskId);
    if (!task) return;

    setProgressByUser((prev) => {
      const currentProgress = prev[approvedClaim.userId] ?? initialProgress;
      const nextXP = currentProgress.xp + task.xp;
      const nextPoints = currentProgress.points + task.points;

      const approvedTodayCount = claims.filter(
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
          bonusAwardedOn: shouldApplyBonus ? todayKey : currentProgress.bonusAwardedOn
        }
      };
    });
  };

  const handleRejectClaim = (claimId: string, note: string) => {
    if (!currentUser) return;
    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId
          ? {
              ...claim,
              status: "rejected",
              rejectionNote: note.trim() ? note.trim() : undefined
            }
          : claim
      )
    );
  };

  const handleCreateTask = (task: Omit<Task, "id">) => {
    setTasks((prev) => [
      ...prev,
      {
        ...task,
        id: `task-${Date.now()}`
      }
    ]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleResetProgress = () => {
    setClaims([]);
    setProgressByUser((prev) => ({
      ...prev,
      "user-1": initialProgress
    }));
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
        <div className="pb-20 max-w-md mx-auto bg-[#E2DADB] min-h-screen relative shadow-2xl overflow-hidden">
          <Tasks
            currentUser={currentUser}
            users={users}
            tasks={tasks}
            claims={claims}
            progress={activeProgress}
            dailyGoal={DAILY_GOAL}
            bonusPoints={BONUS_POINTS}
            onLogout={() => setCurrentUser(null)}
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
      <Toaster position="top-center" richColors closeButton />
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
              dailyGoal={DAILY_GOAL}
              bonusPoints={BONUS_POINTS}
              onLogout={() => setCurrentUser(null)}
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
