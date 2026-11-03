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
    barcode: string; name: string; brand?: string; imageUrl?: string;
    appCategory: string; rarity: ProductRarity; xpReward: number; xpBase: number;
    isNew: boolean; isDuplicateToday: boolean; bonusDaily: number; bonusStreak: number;
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

export function ScanResult({ product, onAddToCollection, onRescan, onGoHome }: ScanResultProps) {
  const unknown = !product.name.trim() || product.name.toLowerCase().includes("producto sin nombre");
  const [name, setName] = useState(unknown ? "" : product.name);
  const displayName = name.trim() || product.name || `Producto ${product.barcode}`;
  const points = product.isDuplicateToday ? 0 : rarityBasePoints[product.rarity];
  const canAdd = !product.isDuplicateToday && (!unknown || !!name.trim());

  const addProduct = () => {
    if (!canAdd) return;
    if (name.trim()) product.name = name.trim();
    onAddToCollection();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6">
      <Card className="w-full max-w-md border-2 border-blue-200 bg-white/95 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-4">
          <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${colors[product.rarity]}`}>
            {product.imageUrl ? <img src={product.imageUrl} alt={displayName} className="h-full w-full object-cover" /> : <Star className="h-8 w-8 text-white" />}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-blue-900">{displayName}</h2>
            {product.brand && <p className="text-sm text-blue-600">{product.brand}</p>}
            <p className="text-xs text-gray-500">Código: {product.barcode}</p>
          </div>
        </div>

        {unknown && (
          <div className="mb-4 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-sm font-bold text-blue-900">No encontramos el nombre</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Pepsi 500 ml" maxLength={60} autoFocus />
            {!name.trim() && <p className="mt-2 text-xs font-semibold text-amber-600">Poné un nombre para continuar.</p>}
          </div>
        )}

        <div className="mb-4 flex justify-between">
          <Badge>{product.rarity.toUpperCase()}</Badge>
          <Badge className="bg-slate-100 text-slate-700">{product.appCategory}</Badge>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <Card className="p-3"><Sparkles className="h-4 w-4" /><p className="text-xs">XP base</p><b>{product.xpBase}</b></Card>
          <Card className="p-3"><Star className="h-4 w-4" /><p className="text-xs">XP total</p><b>{product.xpReward}</b></Card>
          <Card className="p-3"><Coins className="h-4 w-4" /><p className="text-xs">Puntos</p><b>+{points}</b></Card>
        </div>

        {product.isDuplicateToday && <p className="mb-4 text-sm font-semibold text-red-500">Ya escaneaste este producto hoy.</p>}

        <div className="space-y-3">
          <Button onClick={addProduct} disabled={!canAdd} className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white"><Plus className="mr-2 h-5 w-5" />Añadir a colección</Button>
          <Button onClick={onRescan} variant="outline" className="w-full"><RefreshCw className="mr-2 h-5 w-5" />Volver a escanear</Button>
          <Button onClick={onGoHome} variant="ghost" className="w-full"><Home className="mr-2 h-5 w-5" />Ir a inicio</Button>
        </div>
      </Card>
    </div>
  );
}
