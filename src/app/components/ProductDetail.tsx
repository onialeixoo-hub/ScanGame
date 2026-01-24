import { ArrowLeft, ExternalLink, Globe } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import type { CollectedProduct } from "@/app/types";

interface ProductDetailProps {
  product: CollectedProduct;
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
  const handleGoogleSearch = () => {
    const query = encodeURIComponent(
      `${product.name} ${product.brand ?? ""} ${product.barcode}`
    );
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  };

  const handleOpenOff = () => {
    window.open(`https://world.openfoodfacts.org/product/${product.barcode}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
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
        <Card className="p-6 bg-white/95 backdrop-blur shadow-xl border-2 border-blue-200">
          <div
            className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${
              rarityColors[product.rarity]
            } flex items-center justify-center mb-4 shadow-lg overflow-hidden`}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-4xl">🧃</span>
            )}
          </div>

          <div className="text-center mb-4">
            <Badge className={`${rarityBadgeColors[product.rarity]} border mb-3`}>
              {product.rarity.toUpperCase()}
            </Badge>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{product.name}</h2>
            {product.brand && <p className="text-blue-600">{product.brand}</p>}
            <p className="text-xs text-gray-500 mt-2">Barcode: {product.barcode}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-600">Categoría app</p>
              <p className="text-lg font-bold text-blue-900">{product.appCategory}</p>
            </Card>
            <Card className="p-3 bg-indigo-50 border-indigo-200">
              <p className="text-xs text-indigo-600">Escaneos</p>
              <p className="text-lg font-bold text-indigo-900">{product.scanCount}</p>
            </Card>
          </div>
        </Card>

        {(product.ingredients || product.allergens) && (
          <Card className="p-5 bg-white/95 border-2 border-blue-200">
            {product.ingredients && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Ingredientes</h3>
                <p className="text-sm text-blue-700">{product.ingredients}</p>
              </div>
            )}
            {product.allergens && (
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Alérgenos</h3>
                <p className="text-sm text-blue-700">{product.allergens}</p>
              </div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleGoogleSearch}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          >
            <Globe className="w-5 h-5 mr-2" />
            Buscar en Google
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenOff}
            className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Ver en OpenFoodFacts
          </Button>
        </div>
      </div>
    </div>
  );
}
