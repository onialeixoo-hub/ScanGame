import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Scan, Star, Flame, Trophy, ListTodo, Package, Grid3x3, Sparkles, Check, ArrowRight, Menu, Settings, UserRoundCog, XCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Input } from "@/app/components/ui/input";
import avatarHoodie from "@/assets/avatars/avatar-hoodie.svg";
import avatarHeadset from "@/assets/avatars/avatar-headset.svg";
import avatarCap from "@/assets/avatars/avatar-cap.svg";
import avatarPlay from "@/assets/avatars/avatar-play.svg";
import avatarPepsi from "@/assets/avatars/avatar-pepsi.svg";
import avatarCamera from "@/assets/avatars/avatar-camera.svg";
import avatarGlasses from "@/assets/avatars/avatar-glasses.svg";

interface Task {
  id: string;
  title: string;
  xpReward: number;
  pointsReward: number;
  completed: boolean;
}

interface HomeProps {
  userLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalPoints: number;
  dailyStreak: number;
  username: string;
  avatar: string;
  activeTasks: number;
  totalProducts: number;
  categoriesCount: number;
  completedTasksToday: number;
  tasks: Task[];
  onScanClick: () => void;
  onCollectionClick: () => void;
  onTasksClick: () => void;
  onCompleteTask: (taskId: string) => void;
  onLogout: () => void;
  onUpdateProfileName: (name: string) => void;
  onUpdateAvatar: (avatar: string) => void;
}

