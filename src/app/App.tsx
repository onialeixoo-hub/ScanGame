import { useState, useEffect } from "react";
import { CreateUser } from "@/app/components/CreateUser";
import { Home } from "@/app/components/Home";
import { Scanner } from "@/app/components/Scanner";
import { ScanResult } from "@/app/components/ScanResult";
import { Collection } from "@/app/components/Collection";
import { ProductDetail } from "@/app/components/ProductDetail";
import { Tasks } from "@/app/components/Tasks";
import { BottomNav } from "@/app/components/BottomNav";

type Screen = "createUser" | "home" | "scanner" | "result" | "collection" | "detail" | "tasks";
type Tab = "home" | "collection" | "tasks";

interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  rarity: "común" | "raro" | "épico" | "legendario";
  dateScanned: string;
  scanCount: number;
}

interface Task {
  id: string;
  title: string;
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  completedDate?: string;
}

interface UserData {
  username: string;
  avatar: string;
  level: number;
  currentXP: number;
  totalPoints: number;
  dailyStreak: number;
  products: Product[];
  tasks: Task[];
}

// Mock product names and categories
const mockProductNames = [
  { name: "Leche Entera La Serenísima", category: "Alimentos" },
  { name: "Coca Cola 1.5L", category: "Bebidas" },
  { name: "Shampoo Head & Shoulders", category: "Higiene" },
  { name: "Galletitas Oreo", category: "Alimentos" },
  { name: "Detergente Skip", category: "Limpieza" },
  { name: "Aceite Cocinero", category: "Alimentos" },
  { name: "Agua Mineral Villavicencio", category: "Bebidas" },
  { name: "Pasta de Dientes Colgate", category: "Higiene" },
  { name: "Arroz Gallo Oro", category: "Alimentos" },
  { name: "Jugo Tang Naranja", category: "Bebidas" },
  { name: "Papel Higiénico Elite", category: "Higiene" },
  { name: "Lavandina Ayudín", category: "Limpieza" },
  { name: "Café Nescafé", category: "Alimentos" },
  { name: "Yerba Mate Taragüi", category: "Alimentos" },
  { name: "Jabón Dove", category: "Higiene" }
];

const rarityLevels: Array<"común" | "raro" | "épico" | "legendario"> = ["común", "raro", "épico", "legendario"];

function getRandomProduct(barcode: string): Product {
  const randomProduct = mockProductNames[Math.floor(Math.random() * mockProductNames.length)];
  const randomRarity = rarityLevels[Math.floor(Math.random() * 10) > 7 ? 
    (Math.random() > 0.5 ? 2 : 1) : 0]; // More common items

  return {
    id: barcode,
    name: randomProduct.name,
    category: randomProduct.category,
    barcode,
    rarity: randomRarity,
    dateScanned: new Date().toISOString(),
    scanCount: 1
  };
}

