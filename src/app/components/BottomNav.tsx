import { motion } from "motion/react";
import { BookOpen, Gift, Home, ListTodo } from "lucide-react";

export type AppTab = "home" | "collection" | "tasks" | "store";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  activeTasks: number;
}

export function BottomNav({
  activeTab,
  onTabChange,
  activeTasks
}: BottomNavProps) {
  const tabs = [
    { id: "home" as AppTab, label: "Inicio", icon: Home },
    {
      id: "collection" as AppTab,
      label: "Colección",
      icon: BookOpen
    },
    {
      id: "tasks" as AppTab,
      label: "Tareas",
      icon: ListTodo,
      badge: activeTasks
    },
    {
      id: "store" as AppTab,
      label: "Tienda",
      icon: Gift
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[#386FA4]/20 bg-white shadow-2xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-1 flex-col items-center justify-center px-1 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-2xl bg-[#386FA4]/10"
                  transition={{
                    type: "spring",
                    duration: 0.5
                  }}
                />
              )}

              <div className="relative flex flex-col items-center gap-1">
                <div className="relative">
                  <Icon
                    className={`h-6 w-6 transition-colors ${
                      isActive
                        ? "text-[#386FA4]"
                        : "text-gray-400"
                    }`}
                  />

                  {tab.badge !== undefined &&
                    tab.badge > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500"
                      >
                        <span className="text-xs font-bold text-white">
                          {tab.badge > 9
                            ? "9+"
                            : tab.badge}
                        </span>
                      </motion.div>
                    )}
                </div>

                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "text-[#386FA4]"
                      : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
