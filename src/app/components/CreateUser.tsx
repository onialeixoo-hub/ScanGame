import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Sparkles, Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

interface CreateUserProps {
  onComplete: (username: string, avatar: string) => void;
}

const avatars = [
  { id: "1", emoji: "🎮", name: "Gamer" },
  { id: "2", emoji: "🎯", name: "Objetivo" },
  { id: "3", emoji: "🚀", name: "Cohete" },
  { id: "4", emoji: "⭐", name: "Estrella" },
  { id: "5", emoji: "🏆", name: "Campeón" },
  { id: "6", emoji: "🎨", name: "Artista" },
  { id: "7", emoji: "🌟", name: "Brillante" },
  { id: "8", emoji: "💎", name: "Diamante" },
  { id: "9", emoji: "🎪", name: "Circo" },
  { id: "10", emoji: "🎭", name: "Teatro" },
  { id: "11", emoji: "🎸", name: "Rockstar" },
  { id: "12", emoji: "🎲", name: "Suerte" }
];

export function CreateUser({ onComplete }: CreateUserProps) {
  const [step, setStep] = useState<"welcome" | "username" | "avatar">("welcome");
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  const handleStartClick = () => {
    setStep("username");
  };

  const handleUsernameSubmit = () => {
    if (username.trim().length >= 3) {
      setStep("avatar");
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleComplete = () => {
    if (selectedAvatar) {
      const avatar = avatars.find(a => a.id === selectedAvatar);
      onComplete(username, avatar?.emoji || "🎮");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* Welcome Screen */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mb-8"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl">
                  <Sparkles className="w-16 h-16 text-white" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-blue-900 mb-4"
              >
                Bienvenido a<br />Scan Quest
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-blue-700 mb-8 text-lg"
              >
                ¡Descubrí, coleccioná y ganá puntos escaneando productos!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleStartClick}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-bold shadow-xl rounded-2xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    ¡Comenzar Aventura!
                  </motion.div>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 grid grid-cols-3 gap-4"
              >
                <Card className="p-4 text-center bg-white/80">
                  <p className="text-3xl mb-1">📱</p>
                  <p className="text-xs text-blue-600">Escanea</p>
                </Card>
                <Card className="p-4 text-center bg-white/80">
                  <p className="text-3xl mb-1">🎯</p>
                  <p className="text-xs text-blue-600">Colecciona</p>
                </Card>
                <Card className="p-4 text-center bg-white/80">
                  <p className="text-3xl mb-1">🏆</p>
                  <p className="text-xs text-blue-600">Progresa</p>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Username Screen */}
          {step === "username" && (
            <motion.div
              key="username"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="p-8 bg-white/95 backdrop-blur shadow-2xl border-2 border-blue-200">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">¿Cómo te llamás?</h2>
                  <p className="text-blue-600 text-sm">Elegí tu nombre de usuario</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Tu nombre de usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleUsernameSubmit()}
                      className="h-14 text-lg text-center border-2 border-blue-200 focus:border-blue-500"
                      maxLength={20}
                      autoFocus
                    />
                    {username.length > 0 && username.length < 3 && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Mínimo 3 caracteres
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleUsernameSubmit}
                    disabled={username.trim().length < 3}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Avatar Selection Screen */}
          {step === "avatar" && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="p-8 bg-white/95 backdrop-blur shadow-2xl border-2 border-blue-200">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">¡Hola, {username}! 👋</h2>
                  <p className="text-blue-600 text-sm">Elegí tu avatar</p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {avatars.map((avatar, index) => (
                    <motion.button
                      key={avatar.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAvatarSelect(avatar.id)}
                      className={`aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all ${
                        selectedAvatar === avatar.id
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl scale-110 ring-4 ring-blue-300"
                          : "bg-blue-50 hover:bg-blue-100 hover:scale-105"
                      }`}
                    >
                      {avatar.emoji}
                      {selectedAvatar === avatar.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={!selectedAvatar}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  ¡Empezar a Jugar!
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
