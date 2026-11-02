
      <div className="relative z-30 rounded-t-[32px] bg-[#E2DADB] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-[#12130F] shadow-[0_-20px_60px_rgba(0,0,0,0.28)]">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#386FA4]/20" />

        <div className="mb-4">
          <h2 className="text-lg font-bold">
            ¿No lo detecta?
          </h2>
          <p className="mt-1 text-sm text-[#386FA4]">
            Podés ingresar el código o usar una foto.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setManualOpen(
                (previous) => !previous
              );
              setManualError(null);
            }}
            className="h-12 rounded-2xl border-2 border-[#386FA4]/20 bg-white/75 text-[#386FA4] hover:bg-white"
          >
            <Keyboard className="mr-2 h-5 w-5" />
            Escribir código
          </Button>

          <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#386FA4]/20 bg-white/75 px-4 text-sm font-semibold text-[#386FA4] transition hover:bg-white">
            <ImageIcon className="mr-2 h-5 w-5" />
            {photoLoading
              ? "Leyendo..."
              : "Usar foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={photoLoading}
              className="hidden"
              onChange={(event) =>
                void handlePhotoUpload(event)
              }
            />
          </label>
        </div>

        {manualOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0
            }}
            animate={{
              opacity: 1,
              height: "auto"
            }}
            className="mt-4 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                value={manualBarcode}
                onChange={(event) => {
                  setManualBarcode(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  );
                  setManualError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleManualSubmit();
                  }
                }}
                inputMode="numeric"
                autoFocus
                placeholder="Ej: 7791234567890"
                className="min-w-0 flex-1 rounded-2xl border-2 border-[#386FA4]/20 bg-white px-4 py-3 text-base text-[#12130F] outline-none placeholder:text-slate-400 focus:border-[#386FA4]"
              />

              <Button
                type="button"
                size="icon"
                onClick={handleManualSubmit}
                className="h-12 w-12 shrink-0 rounded-2xl bg-[#386FA4] text-white hover:bg-[#2d5a85]"
                aria-label="Confirmar código"
              >
                <ScanLine className="h-5 w-5" />
              </Button>
            </div>

            {manualError && (
              <p className="mt-2 text-xs font-medium text-red-600">
                {manualError}
              </p>
            )}
          </motion.div>
        )}

        {photoError && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
            {photoError}
          </p>
        )}

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#386FA4]/65">
          Buena luz y el código completo dentro del marco ayudan a leerlo más rápido.
        </p>
      </div>
    </div>
  );
}
