import { Home, Plus, RefreshCw, Sparkles, Star } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import type { ProductRarity } from "@/app/types";

interface ScanResultProps {
  product: {
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    appCategory: string;
    rarity: ProductRarity;
    xpReward: number;
    xpBase: number;
    isNew: boolean;
    isDuplicateToday: boolean;
    bonusDaily: number;
    bonusStreak: number;
  };
  onAddToCollection: () => void;
  onRescan: () => void;
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

export function ScanResult({ product, onAddToCollection, onRescan, onGoHome }: ScanResultProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="p-6 bg-white/95 backdrop-blur shadow-2xl border-2 border-blue-200">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rarityColors[product.rarity]} flex items-center justify-center shadow-lg overflow-hidden`}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Star className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-blue-900">{product.name}</h2>
              {product.brand && <p className="text-sm text-blue-600">{product.brand}</p>}
              <p className="text-xs text-gray-500">Código: {product.barcode}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <Badge className={`${rarityBadgeColors[product.rarity]} border`}>
              {product.rarity.toUpperCase()}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 border-0">
              {product.appCategory}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700 font-semibold">XP base</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{product.xpBase}</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700 font-semibold">XP total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{product.xpReward}</p>
            </Card>
          </div>

          <div className="space-y-1 text-sm text-blue-700 mb-4">
            <p>{product.isNew ? "Producto nuevo ✅" : "Producto repetido (15%)"}</p>
            {product.bonusDaily > 0 && <p>Bonus primer escaneo del día: +{product.bonusDaily} XP</p>}
            {product.bonusStreak > 0 && <p>Bonus racha diaria: +{product.bonusStreak} XP</p>}
            {product.isDuplicateToday && (
              <p className="text-red-500 font-semibold">
                Ya escaneaste este producto hoy. Probá mañana.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onAddToCollection}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold h-12"
              disabled={product.isDuplicateToday}
            >
              <Plus className="w-5 h-5 mr-2" />
              Añadir a colección
            </Button>
            <Button
              onClick={onRescan}
              variant="outline"
              className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Volver a escanear
            </Button>
            <Button
              onClick={onGoHome}
              variant="ghost"
              className="w-full text-blue-700 hover:bg-blue-50 font-semibold"
            >
              <Home className="w-5 h-5 mr-2" />
              Ir a inicio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
