import { useMemo, useState } from "react";
import {
  Coins,
  Home,
  Plus,
  RefreshCw,
  Sparkles,
  Star
} from "lucide-react";

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
  onAddToCollection,
  onRescan,
  onGoHome
}: ScanResultProps) {
  const unknownProduct = useMemo(() => {
    const normalizedName = product.name.trim().toLowerCase();

    return (
      normalizedName === "" ||
      normalizedName.includes("producto sin nombre") ||
      normalizedName.includes("barcode")
    );
  }, [product.name]);

  const [customProductName, setCustomProductName] = useState(
    unknownProduct ? "" : product.name
  );

  const displayProductName =
    customProductName.trim() ||
    product.name ||
    `Producto sin nombre (${product.barcode})`;

  const pointsReward = product.isDuplicateToday
    ? 0
    : rarityBasePoints[product.rarity];

  const canAdd =
    !product.isDuplicateToday &&
    (!unknownProduct || customProductName.trim().length > 0);

  const handleAdd = () => {
    const finalName = customProductName.trim();

    if (unknownProduct && !finalName) return;

    if (finalName) {
      product.name = finalName;
    }

    onAddToCollection();
  };
