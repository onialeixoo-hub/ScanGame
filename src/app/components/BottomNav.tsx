import { motion } from "motion/react";
import { Home, BookOpen, ListTodo } from "lucide-react";

type Tab = "home" | "collection" | "tasks";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  activeTasks: number;
}

export function BottomNav({ activeTab, onTabChange, activeTasks }: BottomNavProps) {
  const tabs = [
    { id: "home" as Tab, label: "Inicio", icon: Home },
    { id: "collection" as Tab, label: "Colección", icon: BookOpen },
    { id: "tasks" as Tab, label: "Tareas", icon: ListTodo, badge: activeTasks }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#386FA4]/30 shadow-2xl z-50">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-2 px-3"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#386FA4]/10 rounded-2xl"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}

              {/* Icon and label */}
              <div className="relative flex flex-col items-center gap-1">
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-[#386FA4]" : "text-gray-400"
                    }`}
                  />
                  {/* Badge for tasks */}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-white text-xs font-bold">
                        {tab.badge > 9 ? "9+" : tab.badge}
                      </span>
                    </motion.div>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? "text-[#386FA4]" : "text-gray-400"
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