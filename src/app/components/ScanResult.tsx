import { motion } from "motion/react";
import { Star, Sparkles, Plus, Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface ScanResultProps {
  product: {
    name: string;
    category: string;
    barcode: string;
    points: number;
    xp: number;
    rarity: "común" | "raro" | "épico" | "legendario";
  };
  isNewProduct: boolean;
  onAddToCollection: () => void;
  onGoHome: () => void;
}

const rarityColors = {
  común: "from-gray-400 to-gray-500",
  raro: "from-blue-400 to-blue-600",
  épico: "from-purple-400 to-purple-600",
  legendario: "from-amber-400 to-orange-500"
};

const rarityBadgeColors = {
  común: "bg-gray-100 text-gray-700 border-gray-300",
  raro: "bg-blue-100 text-blue-700 border-blue-300",
  épico: "bg-purple-100 text-purple-700 border-purple-300",
  legendario: "bg-amber-100 text-amber-700 border-amber-300"
};

export function ScanResult({
  product,
  isNewProduct,
  onAddToCollection,
  onGoHome
}: ScanResultProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6 flex flex-col items-center justify-center">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="mb-8"
      >
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${rarityColors[product.rarity]} flex items-center justify-center shadow-2xl`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {isNewProduct ? (
              <Sparkles className="w-16 h-16 text-white" />
            ) : (
              <Star className="w-16 h-16 text-white fill-white" />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Confetti Effect */}
      {isNewProduct && (
        <>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: ["#3b82f6", "#6366f1", "#8b5cf6", "#fbbf24", "#f59e0b"][i % 5],
                top: "50%",
                left: "50%"
              }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 1],
                x: Math.cos((i / 12) * Math.PI * 2) * 200,
                y: Math.sin((i / 12) * Math.PI * 2) * 200,
                opacity: [1, 1, 0]
              }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          ))}
        </>
      )}

      {/* Result Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="p-6 bg-white/95 backdrop-blur shadow-2xl border-2 border-blue-200">
          <div className="text-center mb-6">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-blue-900 mb-2"
            >
              {isNewProduct ? "¡Nuevo Descubrimiento!" : "¡Producto Escaneado!"}
            </motion.h2>
            <Badge className={`${rarityBadgeColors[product.rarity]} border`}>
              {product.rarity.toUpperCase()}
            </Badge>
          </div>

          {/* Product Info */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-1">{product.name}</h3>
              <p className="text-sm text-blue-600">{product.category}</p>
              <p className="text-xs text-gray-500 mt-1">Código: {product.barcode}</p>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold text-amber-700">+{product.points}</span>
                  </div>
                  <p className="text-xs text-amber-600 text-center">Puntos</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-700">+{product.xp}</span>
                  </div>
                  <p className="text-xs text-blue-600 text-center">Experiencia</p>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Achievements */}
          {isNewProduct && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6"
            >
              <Card className="p-3 bg-purple-50 border-2 border-purple-200">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-900">¡Logro Desbloqueado!</p>
                    <p className="text-xs text-purple-600">Primera vez escaneando este producto</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                onClick={onAddToCollection}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold h-12"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar a Colección
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                onClick={onGoHome}
                variant="outline"
                className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
              >
                <Home className="w-5 h-5 mr-2" />
                Volver al Inicio
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}