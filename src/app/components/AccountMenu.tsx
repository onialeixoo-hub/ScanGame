import { AnimatePresence, motion } from "motion/react";
import {
  LogOut,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import type { User, UserProgress } from "@/app/types";
import { getAvatarSrc } from "@/app/lib/avatar-options";

interface AccountMenuProps {
  open: boolean;
  user: User;
  progress: UserProgress;
  productsCount: number;
  categoriesCount: number;
  onClose: () => void;
  onLogout: () => void;
}

export function AccountMenu({
  open,
  user,
  progress,
  productsCount,
  categoriesCount,
  onClose,
  onLogout
}: AccountMenuProps) {
  const isAdmin = user.role === "admin";
  const avatarSrc = getAvatarSrc(user.avatar, user.role);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="flex-1 bg-black/45"
            onClick={onClose}
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
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`Avatar de ${user.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : isAdmin ? (
                    <ShieldCheck className="m-3 h-8 w-8 text-white" />
                  ) : (
                    <UserRound className="m-3 h-8 w-8 text-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{user.name}</p>
                  <p className="text-xs text-white/80">
                    {isAdmin ? "Cuenta administradora" : "Modo aventura"}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
                aria-label="Cerrar menú"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {isAdmin ? (
              <Card className="border-white/20 bg-white/95 p-4 text-[#12130F]">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#386FA4]/10 p-3">
                    <ShieldCheck className="h-6 w-6 text-[#386FA4]" />
                  </div>
                  <div>
                    <p className="font-bold">Modo administrador</p>
                    <p className="text-sm text-[#386FA4]">
                      Podés gestionar tareas y aprobaciones.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">Puntos</p>
                  <p className="text-lg font-bold">{progress.points}</p>
                </Card>

                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">Racha</p>
                  <p className="text-lg font-bold">{progress.streak} días</p>
                </Card>

                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">Productos</p>
                  <p className="text-lg font-bold">{productsCount}</p>
                </Card>

                <Card className="bg-white/95 p-3 text-[#12130F]">
                  <p className="text-xs text-[#386FA4]">Categorías</p>
                  <p className="text-lg font-bold">{categoriesCount}</p>
                </Card>
              </div>
            )}

            <div className="mt-auto pt-6">
              <Button
                type="button"
                className="w-full bg-white text-[#386FA4] hover:bg-white/90"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir de la cuenta
              </Button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
