import { motion } from "motion/react";
import { ArrowLeft, Star, TrendingUp, Award, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  rarity: "común" | "raro" | "épico" | "legendario";
  dateScanned: string;
  scanCount: number;
}

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
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

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  // Mock achievements related to this product
  const achievements = [
    {
      id: 1,
      title: "Primer Escaneo",
      description: "Escaneaste este producto por primera vez",
      unlocked: true,
      date: product.dateScanned
    },
    {
      id: 2,
      title: "Fan Número 1",
      description: "Escaneá este producto 5 veces",
      unlocked: product.scanCount >= 5,
      date: product.scanCount >= 5 ? new Date().toISOString() : null
    },
    {
      id: 3,
      title: "Súper Fan",
      description: "Escaneá este producto 10 veces",
      unlocked: product.scanCount >= 10,
      date: product.scanCount >= 10 ? new Date().toISOString() : null
    }
  ];

  const totalPoints = product.scanCount * 100;
  const totalXP = product.scanCount * 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Detalle del Producto</h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Product Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-white/95 backdrop-blur shadow-xl border-2 border-blue-200">
            <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${rarityColors[product.rarity]} flex items-center justify-center mb-4 shadow-lg`}>
              <Star className="w-24 h-24 text-white" />
            </div>
            
            <div className="text-center mb-4">
              <Badge className={`${rarityBadgeColors[product.rarity]} border mb-3`}>
                {product.rarity.toUpperCase()}
              </Badge>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{product.name}</h2>
              <p className="text-blue-600">{product.category}</p>
              <p className="text-xs text-gray-500 mt-2">Código: {product.barcode}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600">Veces escaneado</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{product.scanCount}</p>
              </Card>

              <Card className="p-3 bg-indigo-50 border-indigo-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-indigo-600">Primera vez</span>
                </div>
                <p className="text-sm font-bold text-indigo-900">
                  {new Date(product.dateScanned).toLocaleDateString('es-AR')}
                </p>
              </Card>
            </div>
          </Card>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-bold text-blue-900 mb-3">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-sm text-amber-700 font-semibold">Puntos</span>
              </div>
              <p className="text-3xl font-bold text-amber-900">{totalPoints}</p>
              <p className="text-xs text-amber-600 mt-1">Ganados con este producto</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-blue-700 font-semibold">Experiencia</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{totalXP}</p>
              <p className="text-xs text-blue-600 mt-1">XP total acumulado</p>
            </Card>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Logros Relacionados
          </h3>
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className={`p-4 ${
                  achievement.unlocked
                    ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200"
                    : "bg-gray-50 border-2 border-gray-200"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-purple-400 to-pink-500"
                        : "bg-gray-300"
                    }`}>
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold mb-1 ${
                        achievement.unlocked ? "text-purple-900" : "text-gray-500"
                      }`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-sm ${
                        achievement.unlocked ? "text-purple-600" : "text-gray-400"
                      }`}>
                        {achievement.description}
                      </p>
                      {achievement.unlocked && achievement.date && (
                        <p className="text-xs text-purple-500 mt-1">
                          Desbloqueado: {new Date(achievement.date).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>
                    {achievement.unlocked && (
                      <Badge className="bg-purple-500 text-white border-0">
                        ✓
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fun Fact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-bold text-cyan-900 mb-1">Dato Curioso</h4>
                <p className="text-sm text-cyan-700">
                  Este producto representa el {((product.scanCount / 10) * 100).toFixed(1)}% de tu actividad de escaneo total. ¡Seguí coleccionando!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}