import { useState } from "react";
import { Coins, Home, Plus, RefreshCw, Sparkles, Star } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { rarityBasePoints } from "@/app/lib/products";
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

const colors = {
  común: "from-gray-400 to-gray-500",
  raro: "from-blue-400 to-blue-600",
  épico: "from-purple-400 to-purple-600",
  legendario: "from-amber-400 to-orange-500"
};

export function ScanResult({
  product,
  onAddToCollection,
  onRescan,
  onGoHome
}: ScanResultProps) {
  const unknownProduct =
    !product.name.trim() ||
    product.name.toLowerCase().includes("producto sin nombre") ||
    product.name.toLowerCase().includes("barcode");

  const [customName, setCustomName] = useState(unknownProduct ? "" : product.name);
  const cleanCustomName = customName.trim();
  const displayName = cleanCustomName || product.name || `Producto ${product.barcode}`;
  const points = product.isDuplicateToday ? 0 : rarityBasePoints[product.rarity];
  const canAdd = !product.isDuplicateToday && (!unknownProduct || cleanCustomName.length > 0);

  const addProduct = () => {
    if (!canAdd) return;
    if (cleanCustomName) product.name = cleanCustomName;
    onAddToCollection();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-5">
      <Card className="w-full max-w-md border-2 border-blue-200 bg-white/95 p-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${colors[product.rarity]} shadow-lg`}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <Star className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-bold text-blue-900">{displayName}</h2>
            {product.brand && <p className="text-sm text-blue-600">{product.brand}</p>}
            <p className="mt-1 text-xs text-gray-500">Código: {product.barcode}</p>
          </div>
        </div>

        {unknownProduct && (
          <Card className="mt-5 border-2 border-violet-200 bg-violet-50 p-4">
            <p className="font-bold text-violet-900">¿Cómo se llama este producto?</p>
            <p className="mb-3 mt-1 text-sm text-violet-700">
              No lo encontramos en la base. Poné el nombre y lo guardamos así en tu colección.
            </p>
            <Input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Ej: Alfajor Jorgito blanco"
              maxLength={60}
              autoFocus
              className="bg-white"
            />
            {!cleanCustomName && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                Escribí un nombre para poder añadirlo.
              </p>
            )}
          </Card>
        )}

        <div className="mt-5 flex items-center justify-between">
          <Badge>{product.rarity.toUpperCase()}</Badge>
          <Badge className="bg-slate-100 text-slate-700">{product.appCategory}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Card className="border-amber-200 bg-amber-50 p-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="mt-1 text-xs font-semibold text-amber-700">XP base</p>
            <p className="text-xl font-bold text-amber-900">{product.xpBase}</p>
          </Card>
          <Card className="border-blue-200 bg-blue-50 p-3">
            <Star className="h-4 w-4 text-blue-500" />
            <p className="mt-1 text-xs font-semibold text-blue-700">XP total</p>
            <p className="text-xl font-bold text-blue-900">{product.xpReward}</p>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50 p-3">
            <Coins className="h-4 w-4 text-emerald-600" />
            <p className="mt-1 text-xs font-semibold text-emerald-700">Puntos</p>
            <p className="text-xl font-bold text-emerald-900">+{points}</p>
          </Card>
        </div>

        <div className="mt-4 space-y-1 text-sm text-blue-700">
          <p>{product.isNew ? "Producto nuevo ✅" : "Producto repetido (15%)"}</p>
          {product.bonusDaily > 0 && <p>Bonus primer escaneo del día: +{product.bonusDaily} XP</p>}
          {product.bonusStreak > 0 && <p>Bonus racha diaria: +{product.bonusStreak} XP</p>}
          {product.isDuplicateToday && (
            <p className="font-semibold text-red-500">Ya escaneaste este producto hoy.</p>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <Button
            onClick={addProduct}
            disabled={!canAdd}
            className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold text-white"
          >
            <Plus className="mr-2 h-5 w-5" />
            Añadir a colección
          </Button>
          <Button onClick={onRescan} variant="outline" className="w-full border-2 border-blue-300 font-semibold text-blue-700">
            <RefreshCw className="mr-2 h-5 w-5" />
            Volver a escanear
          </Button>
          <Button onClick={onGoHome} variant="ghost" className="w-full font-semibold text-blue-700">
            <Home className="mr-2 h-5 w-5" />
            Ir a inicio
          </Button>
        </div>
      </Card>
    </div>
  );
}
