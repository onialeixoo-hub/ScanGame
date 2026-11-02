import {
  Coins,
  Home,
  Plus,
  RefreshCw,
  Sparkles,
  Star
} from "lucide-react";

import {
  Badge
} from "@/app/components/ui/badge";

import {
  Button
} from "@/app/components/ui/button";

import {
  Card
} from "@/app/components/ui/card";

import {
  rarityBasePoints
} from "@/app/lib/products";

import type {
  ProductRarity
} from "@/app/types";

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
  común:
    "from-gray-400 to-gray-500",

  raro:
    "from-blue-400 to-blue-600",

  épico:
    "from-purple-400 to-purple-600",

  legendario:
    "from-amber-400 to-orange-500"
};

const rarityBadgeColors = {
  común:
    "bg-gray-100 text-gray-700 border-gray-300",

  raro:
    "bg-blue-100 text-blue-700 border-blue-300",

  épico:
    "bg-purple-100 text-purple-700 border-purple-300",

  legendario:
    "bg-amber-100 text-amber-700 border-amber-300"
};

export function ScanResult({
  product,
  onAddToCollection,
  onRescan,
  onGoHome
}: ScanResultProps) {
  const pointsReward =
    product.isDuplicateToday
      ? 0
      : rarityBasePoints[
          product.rarity
        ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6">
      <div className="w-full max-w-md">
        <Card className="border-2 border-blue-200 bg-white/95 p-6 shadow-2xl backdrop-blur">

          <div className="mb-4 flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${rarityColors[product.rarity]} shadow-lg`}
            >
              {product.imageUrl ? (
                <img
                  src={
                    product.imageUrl
                  }
                  alt={
                    product.name
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <Star className="h-8 w-8 text-white" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-blue-900">
                {
                  product.name
                }
              </h2>

              {product.brand && (
                <p className="text-sm text-blue-600">
                  {
                    product.brand
                  }
                </p>
              )}

              <p className="text-xs text-gray-500">
                Código:{" "}
                {
                  product.barcode
                }
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <Badge
              className={`${rarityBadgeColors[product.rarity]} border`}
            >
              {product.rarity.toUpperCase()}
            </Badge>

            <Badge className="border-0 bg-slate-100 text-slate-700">
              {
                product.appCategory
              }
            </Badge>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            La rareza es una mecánica de ScanGame basada en el código de barras.
          </p>

          <div className="mb-4 grid grid-cols-3 gap-2">

            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3">
              <div className="mb-1 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-500" />

                <span className="text-xs font-semibold text-amber-700">
                  XP base
                </span>
              </div>

              <p className="text-xl font-bold text-amber-900">
                {
                  product.xpBase
                }
              </p>
            </Card>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
              <div className="mb-1 flex items-center gap-1">
                <Star className="h-4 w-4 text-blue-500" />

                <span className="text-xs font-semibold text-blue-700">
                  XP total
                </span>
              </div>

              <p className="text-xl font-bold text-blue-900">
                {
                  product.xpReward
                }
              </p>
            </Card>

            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3">
              <div className="mb-1 flex items-center gap-1">
                <Coins className="h-4 w-4 text-emerald-600" />

                <span className="text-xs font-semibold text-emerald-700">
                  Puntos
                </span>
              </div>

              <p className="text-xl font-bold text-emerald-900">
                +{
                  pointsReward
                }
              </p>
            </Card>

          </div>

          <div className="mb-4 space-y-1 text-sm text-blue-700">
            <p>
              {product.isNew
                ? "Producto nuevo ✅"
                : "Producto repetido (15%)"}
            </p>

            {product.bonusDaily >
              0 && (
              <p>
                Bonus primer escaneo del día: +
                {
                  product.bonusDaily
                }{" "}
                XP
              </p>
            )}

            {product.bonusStreak >
              0 && (
              <p>
                Bonus racha diaria: +
                {
                  product.bonusStreak
                }{" "}
                XP
              </p>
            )}

            {product.isDuplicateToday && (
              <p className="font-semibold text-red-500">
                Ya escaneaste este producto hoy. Probá mañana.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={
                onAddToCollection
              }
              className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold text-white"
              disabled={
                product.isDuplicateToday
              }
            >
              <Plus className="mr-2 h-5 w-5" />
              Añadir a colección
            </Button>

            <Button
              onClick={
                onRescan
              }
              variant="outline"
              className="w-full border-2 border-blue-300 font-semibold text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Volver a escanear
            </Button>

            <Button
              onClick={
                onGoHome
              }
              variant="ghost"
              className="w-full font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Home className="mr-2 h-5 w-5" />
              Ir a inicio
            </Button>
          </div>

        </Card>
      </div>
    </div>
  );
}
