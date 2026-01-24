import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Star } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import type { CollectedProduct, AppCategory } from "@/app/types";
import { APP_CATEGORIES } from "@/app/lib/products";

interface CollectionProps {
  products: CollectedProduct[];
  onProductClick: (product: CollectedProduct) => void;
}

const rarityColors = {
  común: "from-gray-400 to-gray-500",
  raro: "from-blue-400 to-blue-600",
  épico: "from-purple-400 to-purple-600",
  legendario: "from-amber-400 to-orange-500"
};

const sortOptions = [
  { value: "recent", label: "Recientes" },
  { value: "most", label: "Más escaneados" },
  { value: "az", label: "A-Z" }
];

export function Collection({ products, onProductClick }: CollectionProps) {
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState<AppCategory | "Todas">("Todas");
  const [sortBy, setSortBy] = useState("recent");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand?.toLowerCase().includes(normalizedSearch) ||
        product.barcode.includes(normalizedSearch);
      const matchesCategory =
        activeCategory === "Todas" || product.appCategory === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "most") return b.scanCount - a.scanCount;
      if (sortBy === "az") return a.name.localeCompare(b.name);
      return new Date(b.lastScannedAt).getTime() - new Date(a.lastScannedAt).getTime();
    });
  }, [products, searchText, activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#E2DADB] pb-24">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#386FA4] to-[#2d5a85] px-6 py-6 shadow-lg space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Colección</h1>
          <p className="text-white/80 text-sm">{products.length} productos guardados</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-white/70 absolute left-3 top-3" />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Buscar por nombre, marca o barcode"
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={activeCategory === "Todas" ? "secondary" : "outline"}
            className="whitespace-nowrap"
            onClick={() => setActiveCategory("Todas")}
          >
            Todas
          </Button>
          {APP_CATEGORIES.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={activeCategory === category ? "secondary" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="px-6 pt-6">
        {filteredProducts.length === 0 ? (
          <Card className="p-6 text-center bg-white/80 border-2 border-dashed border-[#386FA4]/30">
            <p className="text-blue-700 font-semibold">No hay productos que coincidan.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.barcode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  onClick={() => onProductClick(product)}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-white/90 backdrop-blur border-2 border-blue-200"
                >
                  <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${rarityColors[product.rarity]} flex items-center justify-center mb-3 shadow-md overflow-hidden`}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Star className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h4 className="font-semibold text-blue-900 text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h4>
                  {product.brand && (
                    <p className="text-xs text-blue-600 line-clamp-1">{product.brand}</p>
                  )}
                  <p className="text-xs text-slate-500 mb-2">{product.appCategory}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs bg-blue-100 text-blue-700">
                      x{product.scanCount}
                    </Badge>
                    <Badge className="text-xs bg-slate-100 text-slate-700">
                      {product.rarity}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
