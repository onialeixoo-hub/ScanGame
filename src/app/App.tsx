import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { BottomNav } from "./components/BottomNav";
import { Collection } from "./components/Collection";
import { Home } from "./components/Home";
import { LoginScreen } from "./components/LoginScreen";
import { ScanResult } from "./components/ScanResult";
import { Scanner } from "./components/Scanner";
import { Tasks } from "./components/Tasks";
import type { Task, TaskClaim, User, UserProgress } from "./types";

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
  bonusAwardedOn: ""
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const [progressByUser, setProgressByUser] = useState<Record<string, UserProgress>>({
    "user-1": initialProgress
  });
  const [activeTab, setActiveTab] = useState<"home" | "collection" | "tasks">(
    "home"
  );
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{
    name: string;
    category: string;
    barcode: string;
    points: number;
    xp: number;
    rarity: "común" | "raro" | "épico" | "legendario";
  } | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(true);

  const todayKey = useMemo(() => new Date().toDateString(), []);

  const handleScan = (barcode: string) => {
    setShowScanner(false);
    setTimeout(() => {
      setScannedProduct({
        name: "Producto Misterioso",
        category: "Snacks",
        barcode,
        points: 50,
        xp: 25,
        rarity: "raro"
      });
      setIsNewProduct(Math.random() > 0.5);
    }, 500);
  };

  const handleAddToCollection = () => {
    setScannedProduct(null);
    setActiveTab("collection");
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

  const activeProgress = currentUser
    ? progressByUser[currentUser.id] ?? initialProgress
    : initialProgress;

  const currentUserClaims = currentUser
    ? claims.filter((claim) => claim.userId === currentUser.id)
    : [];

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
      <div className="pb-20 max-w-md mx-auto bg-[#E2DADB] min-h-screen relative shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {showScanner ? (
            <Scanner
              key="scanner"
              onScanComplete={handleScan}
              onClose={() => setShowScanner(false)}
            />
          ) : scannedProduct ? (
            <ScanResult
              key="result"
              product={scannedProduct}
              isNewProduct={isNewProduct}
              onAddToCollection={handleAddToCollection}
              onGoHome={handleGoHome}
            />
          ) : activeTab === "home" ? (
            <Home
              userLevel={Math.floor(activeProgress.xp / 1000) + 1}
              currentXP={activeProgress.xp}
              xpToNextLevel={Math.ceil((activeProgress.xp + 1) / 1000) * 1000}
              totalPoints={activeProgress.points}
              dailyStreak={activeProgress.streak}
              username={currentUser.name}
              avatar={currentUser.avatar}
              activeTasks={homeTasks.filter((task) => !task.completed).length}
              totalProducts={12}
              categoriesCount={4}
              completedTasksToday={approvedTodayCount}
              tasks={homeTasks}
              onScanClick={() => setShowScanner(true)}
              onCollectionClick={() => setActiveTab("collection")}
              onTasksClick={() => setActiveTab("tasks")}
              onCompleteTask={() => setActiveTab("tasks")}
            />
          ) : activeTab === "collection" ? (
            <Collection />
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

        {!showScanner && !scannedProduct && (
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
