import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Plus, Check, Star, Sparkles, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";

interface Task {
  id: string;
  title: string;
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  completedDate?: string;
}

interface TasksProps {
  tasks: Task[];
  onBack: () => void;
  onAddTask: (task: Omit<Task, "id" | "completed">) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const predefinedTasks = [
  { title: "Hacer la cama", xp: 25, points: 50 },
  { title: "Lavar los platos", xp: 30, points: 60 },
  { title: "Ordenar mi cuarto", xp: 50, points: 100 },
  { title: "Hacer la tarea", xp: 75, points: 150 },
  { title: "Leer 30 minutos", xp: 40, points: 80 },
  { title: "Hacer ejercicio", xp: 60, points: 120 },
  { title: "Ayudar en casa", xp: 35, points: 70 },
  { title: "Estudiar 1 hora", xp: 100, points: 200 }
];

export function Tasks({ tasks, onBack, onAddTask, onCompleteTask, onDeleteTask }: TasksProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskXP, setNewTaskXP] = useState(25);
  const [showPredefined, setShowPredefined] = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleAddCustomTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask({
        title: newTaskTitle,
        xpReward: newTaskXP,
        pointsReward: newTaskXP * 2
      });
      setNewTaskTitle("");
      setNewTaskXP(25);
      setShowAddTask(false);
    }
  };

  const handleAddPredefinedTask = (task: typeof predefinedTasks[0]) => {
    onAddTask({
      title: task.title,
      xpReward: task.xp,
      pointsReward: task.points
    });
    setShowPredefined(false);
  };

  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-6 py-6 shadow-lg">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Mis Tareas</h1>
          <p className="text-white/80 text-sm">Completá tareas y ganá recompensas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/10 backdrop-blur border-0">
            <p className="text-white/80 text-xs mb-1">Activas</p>
            <p className="text-2xl font-bold text-white">{activeTasks.length}</p>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur border-0">
            <p className="text-white/80 text-xs mb-1">Completadas hoy</p>
            <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
          </Card>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Add Task Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              setShowPredefined(!showPredefined);
              setShowAddTask(false);
            }}
            className="h-14 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] hover:from-[#2d5a85] hover:to-[#386FA4] text-white font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Tareas Sugeridas
          </Button>
          <Button
            onClick={() => {
              setShowAddTask(!showAddTask);
              setShowPredefined(false);
            }}
            variant="outline"
            className="h-14 border-2 border-[#386FA4] text-[#386FA4] hover:bg-[#386FA4]/10 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Tarea
          </Button>
        </div>

        {/* Predefined Tasks */}
        <AnimatePresence>
          {showPredefined && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-4 bg-white/90 backdrop-blur border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">Seleccioná una tarea:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {predefinedTasks.map((task, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAddPredefinedTask(task)}
                      className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-left transition-colors"
                    >
                      <p className="text-sm font-semibold text-blue-900 mb-1">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600">+{task.xp} XP</span>
                        <span className="text-amber-600">+{task.points} pts</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Task Form */}
        <AnimatePresence>
          {showAddTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-4 bg-white/90 backdrop-blur border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">Nueva Tarea</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-blue-700 mb-1 block">Nombre de la tarea</label>
                    <Input
                      type="text"
                      placeholder="Ej: Hacer la cama"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddCustomTask()}
                      className="border-2 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-blue-700 mb-1 block">
                      Experiencia: {newTaskXP} XP (Puntos: {newTaskXP * 2})
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={newTaskXP}
                      onChange={(e) => setNewTaskXP(Number(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomTask}
                    disabled={!newTaskTitle.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Agregar Tarea
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-blue-900 mb-3">Tareas Pendientes</h2>
            <div className="space-y-3">
              {activeTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="p-4 bg-white/90 backdrop-blur border-2 border-blue-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="w-10 h-10 rounded-full border-2 border-blue-400 hover:bg-blue-500 hover:border-blue-500 transition-colors flex items-center justify-center group flex-shrink-0 mt-1"
                      >
                        <Check className="w-6 h-6 text-blue-400 group-hover:text-white" />
                      </button>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-900 mb-1">{task.title}</h3>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            +{task.xpReward} XP
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-700 border-0">
                            <Star className="w-3 h-3 mr-1" />
                            +{task.pointsReward} pts
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => onDeleteTask(task.id)}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">¡Agregá tus primeras tareas!</h3>
            <p className="text-blue-600">Completá tareas y ganá XP para subir de nivel</p>
          </motion.div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-blue-900 mb-3">Completadas Hoy 🎉</h2>
            <div className="space-y-2">
              {completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 text-sm line-through opacity-75">
                          {task.title}
                        </p>
                        <p className="text-xs text-green-600">
                          +{task.xpReward} XP • +{task.pointsReward} puntos
                        </p>
                      </div>
                      <Button
                        onClick={() => onDeleteTask(task.id)}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}