function getRarityRewards(rarity: "común" | "raro" | "épico" | "legendario") {
  const rewards = {
    común: { points: 100, xp: 50 },
    raro: { points: 250, xp: 100 },
    épico: { points: 500, xp: 200 },
    legendario: { points: 1000, xp: 500 }
  };
  return rewards[rarity];
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("createUser");
  const [userData, setUserData] = useState<UserData>({
    username: "",
    avatar: "",
    level: 1,
    currentXP: 0,
    totalPoints: 0,
    dailyStreak: 1,
    products: [],
    tasks: []
  });
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("scanQuestData");
    if (saved) {
      try {
        const loadedData = JSON.parse(saved);
        setUserData({
          ...loadedData,
          // Ensure tasks array exists for backward compatibility
          tasks: loadedData.tasks || []
        });
        // If user data exists, skip create user screen
        if (loadedData.username && loadedData.avatar) {
          setCurrentScreen("home");
        }
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (userData.username && userData.avatar) {
      localStorage.setItem("scanQuestData", JSON.stringify(userData));
    }
  }, [userData]);

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const xpToNextLevel = userData.level * 1000;

  const handleUserCreated = (username: string, avatar: string) => {
    setUserData(prev => ({
      ...prev,
      username,
      avatar
    }));
    setCurrentScreen("home");
  };

  const handleScanComplete = (barcode: string) => {
    const existingProduct = userData.products.find(p => p.barcode === barcode);
    
    if (existingProduct) {
      // Product already in collection
      const updatedProduct = {
        ...existingProduct,
        scanCount: existingProduct.scanCount + 1
      };
      setScannedProduct(updatedProduct);
      setIsNewProduct(false);
    } else {
      // New product
      const newProduct = getRandomProduct(barcode);
      setScannedProduct(newProduct);
      setIsNewProduct(true);
    }
    
    setCurrentScreen("result");
  };

  const handleAddToCollection = () => {
    if (!scannedProduct) return;

    const rewards = getRarityRewards(scannedProduct.rarity);
    const newXP = userData.currentXP + rewards.xp;
    const newLevel = calculateLevel(newXP);

    setUserData(prev => {
      const existingIndex = prev.products.findIndex(p => p.barcode === scannedProduct.barcode);
      
      let updatedProducts;
      if (existingIndex >= 0) {
        // Update existing product
        updatedProducts = [...prev.products];
        updatedProducts[existingIndex] = scannedProduct;
      } else {
        // Add new product
        updatedProducts = [...prev.products, scannedProduct];
      }

      return {
        ...prev,
        currentXP: newXP % 1000,
        level: newLevel,
        totalPoints: prev.totalPoints + rewards.points,
        products: updatedProducts
      };
    });

    setCurrentScreen("home");
    setScannedProduct(null);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen("detail");
  };

  const handleAddTask = (task: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false
    };

    setUserData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    const task = userData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newXP = userData.currentXP + task.xpReward;
    const newLevel = calculateLevel(newXP);

    setUserData(prev => ({
      ...prev,
      currentXP: newXP % 1000,
      level: newLevel,
      totalPoints: prev.totalPoints + task.pointsReward,
      tasks: prev.tasks.map(t =>
        t.id === taskId
          ? { ...t, completed: true, completedDate: new Date().toISOString() }
          : t
      )
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setUserData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const activeTasks = userData.tasks.filter(t => !t.completed).length;

  const handleTabChange = (tab: Tab) => {
    setCurrentScreen(tab);
  };

  const getCurrentTab = (): Tab => {
    if (currentScreen === "collection" || currentScreen === "detail") return "collection";
    if (currentScreen === "tasks") return "tasks";
    return "home";
  };

  const showBottomNav = currentScreen !== "createUser" && currentScreen !== "scanner" && currentScreen !== "result";

  // Calculate collection stats
  const totalProducts = userData.products.length;
  const categories = [...new Set(userData.products.map(p => p.category))];
  const categoriesCount = categories.length;

  // Calculate completed tasks today
  const today = new Date().toDateString();
  const completedTasksToday = userData.tasks.filter(
    t => t.completed && t.completedDate && new Date(t.completedDate).toDateString() === today
  ).length;

  return (
    <div className="size-full bg-white">
      {currentScreen === "createUser" && (
        <CreateUser onComplete={handleUserCreated} />
      )}

      {currentScreen === "home" && (
        <Home
          userLevel={userData.level}
          currentXP={userData.currentXP}
          xpToNextLevel={xpToNextLevel}
          totalPoints={userData.totalPoints}
          dailyStreak={userData.dailyStreak}
          username={userData.username}
          avatar={userData.avatar}
          activeTasks={activeTasks}
          totalProducts={totalProducts}
          categoriesCount={categoriesCount}
          completedTasksToday={completedTasksToday}
          tasks={userData.tasks}
          onScanClick={() => setCurrentScreen("scanner")}
          onCollectionClick={() => setCurrentScreen("collection")}
          onTasksClick={() => setCurrentScreen("tasks")}
          onCompleteTask={handleCompleteTask}
        />
      )}

      {currentScreen === "scanner" && (
        <Scanner
          onScanComplete={handleScanComplete}
          onClose={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "result" && scannedProduct && (
        <ScanResult
          product={{
            ...scannedProduct,
            ...getRarityRewards(scannedProduct.rarity)
          }}
          isNewProduct={isNewProduct}
          onAddToCollection={handleAddToCollection}
          onGoHome={() => setCurrentScreen("home")}
        />
      )}

      {currentScreen === "collection" && (
        <Collection
          products={userData.products}
          onBack={() => setCurrentScreen("home")}
          onProductClick={handleProductClick}
        />
      )}

      {currentScreen === "detail" && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setCurrentScreen("collection")}
        />
      )}

      {currentScreen === "tasks" && (
        <Tasks
          tasks={userData.tasks}
          onBack={() => setCurrentScreen("home")}
          onAddTask={handleAddTask}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {showBottomNav && (
        <BottomNav
          activeTab={getCurrentTab()}
          onTabChange={handleTabChange}
          activeTasks={activeTasks}
        />
      )}
    </div>
  );
}