import { useState } from "react";
import { Home } from "./components/Home";
import { Scanner } from "./components/Scanner";
import { ScanResult } from "./components/ScanResult";
import { ProductDetail } from "./components/ProductDetail";
import { BottomNav } from "./components/BottomNav";
import { Tasks } from "./components/Tasks";
import { Collection } from "./components/Collection";
import { AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const handleScan = (code: string) => {
    setShowScanner(false);
    // Simulate API lookup
    setTimeout(() => {
      setScannedProduct({
        id: code,
        name: "Producto Misterioso",
        brand: "Marca Desconocida",
        calories: 150,
        novaScore: 2,
        nutriscore: "c",
        image: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.429.400.jpg"
      });
    }, 500);
  };

  const handleClaimReward = () => {
    toast.success("¡Recompensa reclamada! +50 XP");
    setScannedProduct(null);
    setActiveTab("home");
  };

  return (
    <div className="bg-[#E2DADB] min-h-screen font-sans text-[#12130F]">
      <Toaster position="top-center" />
      
      {/* Mobile container constraint */}
      <div className="pb-20 max-w-md mx-auto bg-[#E2DADB] min-h-screen relative shadow-2xl overflow-hidden">
        
        <AnimatePresence mode="wait">
          {showScanner ? (
            <Scanner 
              key="scanner" 
              onScan={handleScan} 
              onClose={() => setShowScanner(false)} 
            />
          ) : scannedProduct ? (
            <ScanResult 
              key="result"
              product={scannedProduct}
              onClose={() => setScannedProduct(null)}
              onClaim={handleClaimReward}
            />
          ) : activeTab === "home" ? (
            <Home 
              userLevel={5}
              currentXP={2450}
              xpToNextLevel={3000}
              totalPoints={120}
              dailyStreak={15}
              username="Ale"
              avatar="👤"
              activeTasks={3}
              totalProducts={12} 
              categoriesCount={4}
              completedTasksToday={1}
              tasks={[]}
              onScanClick={() => setShowScanner(true)}
              onCollectionClick={() => setActiveTab("collection")}
              onTasksClick={() => setActiveTab("tasks")}
              onCompleteTask={() => {}}
            />
          ) : activeTab === "collection" ? (
             <Collection />
          ) : activeTab === "tasks" ? (
             <Tasks />
          ) : null}
        </AnimatePresence>

        {/* Bottom Navigation */}
        {!showScanner && !scannedProduct && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      
      </div>
    </div>
  );
}