export function Home({
  userLevel,
  currentXP,
  xpToNextLevel,
  totalPoints,
  dailyStreak,
  username,
  avatar,
  activeTasks,
  totalProducts,
  categoriesCount,
  completedTasksToday,
  tasks,
  onScanClick,
  onCollectionClick,
  onTasksClick,
  onCompleteTask,
  onLogout,
  onUpdateProfileName,
  onUpdateAvatar
}: HomeProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [pendingName, setPendingName] = useState(username);

  const avatarOptions = [
    { id: "hoodie", src: avatarHoodie, label: "Hoodie" },
    { id: "headset", src: avatarHeadset, label: "Headset" },
    { id: "cap", src: avatarCap, label: "Gorra" },
    { id: "play", src: avatarPlay, label: "Gaming" },
    { id: "pepsi", src: avatarPepsi, label: "Pepsi" },
    { id: "camera", src: avatarCamera, label: "Cámara" },
    { id: "glasses", src: avatarGlasses, label: "Lentes" }
  ];

  const xpPercentage = (currentXP / xpToNextLevel) * 100;
  const todayTasks = tasks.filter(t => !t.completed).slice(0, 3); // Primeras 3 tareas del día

  return (
    <div className="min-h-screen bg-[#E2DADB] p-6 pb-24">
      {/* CTA Principal - Botón Escanear */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mb-6"
      >
        <div className="relative">
          <Button
            onClick={onScanClick}
            className="w-full h-24 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] hover:from-[#2d5a85] hover:to-[#386FA4] text-white font-bold text-2xl rounded-3xl shadow-2xl relative overflow-hidden group pl-16"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <Scan className="w-10 h-10 mr-3" />
            <span>Escanear Producto</span>
          </Button>
          <Button
            onClick={() => setShowProfileMenu(true)}
            size="icon"
            className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-2xl bg-white/90 text-[#386FA4] hover:bg-white"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </motion.div>

      {/* Header Compacto - Avatar, Nombre, Nivel, Puntos */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <Card className="p-4 bg-white border-2 border-[#386FA4]/20 shadow-md">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-white overflow-hidden"
            >
              <img src={avatar} alt={`Avatar de ${username}`} className="w-full h-full object-cover" />
            </motion.div>
            
            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#12130F]">¡Hola, {username}!</h2>
              <p className="text-sm text-[#386FA4] font-semibold">Nivel {userLevel}</p>
            </div>
            
            {/* Puntos Badge */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl px-3 py-2 border-2 border-amber-200 shadow-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span className="text-lg font-bold text-amber-900">{totalPoints}</span>
              </div>
              <p className="text-xs text-amber-700 text-center">puntos</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Banner Racha Diaria */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <Card className="p-4 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-200 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700 font-semibold">Racha Diaria</p>
                <p className="text-2xl font-bold text-orange-900">{dailyStreak} días</p>
              </div>
            </div>
            <Trophy className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </motion.div>

      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <Card className="p-5 bg-white border-2 border-[#386FA4]/20 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#386FA4] to-[#2d5a85] flex items-center justify-center text-white font-bold text-lg shadow-md">
              {userLevel}
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#386FA4]">Nivel Actual</p>
              <p className="text-xl font-bold text-[#12130F]">Nivel {userLevel}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#386FA4]">Progreso</span>
              <span className="text-[#12130F] font-semibold">{currentXP} / {xpToNextLevel} XP</span>
            </div>
            <Progress value={xpPercentage} className="h-2.5 bg-[#E2DADB]" />
          </div>
        </Card>
      </motion.div>

      {/* Mis Estadísticas - 3 Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h3 className="text-base font-bold text-[#12130F] mb-3">📊 Mis Estadísticas</h3>
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] border-0 shadow-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">{totalProducts}</p>
              <p className="text-xs text-white/80 leading-tight">Productos</p>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-[#7CAE7A] to-[#5d9259] border-0 shadow-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                <Grid3x3 className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">{categoriesCount}</p>
              <p className="text-xs text-white/80 leading-tight">Categorías</p>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] border-0 shadow-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">{completedTasksToday}</p>
              <p className="text-xs text-white/80 leading-tight">Tareas hoy</p>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Tareas del Día */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[#12130F]">✅ Tareas del Día</h3>
          <Button
            onClick={onTasksClick}
            variant="ghost"
            className="text-[#386FA4] hover:bg-[#386FA4]/10 text-sm font-semibold h-8 px-3"
          >
            Ver todas
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="p-3 bg-white border-2 border-[#386FA4]/20 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className="w-8 h-8 rounded-full border-2 border-[#386FA4] hover:bg-[#386FA4] transition-colors flex items-center justify-center group flex-shrink-0"
                    >
                      <Check className="w-5 h-5 text-[#386FA4] group-hover:text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#12130F] text-sm truncate">{task.title}</p>
                      <p className="text-xs text-[#386FA4]">+{task.xpReward} XP</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 bg-white/50 border-2 border-dashed border-[#386FA4]/30">
            <div className="text-center">
              <ListTodo className="w-12 h-12 text-[#386FA4]/40 mx-auto mb-2" />
              <p className="text-sm text-[#386FA4]/60 font-semibold">No hay tareas pendientes</p>
              <Button
                onClick={onTasksClick}
                variant="ghost"
                className="text-[#386FA4] hover:bg-[#386FA4]/10 text-sm mt-2"
              >
                Agregar tareas
              </Button>
            </div>
          </Card>
        )}
      </motion.div>

      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            className="fixed inset-0 z-40 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="flex-1 bg-black/40"
              onClick={() => setShowProfileMenu(false)}
            />
            <motion.div
              className="w-[82%] max-w-xs bg-gradient-to-b from-[#386FA4] to-[#2d5a85] p-5 text-white shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                    <img
                      src={avatar}
                      alt={`Avatar de ${username}`}
                      className="h-full w-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{username}</p>
                    <p className="text-xs text-white/80">Nivel {userLevel}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <Button
                  size="sm"
                  className="bg-emerald-400 text-white hover:bg-emerald-500"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <UserRoundCog className="w-4 h-4 mr-2" />
                  Avatar
                </Button>
                <Button
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    setPendingName(username);
                    setShowNameModal(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Nombre
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Card className="bg-white/95 text-[#12130F] p-3">
                  <p className="text-xs text-[#386FA4]">Puntos</p>
                  <p className="text-lg font-bold">{totalPoints}</p>
                </Card>
                <Card className="bg-white/95 text-[#12130F] p-3">
                  <p className="text-xs text-[#386FA4]">Racha</p>
                  <p className="text-lg font-bold">{dailyStreak} días</p>
                </Card>
                <Card className="bg-white/95 text-[#12130F] p-3">
                  <p className="text-xs text-[#386FA4]">Productos</p>
                  <p className="text-lg font-bold">{totalProducts}</p>
                </Card>
                <Card className="bg-white/95 text-[#12130F] p-3">
                  <p className="text-xs text-[#386FA4]">Categorías</p>
                  <p className="text-lg font-bold">{categoriesCount}</p>
                </Card>
              </div>

              <div className="mt-6">
                <Button
                  className="w-full bg-white text-[#386FA4] hover:bg-white/90"
                  onClick={onLogout}
                >
                  Cerrar sesión
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNameModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-sm p-6 bg-white">
              <h3 className="text-lg font-bold text-[#12130F] mb-3">
                Editar nombre de perfil
              </h3>
              <Input
                value={pendingName}
                onChange={(event) => setPendingName(event.target.value)}
                placeholder="Nombre de perfil"
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowNameModal(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                  onClick={() => {
                    if (pendingName.trim()) {
                      onUpdateProfileName(pendingName.trim());
                      setShowNameModal(false);
                    }
                  }}
                >
                  Guardar
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#12130F]">
                  Elegí tu avatar
                </h3>
                <Button variant="ghost" onClick={() => setShowAvatarModal(false)}>
                  Cerrar
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {avatarOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-2xl border-2 p-2 transition ${
                      avatar === option.src
                        ? "border-[#386FA4] bg-[#386FA4]/10"
                        : "border-transparent hover:border-[#386FA4]/40"
                    }`}
                    onClick={() => {
                      onUpdateAvatar(option.src);
                      setShowAvatarModal(false);
                    }}
                  >
                    <img
                      src={option.src}
                      alt={option.label}
                      className="w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 text-xs text-[#386FA4] font-semibold">
                      {option.label}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
