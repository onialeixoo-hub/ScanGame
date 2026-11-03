          )}

          <div className="mb-4 flex items-center justify-between">
            <Badge
              className={`${rarityBadgeColors[product.rarity]} border`}
            >
              {product.rarity.toUpperCase()}
            </Badge>

            <Badge className="border-0 bg-slate-100 text-slate-700">
              {product.appCategory}
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
                {product.xpBase}
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
                {product.xpReward}
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
                +{pointsReward}
              </p>
            </Card>
          </div>

          <div className="mb-4 space-y-1 text-sm text-blue-700">
            <p>
              {product.isNew
                ? "Producto nuevo ✅"
                : "Producto repetido (15%)"}
            </p>

            {product.bonusDaily > 0 && (
              <p>
                Bonus primer escaneo del día: +{product.bonusDaily} XP
              </p>
            )}

            {product.bonusStreak > 0 && (
              <p>
                Bonus racha diaria: +{product.bonusStreak} XP
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
              onClick={handleAdd}
              className="h-12 w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold text-white"
              disabled={!canAdd}
            >
              <Plus className="mr-2 h-5 w-5" />
              Añadir a colección
            </Button>

            <Button
              onClick={onRescan}
              variant="outline"
              className="w-full border-2 border-blue-300 font-semibold text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Volver a escanear
            </Button>

            <Button
              onClick={onGoHome}
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
