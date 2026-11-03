import { motion } from "motion/react";
import {
  BookOpen,
  Gift,
  Home,
  ListTodo,
  ScanLine
} from "lucide-react";

export type AppTab =
  | "home"
  | "collection"
  | "tasks"
  | "store";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  activeTasks: number;
}

interface NavItemProps {
  id: AppTab;
  label: string;
  icon: typeof Home;
  activeTab: AppTab;
  badge?: number;
  onClick: () => void;
}

function NavItem({
  id,
  label,
  icon: Icon,
  activeTab,
  badge,
  onClick
}: NavItemProps) {
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-w-0 flex-col items-center justify-center px-1 py-2"
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-x-1 inset-y-0 rounded-2xl bg-[#386FA4]/10"
          transition={{
            type: "spring",
            duration: 0.45
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="relative">
          <Icon
            className={`h-6 w-6 transition-colors ${
              isActive
                ? "text-[#386FA4]"
                : "text-slate-400"
            }`}
          />

          {badge !== undefined &&
            badge > 0 && (
              <motion.div
                initial={{
                  scale: 0
                }}
                animate={{
                  scale: 1
                }}
                className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 shadow-md"
              >
                <span className="text-[10px] font-bold text-white">
                  {badge > 9
                    ? "9+"
                    : badge}
                </span>
              </motion.div>
            )}
        </div>

        <span
          className={`truncate text-[10px] font-bold transition-colors ${
            isActive
              ? "text-[#386FA4]"
              : "text-slate-400"
          }`}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

export function BottomNav({
  activeTab,
  onTabChange,
  activeTasks
}: BottomNavProps) {
  const openScanner = () => {
    onTabChange("home");

    let attempts = 0;

    const tryOpeningScanner =
      () => {
        const trigger =
          document.querySelector<HTMLButtonElement>(
            "[data-scangame-scan-trigger]"
          );

        if (trigger) {
          trigger.click();
          return;
        }

        attempts += 1;

        if (attempts < 10) {
          window.setTimeout(
            tryOpeningScanner,
            50
          );
        }
      };

    window.setTimeout(
      tryOpeningScanner,
      0
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#386FA4]/15 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="mx-auto max-w-md px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 items-end">

          <NavItem
            id="home"
            label="Inicio"
            icon={Home}
            activeTab={
              activeTab
            }
            onClick={() =>
              onTabChange(
                "home"
              )
            }
          />

          <NavItem
            id="collection"
            label="Colección"
            icon={BookOpen}
            activeTab={
              activeTab
            }
            onClick={() =>
              onTabChange(
                "collection"
              )
            }
          />

          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={
                openScanner
              }
              aria-label="Escanear producto"
              className="relative -top-5 flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-[#386FA4] to-[#244d73] text-white shadow-[0_8px_25px_rgba(56,111,164,0.45)] transition active:scale-95"
            >
              <ScanLine className="h-7 w-7" />

              <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-wide">
                Scan
              </span>

              <span className="absolute inset-1 rounded-full border border-white/20" />
            </button>
          </div>

          <NavItem
            id="tasks"
            label="Tareas"
            icon={ListTodo}
            activeTab={
              activeTab
            }
            badge={
              activeTasks
            }
            onClick={() =>
              onTabChange(
                "tasks"
              )
            }
          />

          <NavItem
            id="store"
            label="Tienda"
            icon={Gift}
            activeTab={
              activeTab
            }
            onClick={() =>
              onTabChange(
                "store"
              )
            }
          />

        </div>
      </div>
    </div>
  );
}
