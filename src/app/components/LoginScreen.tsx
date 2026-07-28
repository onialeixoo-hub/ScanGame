import { useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/firebase";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import type { User } from "@/app/types";
import logo from "@/assets/logo-scangame.svg";

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

interface FirebaseUserProfile {
  name?: string;
  email?: string;
  role?: "admin" | "user";
}

const USER_EMAILS: Record<string, string> = {
  marti: "onitaaleixo@yahoo.com",
  ona: "onialeixoo@gmail.com"
};

export function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const email = USER_EMAILS[normalizedUsername];

    if (!normalizedUsername || !password) {
      setError("Completá el usuario y la contraseña");
      return;
    }

    if (!email) {
      setError("El usuario no existe");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const profileReference = doc(
        db,
        "users",
        credential.user.uid
      );

      const profileSnapshot = await getDoc(profileReference);

      if (!profileSnapshot.exists()) {
        await signOut(auth);
        setError("La cuenta existe, pero no tiene un perfil en Firestore");
        return;
      }

      const profile =
        profileSnapshot.data() as FirebaseUserProfile;

      if (profile.role !== "admin" && profile.role !== "user") {
        await signOut(auth);
        setError("El perfil no tiene un rol válido");
        return;
      }

      const previousUserWithSameRole = users.find(
        (user) => user.role === profile.role
      );

      const loggedUser: User = {
        id: credential.user.uid,
        name: profile.name ?? "Usuario",
        username: normalizedUsername,
        pin: "",
        role: profile.role,
        avatar: previousUserWithSameRole?.avatar ?? ""
      };

      onLogin(loggedUser);
    } catch {
      await signOut(auth).catch(() => undefined);
      setError("Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E2DADB] flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6 bg-white/95 border-2 border-[#386FA4]/20 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mx-auto mb-3 shadow-lg border border-[#386FA4]/20">
            <img
              src={logo}
              alt="ScanGame"
              className="w-20 h-20 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-[#12130F]">
            Bienvenido a ScanGame
          </h1>

          <p className="text-sm text-[#386FA4]">
            Ingresá con tu usuario
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#386FA4] mb-1 block">
              Usuario
            </label>

            <div className="relative">
              <UserRound className="w-4 h-4 text-[#386FA4] absolute left-3 top-3" />

              <Input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="ona o marti"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="pl-9 border-2 border-[#386FA4]/30 focus:border-[#386FA4]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#386FA4] mb-1 block">
              Contraseña
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#386FA4] absolute left-3 top-3" />

              <Input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSubmit();
                  }
                }}
                placeholder="••••••"
                autoComplete="current-password"
                className="pl-9 border-2 border-[#386FA4]/30 focus:border-[#386FA4]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-semibold">
              {error}
            </p>
          )}

          <Button
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#386FA4] to-[#2d5a85] hover:from-[#2d5a85] hover:to-[#386FA4] text-white font-semibold"
          >
            {isLoading ? "Ingresando..." : "Entrar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
