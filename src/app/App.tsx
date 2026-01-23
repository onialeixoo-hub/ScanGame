import { useState, useEffect } from "react";
import { Home } from "./components/Home";
import { Scanner } from "./components/Scanner";
import { ScanResult } from "./components/ScanResult";
import { ProductDetail } from "./components/ProductDetail";
import { BottomNav } from "./components/BottomNav";
import { Tasks } from "./components/Tasks";
import { Collection } from "./components/Collection";
import { AnimatePresence, motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { User, ShieldCheck } from "lucide-react";

// --- TIPOS DE DATOS ---
interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
  level: number;
  xp: number;
  points: number;
  streak: number;
}

// Datos iniciales por defecto (si es la primera vez que entras)
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'admin-01',
    name: 'Administrador (Yo)',
    role: 'admin',
    level: 5,
    xp: 2450,
    points: 120,
    streak: 15
  },
  {
    id: 'user-01',
    name: 'Familiar / Jugador',
    role: 'user',
    level: 1,
    xp: 0,
    points: 0,
    streak: 0
  }
];

export default function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState("home");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  
  // Estado para manejar usuarios
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);

  // --- PERSISTENCIA (GUARDAR DATOS) ---
  
  // 1. Cargar datos al iniciar la app
  useEffect(() => {
    const savedUsers = localStorage.getItem('scanGameUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  // 2. Guardar datos cada vez que cambian
  useEffect(() => {
    localStorage.setItem('scanGameUsers', JSON.stringify(users));
  }, [users]);

  // Función para actualizar el usuario actual y la lista general
  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);

    setUsers(prevUsers => 
      prevUsers.map(u => u.id === currentUser.id ? updatedUser : u)
    );
  };

  // --- LÓGICA DEL JUEGO ---

  const handleScan = (code: string) => {
    setShowScanner(false);
    // Simular búsqueda de producto
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
    if (scannedProduct) {
      // Dar XP y Puntos al usuario
      const newXp = (currentUser?.xp || 0) + 50;
      const newPoints = (currentUser?.points || 0) + 10;
      
      updateCurrentUser({ xp: newXp, points: newPoints });
      
      toast.success("¡Recompensa reclamada! +50 XP");
      setScannedProduct(null);
      setActiveTab("home");
    }
  };

  // --- PANTALLA DE LOGIN (SELECCIÓN DE PERFIL) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#E2DADB] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#12130F]">Bienvenido</h1>
            <p className="text-[#386FA4]">Selecciona quién eres para continuar</p>
          </div>

          <div className="grid gap-4">
            {users.map((user) => (
              <Card 
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className="p-6 cursor-pointer hover:border-[#386FA4] transition-all border-2 border-transparent bg-white shadow-lg flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${user.role === 'admin' ? 'bg-[#386FA4]' : 'bg-[#7CAE7A]'}`}>
                  {user.role === 'admin' ? <ShieldCheck /> : <User />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#12130F]">{user.name}</h3>
                  <p className="text-sm text-gray-500">Nivel {user.level} • {user.points} pts</p>
                </div>
              </Card>
            ))}
          </div>

          <Button 
            variant="ghost" 
            className="w-full text-red-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => {
              if(confirm("¿Seguro? Esto borrará todo el progreso.")) {
                localStorage.removeItem('scanGameUsers');
                window.location.reload();
              }
            }}
          >
            Borrar datos y reiniciar
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- APP PRINCIPAL ---
  return (
    <div className="bg-[#E2DADB] min-h-screen font-sans text-[#12130F]">
      <Toaster position="top-center" />
      
      {/* Área principal de contenido */}
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
              key="home"
              userLevel={currentUser.level}
              currentXP={currentUser.xp}
              xpToNextLevel={currentUser.level * 1000} // Fórmula simple de nivel
              totalPoints={currentUser.points}
              dailyStreak={currentUser.streak}
              username={currentUser.name}
              avatar={currentUser.role === 'admin' ? "🛡️" : "👤"}
              activeTasks={3}
              totalProducts={12} 
              categoriesCount={4}
              completedTasksToday={1}
              tasks={[]} // Aquí pasarías las tareas reales
              onScanClick={() => setShowScanner(true)}
              onCollectionClick={() => setActiveTab("collection")}
              onTasksClick={() => setActiveTab("tasks")}
              onCompleteTask={() => {}}
            />
          ) : activeTab === "collection" ? (
             <Collection key="collection" />
          ) : activeTab === "tasks" ? (
             <Tasks key="tasks" />
          ) : null}
        </AnimatePresence>

        {/* Navegación Inferior */}
        {!showScanner && !scannedProduct && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      
      </div>
    </div>
  );
}