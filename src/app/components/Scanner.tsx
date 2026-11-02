import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import {
  Keyboard,
  RotateCcw,
  ScanLine,
  X
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface ScannerProps {
  onScanComplete: (barcode: string) => void;
  onClose: () => void;
}

type ScannerStatus =
  | "loading"
  | "active"
  | "error"
  | "success";

const validBarcode = (value: string) =>
  /^\d{6,18}$/.test(value.trim());

export function Scanner({
  onScanComplete,
  onClose
}: ScannerProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const readerRef =
    useRef<BrowserMultiFormatReader | null>(null);

  const scanLockedRef = useRef(false);

  const [status, setStatus] =
    useState<ScannerStatus>("loading");

  const [error, setError] = useState("");

  const [manualOpen, setManualOpen] =
    useState(false);

  const [manualBarcode, setManualBarcode] =
    useState("");

  const [manualError, setManualError] =
    useState("");

  const stopScanner = () => {
    try {
      readerRef.current?.reset();
    } catch {
      // No hay nada que detener.
    }

    const stream =
      videoRef.current?.srcObject as
        | MediaStream
        | null;

    stream
      ?.getTracks()
      .forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    readerRef.current = null;
  };

  const finishScan = (rawValue: string) => {
    const barcode = rawValue.trim();

    if (
      scanLockedRef.current ||
      !validBarcode(barcode)
    ) {
      return;
    }

    scanLockedRef.current = true;

    setStatus("success");

    stopScanner();

    navigator.vibrate?.(80);

    window.setTimeout(() => {
      onScanComplete(barcode);
    }, 180);
  };

  const startScanner = async () => {
    stopScanner();

    scanLockedRef.current = false;

    setStatus("loading");
    setError("");

    if (!videoRef.current) {
      setStatus("error");
      setError(
        "No se pudo preparar la cámara."
      );
      return;
    }

    try {
      const reader =
        new BrowserMultiFormatReader();

      reader.timeBetweenDecodingAttempts = 120;

      readerRef.current = reader;

      const devices =
        await reader.listVideoInputDevices();

      const rearCamera =
        [...devices]
          .reverse()
          .find((device) =>
            /back|rear|environment|trasera/i.test(
              device.label
            )
          ) ??
        devices[devices.length - 1];

      await reader.decodeFromVideoDevice(
        rearCamera?.deviceId ?? null,
        videoRef.current,
        (result) => {
          if (
            result &&
            !scanLockedRef.current
          ) {
            finishScan(result.getText());
          }
        }
      );

      if (!scanLockedRef.current) {
        setStatus("active");
      }
    } catch (cameraError) {
      stopScanner();

      setStatus("error");

      setError(
        cameraError instanceof DOMException &&
          cameraError.name ===
            "NotAllowedError"
          ? "Permiso de cámara denegado. Habilitalo en el navegador."
          : "No se pudo iniciar la cámara."
      );
    }
  };

  useEffect(() => {
    void startScanner();

    return () => {
      scanLockedRef.current = true;
      stopScanner();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitManual = () => {
    const barcode = manualBarcode.trim();

    if (!validBarcode(barcode)) {
      setManualError(
        "Ingresá entre 6 y 18 dígitos."
      );
      return;
    }

    setManualError("");

    finishScan(barcode);
  };

  const handleClose = () => {
    scanLockedRef.current = true;

    stopScanner();

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#111827] text-white">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/75" />

        <div className="relative z-20 flex items-center justify-between p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A9CAE5]">
              ScanGame
            </p>

            <h1 className="text-xl font-bold">
              Escanear producto
            </h1>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Cerrar escáner"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative z-10 flex h-full items-center justify-center px-7 pb-24">
          <div className="w-full max-w-sm text-center">
            <div className="relative aspect-[1.55/1] rounded-[28px] border-4 border-[#8EB6D9] shadow-[0_0_0_9999px_rgba(0,0,0,0.15)]">
              {status === "active" && (
                <div className="absolute left-6 right-6 top-1/2 h-[2px] animate-pulse bg-[#8EB6D9] shadow-[0_0_16px_rgba(142,182,217,0.95)]" />
              )}
            </div>

            <p className="mt-6 font-semibold text-[#A9CAE5]">
              {status === "loading" &&
                "Preparando cámara..."}

              {status === "active" &&
                "Escaneando automáticamente"}

              {status === "success" &&
                "¡Código detectado!"}

              {status === "error" &&
                "Cámara no disponible"}
            </p>

            {status !== "error" && (
              <p className="mt-2 text-sm text-white/70">
                Alineá el código de barras dentro
                del marco.
              </p>
            )}

            {status === "error" && (
              <div className="mt-4 rounded-2xl bg-black/40 p-4 backdrop-blur-md">
                <p className="text-sm text-white/80">
                  {error}
                </p>

                <Button
                  type="button"
                  onClick={() =>
                    void startScanner()
                  }
                  className="mt-4 bg-[#386FA4] text-white hover:bg-[#2d5a85]"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-30 rounded-t-[32px] bg-[#E2DADB] p-5 text-[#12130F] shadow-[0_-20px_60px_rgba(0,0,0,0.28)]">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#386FA4]/20" />

        <h2 className="text-lg font-bold">
          ¿No lo detecta?
        </h2>

        <p className="mt-1 text-sm text-[#386FA4]">
          También podés ingresar el código
          manualmente.
        </p>

        {!manualOpen ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setManualOpen(true)
            }
            className="mt-4 h-12 w-full rounded-2xl border-2 border-[#386FA4]/20 bg-white text-[#386FA4]"
          >
            <Keyboard className="mr-2 h-5 w-5" />
            Ingresar manualmente
          </Button>
        ) : (
          <div className="mt-4">
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

                  setManualError("");
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    submitManual();
                  }
                }}
                inputMode="numeric"
                placeholder="Ej: 7791234567890"
                className="min-w-0 flex-1 rounded-2xl border-2 border-[#386FA4]/20 bg-white px-4 py-3 text-[#12130F] outline-none focus:border-[#386FA4]"
              />

              <Button
                type="button"
                size="icon"
                onClick={submitManual}
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

            <button
              type="button"
              onClick={() => {
                setManualOpen(false);
                setManualError("");
              }}
              className="mt-3 w-full text-sm font-semibold text-[#386FA4]"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
