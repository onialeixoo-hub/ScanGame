import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  Grid3x3,
  ListTodo,
  LogOut,
  Menu,
  Package,
  Pencil,
  Sparkles,
  Star,
  UserRoundCog,
  XCircle
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Progress } from "@/app/components/ui/progress";
import type { TaskPriority } from "@/app/types";
import {
  TASK_PRIORITY_CONFIG,
  resolveTaskPriority
} from "@/app/lib/task-priority";
import {
  AVATAR_OPTIONS,
  getAvatarSrc,
  normalizeAvatarId
} from "@/app/lib/avatar-options";

interface HomeTask {
  id: string;
  title: string;
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  priority?: TaskPriority;
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
  tasks: HomeTask[];
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

  const selectedAvatarId = normalizeAvatarId(avatar, "user");
  const avatarSrc = getAvatarSrc(selectedAvatarId, "user");

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
  const xpRemaining = Math.max(
    xpRequiredForCurrentLevel - xpInCurrentLevel,
    0
  );

  const todayTasks = tasks.filter((task) => !task.completed).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#E2DADB] px-4 pb-40 pt-3">
      <button
        type="button"
        data-scangame-scan-trigger
        className="hidden"
        onClick={onScanClick}
        aria-hidden="true"
        tabIndex={-1}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 flex items-center gap-2.5"
      >
        <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <img
            src={avatarSrc}
            alt={`Avatar de ${username}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#386FA4]">
            Bienvenido de nuevo
          </p>
          <h1 className="truncate text-lg font-extrabold text-[#12130F]">
            {username}
          </h1>
        </div>

        <Button
          type="button"
          size="icon"
          onClick={() => setShowProfileMenu(true)}
          className="h-10 w-10 rounded-xl bg-[#386FA4] text-white shadow-md hover:bg-[#2d5a85]"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </motion.div>

      <Card className="mb-3 border-0 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-extrabold">
            {userLevel}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                  Progreso total
                </p>
                <p className="text-lg font-extrabold">Nivel {userLevel}</p>
              </div>
              <p className="text-xs font-bold">
                {xpInCurrentLevel}/{xpRequiredForCurrentLevel} XP
              </p>
            </div>

            <Progress value={xpPercentage} className="h-2 bg-white/20" />
            <p className="mt-1.5 text-[10px] font-semibold text-white/70">
              Faltan {xpRemaining} XP para el próximo nivel
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-100 p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Star className="h-5 w-5 fill-violet-500 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none text-violet-950">
                {totalPoints}
              </p>
              <p className="mt-1 text-[10px] font-bold text-violet-700">
                XP disponibles
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400/20">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none text-orange-950">
                {dailyStreak} días
              </p>
              <p className="mt-1 text-[10px] font-bold text-orange-700">
                Racha
              </p>
            </div>
          </div>
        </Card>
      </div>

      <section className="mb-5">
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#12130F]">
              Tareas del día
            </h2>
            <p className="text-[11px] font-medium text-[#386FA4]">
              {activeTasks} pendiente{activeTasks === 1 ? "" : "s"}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onTasksClick}
            className="h-8 px-2 text-xs font-bold text-[#386FA4]"
          >
            Ver todas
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task) => {
              const priority = resolveTaskPriority(
                task.priority,
                task.xpReward
              );
              const config = TASK_PRIORITY_CONFIG[priority];

              return (
                <Card
                  key={task.id}
                  className={`border-2 bg-white p-3 shadow-sm ${config.borderClass}`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onCompleteTask(task.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#386FA4]"
                      aria-label={`Completar ${task.title}`}
                    >
                      <Check className="h-4 w-4 text-[#386FA4]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[#12130F]">
                        {task.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                        <span
                          className={`rounded-full border px-2 py-1 font-bold ${config.badgeClass}`}
                        >
                          {config.shortLabel}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2 py-1 font-bold text-violet-700">
                          +{task.xpReward} XP
                        </span>
                      </div>
                    </div>

                    <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-4 text-center">
            <Check className="mx-auto mb-1 h-6 w-6 text-emerald-500" />
            <p className="text-sm font-bold text-emerald-800">
              No quedan tareas pendientes
            </p>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#386FA4]" />
            <h2 className="text-base font-extrabold text-[#12130F]">
              Estadísticas
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onCollectionClick}
            className="h-8 px-2 text-xs font-bold text-[#386FA4]"
          >
            Ver colección
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] p-3 text-center text-white shadow-md">
            <Package className="mx-auto mb-1 h-5 w-5" />
            <p className="text-xl font-extrabold">{totalProducts}</p>
            <p className="text-[10px] text-white/80">Productos</p>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-[#7CAE7A] to-[#5d9259] p-3 text-center text-white shadow-md">
            <Grid3x3 className="mx-auto mb-1 h-5 w-5" />
            <p className="text-xl font-extrabold">{categoriesCount}</p>
            <p className="text-[10px] text-white/80">Categorías</p>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] p-3 text-center text-white shadow-md">
            <ListTodo className="mx-auto mb-1 h-5 w-5" />
            <p className="text-xl font-extrabold">{completedTasksToday}</p>
            <p className="text-[10px] text-white/80">Hechas hoy</p>
          </Card>
        </div>
      </section>

      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            className="fixed inset-0 z-[100] flex"
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
              className="flex h-full w-[84%] max-w-xs flex-col bg-gradient-to-b from-[#386FA4] to-[#2d5a85] p-5 pb-24 text-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-white/20">
                    <img
                      src={avatarSrc}
                      alt={`Avatar de ${username}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="truncate text-lg font-semibold">
                      {username}
                    </p>
                    <p className="text-xs text-white/80">
                      Nivel {userLevel}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">XP disponibles</p>
                  <p className="text-lg font-bold">{totalPoints}</p>
                </Card>
                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">XP acumulada</p>
                  <p className="text-lg font-bold">{currentXP}</p>
                </Card>
              </div>

              <div className="mt-4 grid gap-2">
                <Button
                  type="button"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <UserRoundCog className="mr-2 h-4 w-4" />
                  Cambiar avatar
                </Button>

                <Button
                  type="button"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    setPendingName(username);
                    setShowNameModal(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Cambiar nombre
                </Button>
              </div>

              <Button
                type="button"
                className="mt-auto bg-white text-[#386FA4] hover:bg-white/90"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir de la cuenta
              </Button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNameModal && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-sm bg-white p-5">
              <h3 className="text-lg font-bold text-[#12130F]">
                Cambiar nombre
              </h3>
              <Input
                className="mt-4"
                value={pendingName}
                onChange={(event) => setPendingName(event.target.value)}
                maxLength={30}
              />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNameModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-[#386FA4] text-white"
                  onClick={() => {
                    const cleanName = pendingName.trim();
                    if (!cleanName) return;
                    onUpdateProfileName(cleanName);
                    setShowNameModal(false);
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
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-sm bg-white p-5">
              <h3 className="text-lg font-bold text-[#12130F]">
                Elegí tu avatar
              </h3>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onUpdateAvatar(option.id);
                      setShowAvatarModal(false);
                    }}
                    className={`rounded-2xl border-2 p-2 ${
                      selectedAvatarId === option.id
                        ? "border-[#386FA4] bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <img
                      src={option.src}
                      alt={option.label}
                      className="mx-auto h-16 w-16 rounded-full object-cover"
                    />
                    <p className="mt-1 text-xs font-semibold text-[#386FA4]">
                      {option.label}
                    </p>
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setShowAvatarModal(false)}
              >
                Cerrar
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
