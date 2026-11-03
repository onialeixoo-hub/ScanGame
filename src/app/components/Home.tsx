import { useState } from "react";
import {
  AnimatePresence,
  motion
} from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  Grid3x3,
  ListTodo,
  Menu,
  Package,
  Settings,
  Sparkles,
  Star,
  UserRoundCog,
  XCircle
} from "lucide-react";

import {
  Button
} from "@/app/components/ui/button";
import {
  Card
} from "@/app/components/ui/card";
import {
  Input
} from "@/app/components/ui/input";
import {
  Progress
} from "@/app/components/ui/progress";

import type {
  TaskPriority
} from "@/app/types";

import {
  TASK_PRIORITY_CONFIG,
  resolveTaskPriority
} from "@/app/lib/task-priority";

import {
  AVATAR_OPTIONS,
  getAvatarSrc,
  normalizeAvatarId
} from "@/app/lib/avatar-options";

interface Task {
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
  tasks: Task[];
  onScanClick: () => void;
  onCollectionClick: () => void;
  onTasksClick: () => void;
  onCompleteTask: (
    taskId: string
  ) => void;
  onLogout: () => void;
  onUpdateProfileName: (
    name: string
  ) => void;
  onUpdateAvatar: (
    avatar: string
  ) => void;
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
  const [
    showProfileMenu,
    setShowProfileMenu
  ] = useState(false);

  const [
    showNameModal,
    setShowNameModal
  ] = useState(false);

  const [
    showAvatarModal,
    setShowAvatarModal
  ] = useState(false);

  const [
    pendingName,
    setPendingName
  ] = useState(username);

  const selectedAvatarId =
    normalizeAvatarId(
      avatar,
      "user"
    );

  const avatarSrc =
    getAvatarSrc(
      selectedAvatarId,
      "user"
    );

  let levelStartXp = 0;
  let levelRequirement = 1000;

  for (
    let level = 1;
    level < userLevel;
    level += 1
  ) {
    levelStartXp +=
      levelRequirement;

    levelRequirement +=
      200;
  }

  const xpInCurrentLevel =
    Math.max(
      currentXP -
        levelStartXp,
      0
    );

  const xpRequiredForCurrentLevel =
    Math.max(
      xpToNextLevel -
        levelStartXp,
      1
    );

  const xpPercentage =
    Math.min(
      (
        xpInCurrentLevel /
        xpRequiredForCurrentLevel
      ) *
        100,
      100
    );

  const xpRemaining =
    Math.max(
      xpRequiredForCurrentLevel -
        xpInCurrentLevel,
      0
    );

  const todayTasks =
    tasks
      .filter(
        (task) =>
          !task.completed
      )
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#E2DADB] px-4 pb-40 pt-3">

