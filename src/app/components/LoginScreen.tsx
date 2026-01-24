import { useState } from "react";
import { Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import type { User } from "@/app/types";
import logo from "@/assets/logo-scangame.svg";

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const matchedUser = users.find(
      (user) => user.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matchedUser || matchedUser.pin !== pin) {
      setError("Usuario o PIN incorrecto");
      return;
    }

    setError("");
    onLogin(matchedUser);
  };

  const adminMatch = users.find((user) => user.role === "admin");
  const showForgotPin =
    adminMatch && adminMatch.username.toLowerCase() === username.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-[#E2DADB] flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6 bg-white/95 border-2 border-[#386FA4]/20 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mx-auto mb-3 shadow-lg border border-[#386FA4]/20">
            <img src={logo} alt="ScanGame" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#12130F]">Bienvenido a ScanGame</h1>
          <p className="text-sm text-[#386FA4]">Ingresá con tu usuario y PIN</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#386FA4] mb-1 block">
              Usuario
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#386FA4] absolute left-3 top-3" />
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ej: tomi"
                className="pl-9 border-2 border-[#386FA4]/30 focus:border-[#386FA4]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#386FA4] mb-1 block">
              PIN (4 dígitos)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#386FA4] absolute left-3 top-3" />
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "");
                  setPin(nextValue);
                }}
                placeholder="••••"
                className="pl-9 border-2 border-[#386FA4]/30 focus:border-[#386FA4]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] hover:from-[#2d5a85] hover:to-[#386FA4] text-white font-semibold"
          >
            Entrar
          </Button>

          {showForgotPin && (
            <button
              type="button"
              className="text-xs text-[#386FA4] underline block mx-auto"
            >
              ¿Olvidaste tu PIN?
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
