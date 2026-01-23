import { motion } from "motion/react";
import { ArrowLeft, Star, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  rarity: "común" | "raro" | "épico" | "legendario";
  dateScanned: string;
  scanCount: number;
}

interface CollectionProps {
  products: Product[];
  onBack: () => void;
  onProductClick: (product: Product) => void;
}

const categories = [
  { name: "Alimentos", total: 50, collected: 0, color: "blue" },
  { name: "Bebidas", total: 30, collected: 0, color: "indigo" },
  { name: "Higiene", total: 25, collected: 0, color: "purple" },
  { name: "Limpieza", total: 20, collected: 0, color: "cyan" },
  { name: "Otros", total: 25, collected: 0, color: "sky" }
];

const rarityColors = {
  común: "from-gray-400 to-gray-500",
  raro: "from-blue-400 to-blue-600",
  épico: "from-purple-400 to-purple-600",
  legendario: "from-amber-400 to-orange-500"
};

const categoryColors: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500"
};

export function Collection({ products, onBack, onProductClick }: CollectionProps) {
  const totalProducts = 150;
  const collectedProducts = products.length;
  const completionPercentage = (collectedProducts / totalProducts) * 100;

  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-6 py-6 shadow-lg">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Mi Colección</h1>
          <p className="text-white/80 text-sm">{collectedProducts} de {totalProducts} productos</p>
        </div>

        {/* Progress */}
        <Card className="p-4 bg-white/10 backdrop-blur border-0">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/90">Completado</span>
            <span className="text-white font-semibold">{completionPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2 bg-white/20" />
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 pt-6">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="products" className="flex-1">Productos</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">Categorías</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {collectedProducts === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">¡Comenzá tu colección!</h3>
                <p className="text-blue-600 mb-6">Escaneá tu primer producto para empezar</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      onClick={() => onProductClick(product)}
                      className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-white/90 backdrop-blur border-2 border-blue-200"
                    >
                      <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${rarityColors[product.rarity]} flex items-center justify-center mb-3 shadow-md`}>
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-semibold text-blue-900 text-sm mb-1 line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-xs text-blue-600 mb-2">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="text-xs bg-blue-100 text-blue-700">
                          x{product.scanCount}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            {categories.map((category, index) => {
              const percentage = category.total > 0 ? (category.collected / category.total) * 100 : 0;
              
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-5 bg-white/90 backdrop-blur border-2 border-blue-200">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-full ${categoryColors[category.color]} flex items-center justify-center shadow-md`}>
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-900">{category.name}</h3>
                        <p className="text-sm text-blue-600">
                          {category.collected} de {category.total} productos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-900">{percentage.toFixed(0)}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2 bg-blue-100" />
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Collection Milestones */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h3 className="text-lg font-bold text-blue-900 mb-4">Hitos de Colección</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { goal: 10, label: "Principiante", unlocked: collectedProducts >= 10 },
              { goal: 50, label: "Coleccionista", unlocked: collectedProducts >= 50 },
              { goal: 100, label: "Maestro", unlocked: collectedProducts >= 100 }
            ].map((milestone) => (
              <Card
                key={milestone.goal}
                className={`p-3 text-center ${
                  milestone.unlocked
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300"
                    : "bg-gray-50 border-2 border-gray-200"
                }`}
              >
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  milestone.unlocked ? "bg-amber-500" : "bg-gray-300"
                }`}>
                  {milestone.unlocked ? (
                    <Star className="w-6 h-6 text-white fill-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-white" />
                  )}
                </div>
                <p className={`text-xs font-semibold ${
                  milestone.unlocked ? "text-amber-900" : "text-gray-500"
                }`}>
                  {milestone.label}
                </p>
                <p className={`text-xs ${
                  milestone.unlocked ? "text-amber-600" : "text-gray-400"
                }`}>
                  {milestone.goal} productos
                </p>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}