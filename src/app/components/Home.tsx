import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  Grid3x3,
  ListTodo,
  Menu,
  Package,
  ScanLine,
  Settings,
  Sparkles,
  Star,
  UserRoundCog,
  XCircle
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Progress } from "@/app/components/ui/progress";
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

  let levelStartXp = 0;
  let levelRequirement = 1000;

  for (let level = 1; level < userLevel; level += 1) {
    levelStartXp += levelRequirement;
    levelRequirement += 200;
  }

  const xpInCurrentLevel = Math.max(currentXP - levelStartXp, 0);
  const xpRequiredForCurrentLevel = Math.max(
    xpToNextLevel - levelStartXp,
    1
  );
  const xpPercentage = Math.min(
    (xpInCurrentLevel / xpRequiredForCurrentLevel) * 100,
    100
  );

  const todayTasks = tasks.filter((task) => !task.completed).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#E2DADB] px-4 pb-24 pt-3">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex items-center gap-2.5"
      >
        <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <img
            src={avatar}
            alt={`Avatar de ${username}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#386FA4]">
            Bienvenido de nuevo
          </p>
          <h1 className="truncate text-xl font-bold leading-tight text-[#12130F]">
            {username}
          </h1>
        </div>

        <Button
          type="button"
          size="icon"
          onClick={() => setShowProfileMenu(true)}
          className="h-10 w-10 rounded-xl bg-[#386FA4] text-white shadow-lg hover:bg-[#2d5a85]"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Nivel y XP */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="mb-2.5"
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] p-3.5 text-white shadow-xl">
          <div className="mb-2.5 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-bold shadow-inner">
              {userLevel}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/75">
                Nivel actual
              </p>
              <p className="text-xl font-bold leading-tight">Nivel {userLevel}</p>
              <p className="text-xs text-white/75">
                {xpRequiredForCurrentLevel - xpInCurrentLevel} XP para subir
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold">XP del nivel</span>
              <span className="text-right font-bold">
                {xpInCurrentLevel} / {xpRequiredForCurrentLevel} XP
              </span>
            </div>
            <Progress
              value={xpPercentage}
              className="h-2.5 bg-white/20"
            />
          </div>
        </Card>
      </motion.div>

      {/* Puntos y racha */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-3 grid grid-cols-2 gap-2.5"
      >
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 p-3 shadow-md">
          <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
          </div>
          <p className="text-xl font-bold leading-tight text-amber-950">{totalPoints}</p>
          <p className="text-xs font-semibold text-amber-700">
            Puntos disponibles
          </p>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-3 shadow-md">
          <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-400/20">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-xl font-bold leading-tight text-orange-950">
            {dailyStreak} días
          </p>
          <p className="text-xs font-semibold text-orange-700">
            Racha actual
          </p>
        </Card>
      </motion.div>

      {/* Tareas del día */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#12130F]">
              Tareas del día
            </h2>
            <p className="text-xs text-[#386FA4]">
              {activeTasks} pendiente{activeTasks === 1 ? "" : "s"}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onTasksClick}
            className="h-8 px-2 text-xs text-[#386FA4] hover:bg-[#386FA4]/10"
          >
            Ver todas
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + index * 0.05 }}
              >
                <Card className="border-2 border-[#386FA4]/15 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onCompleteTask(task.id)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#386FA4] transition hover:bg-[#386FA4]"
                      aria-label={`Completar ${task.title}`}
                    >
                      <Check className="h-4 w-4 text-[#386FA4]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#12130F]">
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded-full bg-purple-100 px-2 py-1 font-semibold text-purple-700">
                          +{task.xpReward} XP
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                          +{task.pointsReward} puntos
                        </span>
                      </div>
                    </div>

                    <Sparkles className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-3 text-center">
            <Check className="mx-auto mb-1 h-7 w-7 text-emerald-500" />
            <p className="text-sm font-bold text-emerald-800">
              No quedan tareas pendientes
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Podés revisar el historial desde Tareas.
            </p>
          </Card>
        )}
      </motion.section>

      {/* Escaneo secundario */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <Card className="border-2 border-[#386FA4]/20 bg-white p-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#386FA4]/10">
              <ScanLine className="h-6 w-6 text-[#386FA4]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#12130F]">
                Escanear producto
              </p>
              <p className="truncate text-xs text-[#386FA4]">
                Sumá productos a tu colección.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={onScanClick}
              className="flex-shrink-0 rounded-xl bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-3 text-white"
            >
              Escanear
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Estadísticas al final */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#386FA4]" />
            <h2 className="text-lg font-bold text-[#12130F]">
              Estadísticas
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onCollectionClick}
            className="text-[#386FA4] hover:bg-[#386FA4]/10"
          >
            Ver colección
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] p-3 text-center text-white shadow-md">
            <Package className="mx-auto mb-2 h-6 w-6" />
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs text-white/80">Productos</p>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-[#7CAE7A] to-[#5d9259] p-3 text-center text-white shadow-md">
            <Grid3x3 className="mx-auto mb-2 h-6 w-6" />
            <p className="text-2xl font-bold">{categoriesCount}</p>
            <p className="text-xs text-white/80">Categorías</p>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] p-3 text-center text-white shadow-md">
            <ListTodo className="mx-auto mb-2 h-6 w-6" />
            <p className="text-2xl font-bold">{completedTasksToday}</p>
            <p className="text-xs text-white/80">Hechas hoy</p>
          </Card>
        </div>
      </motion.section>

      {/* Menú de perfil */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="flex-1 bg-black/45"
              onClick={() => setShowProfileMenu(false)}
              aria-hidden="true"
            />

            <motion.aside
              className="flex h-full w-[84%] max-w-xs flex-col bg-gradient-to-b from-[#386FA4] to-[#2d5a85] p-5 text-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-white/20">
                    <img
                      src={avatar}
                      alt={`Avatar de ${username}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{username}</p>
                    <p className="text-xs text-white/80">Nivel {userLevel}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowProfileMenu(false)}
                  aria-label="Cerrar menú"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="mb-6 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-400 text-white hover:bg-emerald-500"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <UserRoundCog className="mr-2 h-4 w-4" />
                  Avatar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    setPendingName(username);
                    setShowNameModal(true);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Nombre
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">Puntos disponibles</p>
                  <p className="text-lg font-bold">{totalPoints}</p>
                </Card>
                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">Racha</p>
                  <p className="text-lg font-bold">{dailyStreak} días</p>
                </Card>
              </div>

              <div className="mt-auto pt-6">
                <Button
                  type="button"
                  className="w-full bg-white text-[#386FA4] hover:bg-white/90"
                  onClick={onLogout}
                >
                  Salir de la cuenta
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cambiar nombre */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-sm bg-white p-6">
              <h3 className="mb-3 text-lg font-bold text-[#12130F]">
                Editar nombre de perfil
              </h3>
              <Input
                value={pendingName}
                onChange={(event) => setPendingName(event.target.value)}
                placeholder="Nombre de perfil"
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowNameModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
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

      {/* Cambiar avatar */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-md bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#12130F]">
                  Elegí tu avatar
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAvatarModal(false)}
                >
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
                    <p className="mt-2 text-xs font-semibold text-[#386FA4]">
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