      {/* Trigger invisible para el botón central */}
      <button
        type="button"
        data-scangame-scan-trigger
        className="hidden"
        onClick={
          onScanClick
        }
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* HEADER */}
      <motion.div
        initial={{
          opacity: 0,
          y: -10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="mb-2 flex items-center gap-2.5"
      >
        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <img
            src={
              avatarSrc
            }
            alt={`Avatar de ${username}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#386FA4]">
            Bienvenido de nuevo
          </p>

          <h1 className="truncate text-lg font-extrabold leading-tight text-[#12130F]">
            {username}
          </h1>
        </div>

        <Button
          type="button"
          size="icon"
          onClick={() =>
            setShowProfileMenu(
              true
            )
          }
          className="h-9 w-9 rounded-xl bg-[#386FA4] text-white shadow-md hover:bg-[#2d5a85]"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </motion.div>


      {/* NIVEL COMPACTO */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.98
        }}
        animate={{
          opacity: 1,
          scale: 1
        }}
        transition={{
          delay: 0.04
        }}
        className="mb-2"
      >
        <Card className="border-0 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] p-3 text-white shadow-lg">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl font-extrabold shadow-inner">
              {userLevel}
            </div>

            <div className="min-w-0 flex-1">

              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                    Nivel
                  </p>

                  <p className="text-base font-extrabold leading-none">
                    Nivel{" "}
                    {
                      userLevel
                    }
                  </p>
                </div>

                <p className="text-xs font-bold text-white">
                  {
                    xpInCurrentLevel
                  }
                  {" / "}
                  {
                    xpRequiredForCurrentLevel
                  }{" "}
                  XP
                </p>
              </div>

              <Progress
                value={
                  xpPercentage
                }
                className="h-2 bg-white/20"
              />

              <p className="mt-1.5 text-[10px] font-semibold text-white/70">
                Faltan{" "}
                {
                  xpRemaining
                }{" "}
                XP para Nivel{" "}
                {
                  userLevel +
                  1
                }
              </p>

            </div>
          </div>
        </Card>
      </motion.div>


      {/* PUNTOS + RACHA */}
      <motion.div
        initial={{
          opacity: 0,
          y: 8
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.08
        }}
        className="mb-3 grid grid-cols-2 gap-2"
      >

        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 p-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">

            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
              <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
            </div>

            <div>
              <p className="text-lg font-extrabold leading-none text-amber-950">
                {
                  totalPoints
                }
              </p>

              <p className="mt-1 text-[10px] font-bold text-amber-700">
                Puntos
              </p>
            </div>
          </div>
        </Card>


        <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 p-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">

            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-400/20">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>

            <div>
              <p className="text-lg font-extrabold leading-none text-orange-950">
                {
                  dailyStreak
                }{" "}
                días
              </p>

              <p className="mt-1 text-[10px] font-bold text-orange-700">
                Racha
              </p>
            </div>
          </div>
        </Card>

      </motion.div>


      {/* TAREAS */}
      <motion.section
        initial={{
          opacity: 0,
          y: 12
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.12
        }}
        className="mb-4"
      >

        <div className="mb-2 flex items-end justify-between gap-2">

          <div>
            <h2 className="text-base font-extrabold text-[#12130F]">
              Tareas del día
            </h2>

            <p className="text-[11px] font-medium text-[#386FA4]">
              {
                activeTasks
              }{" "}
              pendiente
              {
                activeTasks ===
                1
                  ? ""
                  : "s"
              }
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={
              onTasksClick
            }
            className="h-8 px-2 text-xs font-bold text-[#386FA4] hover:bg-[#386FA4]/10"
          >
            Ver todas

            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>


        {todayTasks.length >
        0 ? (
          <div className="space-y-2">

            {todayTasks.map(
              (
                task,
                index
              ) => {
                const priority =
                  resolveTaskPriority(
                    task.priority,
                    task.pointsReward
                  );

                const priorityConfig =
                  TASK_PRIORITY_CONFIG[
                    priority
                  ];

                return (
                  <motion.div
                    key={
                      task.id
                    }
                    initial={{
                      opacity: 0,
                      x: -12
                    }}
                    animate={{
                      opacity: 1,
                      x: 0
                    }}
                    transition={{
                      delay:
                        0.15 +
                        index *
                          0.04
                    }}
                  >

                    <Card
                      className={`border-2 bg-white p-3 shadow-sm ${priorityConfig.borderClass}`}
                    >

                      <div className="flex items-center gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            onCompleteTask(
                              task.id
                            )
                          }
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#386FA4] transition active:scale-90"
                          aria-label={`Completar ${task.title}`}
                        >
                          <Check className="h-4 w-4 text-[#386FA4]" />
                        </button>


                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-extrabold text-[#12130F]">
                            {
                              task.title
                            }
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">

                            <span
                              className={`rounded-full border px-2 py-1 font-bold ${priorityConfig.badgeClass}`}
                            >
                              {
                                priorityConfig.shortLabel
                              }
                            </span>

                            <span className="rounded-full bg-purple-100 px-2 py-1 font-bold text-purple-700">
                              +
                              {
                                task.xpReward
                              }{" "}
                              XP
                            </span>

                            <span className="rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-700">
                              +
                              {
                                task.pointsReward
                              }{" "}
                              pts
                            </span>

                          </div>
                        </div>

                        <Sparkles className="h-5 w-5 flex-shrink-0 text-amber-500" />

                      </div>
                    </Card>
                  </motion.div>
                );
              }
            )}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-3 text-center">

            <Check className="mx-auto mb-1 h-6 w-6 text-emerald-500" />

            <p className="text-sm font-bold text-emerald-800">
              No quedan tareas pendientes
            </p>

            <p className="mt-0.5 text-[11px] text-emerald-700">
              Podés revisar el historial desde Tareas.
            </p>

          </Card>
        )}
      </motion.section>


      {/* ESTADÍSTICAS */}
      <motion.section
        initial={{
          opacity: 0,
          y: 12
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.18
        }}
      >

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
            onClick={
              onCollectionClick
            }
            className="h-8 px-2 text-xs font-bold text-[#386FA4] hover:bg-[#386FA4]/10"
          >
            Ver colección
          </Button>

        </div>


        <div className="grid grid-cols-3 gap-2">

          <Card className="border-0 bg-gradient-to-br from-[#386FA4] to-[#2d5a85] p-2.5 text-center text-white shadow-md">

            <Package className="mx-auto mb-1.5 h-5 w-5" />

            <p className="text-xl font-extrabold">
              {
                totalProducts
              }
            </p>

            <p className="text-[10px] text-white/80">
              Productos
            </p>
          </Card>


          <Card className="border-0 bg-gradient-to-br from-[#7CAE7A] to-[#5d9259] p-2.5 text-center text-white shadow-md">

            <Grid3x3 className="mx-auto mb-1.5 h-5 w-5" />

            <p className="text-xl font-extrabold">
              {
                categoriesCount
              }
            </p>

            <p className="text-[10px] text-white/80">
              Categorías
            </p>
          </Card>


          <Card className="border-0 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] p-2.5 text-center text-white shadow-md">

            <ListTodo className="mx-auto mb-1.5 h-5 w-5" />

            <p className="text-xl font-extrabold">
              {
                completedTasksToday
              }
            </p>

            <p className="text-[10px] text-white/80">
              Hechas hoy
            </p>
          </Card>

        </div>
      </motion.section>


      {/* MENÚ PERFIL */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            className="fixed inset-0 z-[100] flex"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
          >

            <div
              className="flex-1 bg-black/45"
              onClick={() =>
                setShowProfileMenu(
                  false
                )
              }
              aria-hidden="true"
            />

            <motion.aside
              className="flex h-full w-[84%] max-w-xs flex-col bg-gradient-to-b from-[#386FA4] to-[#2d5a85] p-5 pb-24 text-white shadow-2xl"
              initial={{
                x: "100%"
              }}
              animate={{
                x: 0
              }}
              exit={{
                x: "100%"
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 30
              }}
            >

              <div className="mb-6 flex items-center justify-between">

                <div className="flex min-w-0 items-center gap-3">

                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-white/20">
                    <img
                      src={
                        avatarSrc
                      }
                      alt={`Avatar de ${username}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">
                      {
                        username
                      }
                    </p>

                    <p className="text-xs text-white/80">
                      Nivel{" "}
                      {
                        userLevel
                      }
                    </p>
                  </div>

                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() =>
                    setShowProfileMenu(
                      false
                    )
                  }
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
                  onClick={() =>
                    setShowAvatarModal(
                      true
                    )
                  }
                >
                  <UserRoundCog className="mr-2 h-4 w-4" />
                  Avatar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    setPendingName(
                      username
                    );

                    setShowNameModal(
                      true
                    );
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Nombre
                </Button>

              </div>


              <div className="grid grid-cols-2 gap-3">

                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">
                    Puntos disponibles
                  </p>

                  <p className="text-lg font-bold">
                    {
                      totalPoints
                    }
                  </p>
                </Card>

                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">
                    Racha
                  </p>

                  <p className="text-lg font-bold">
                    {
                      dailyStreak
                    }{" "}
                    días
                  </p>
                </Card>

              </div>


              <div className="mt-auto pt-6">
                <Button
                  type="button"
                  className="w-full bg-white text-[#386FA4] hover:bg-white/90"
                  onClick={
                    onLogout
                  }
                >
                  Salir de la cuenta
                </Button>
              </div>

            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>


      {/* CAMBIAR NOMBRE */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-6"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
          >

            <Card className="w-full max-w-sm bg-white p-6">

              <h3 className="mb-3 text-lg font-bold text-[#12130F]">
                Editar nombre de perfil
              </h3>

              <Input
                value={
                  pendingName
                }
                onChange={(
                  event
                ) =>
                  setPendingName(
                    event.target.value
                  )
                }
                placeholder="Nombre de perfil"
                className="mb-4"
              />

              <div className="flex gap-3">

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setShowNameModal(
                      false
                    )
                  }
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  className="bg-gradient-to-r from-[#386FA4] to-[#2d5a85] text-white"
                  onClick={() => {
                    if (
                      pendingName.trim()
                    ) {
                      onUpdateProfileName(
                        pendingName.trim()
                      );

                      setShowNameModal(
                        false
                      );
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


      {/* CAMBIAR AVATAR */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-6"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
          >

            <Card className="w-full max-w-md bg-white p-6">

              <div className="mb-4 flex items-center justify-between">

                <h3 className="text-lg font-bold text-[#12130F]">
                  Elegí tu avatar
                </h3>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setShowAvatarModal(
                      false
                    )
                  }
                >
                  Cerrar
                </Button>

              </div>


              <div className="grid grid-cols-3 gap-4">

                {AVATAR_OPTIONS.map(
                  (
                    option
                  ) => (
                    <button
                      key={
                        option.id
                      }
                      type="button"
                      className={`rounded-2xl border-2 p-2 transition ${
                        selectedAvatarId ===
                        option.id
                          ? "border-[#386FA4] bg-[#386FA4]/10"
                          : "border-transparent hover:border-[#386FA4]/40"
                      }`}
                      onClick={() => {
                        onUpdateAvatar(
                          option.id
                        );

                        setShowAvatarModal(
                          false
                        );
                      }}
                    >

                      <img
                        src={
                          option.src
                        }
                        alt={
                          option.label
                        }
                        className="w-full rounded-xl object-cover"
                      />

                      <p className="mt-2 text-xs font-semibold text-[#386FA4]">
                        {
                          option.label
                        }
                      </p>

                    </button>
                  )
                )}

              </div>
            </Card>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
