import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { Camera, Flashlight, FlashlightOff, Lock, X, Zap } from "lucide-react";
import { Button } from "@/app/components/ui/button";

type DetectedBarcode = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

interface ScannerProps {
  onScanComplete: (barcode: string) => void;
  onClose: () => void;
}

export function Scanner({ onScanComplete, onClose }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<
    "checking" | "granted" | "denied"
  >("checking");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const requestCamera = async () => {
    setPermissionStatus("checking");
    setScanError(null);
    setPhotoError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermissionStatus("granted");
    } catch (error) {
      setPermissionStatus("denied");
    }
  };

  useEffect(() => {
    if (permissionStatus !== "granted") return;
    const DetectorConstructor = (window as Window & {
      BarcodeDetector?: BarcodeDetectorConstructor;
    }).BarcodeDetector;
    if (!DetectorConstructor) {
      setScanError(
        "Tu navegador no soporta escaneo automático. Podés ingresar el código manualmente."
      );
      return;
    }
    try {
      detectorRef.current = new DetectorConstructor({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"]
      });
    } catch (error) {
      setScanError("No se pudo inicializar el detector de códigos.");
    }
  }, [permissionStatus]);

  useEffect(() => {
    if (!isScanning || scanLocked) return;
    const interval = window.setInterval(() => {
      setScanProgress((prev) => (prev >= 95 ? 15 : prev + 5));
    }, 160);

    return () => window.clearInterval(interval);
  }, [isScanning, scanLocked]);

  useEffect(() => {
    if (!isScanning || scanLocked || permissionStatus !== "granted") return;
    if (!detectorRef.current || !videoRef.current) return;

    let active = true;

    const scanFrame = async () => {
      if (!active || !detectorRef.current || !videoRef.current) return;
      try {
        const codes = await detectorRef.current.detect(videoRef.current);
        if (codes.length > 0) {
          const value = codes[0].rawValue;
          setScanLocked(true);
          setScanProgress(100);
          setIsScanning(false);
          stopCamera();
          onScanComplete(value);
          return;
        }
      } catch (error) {
        setScanError("No se pudo leer el código. Probá acercar la cámara.");
        setIsScanning(false);
        return;
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);

    return () => {
      active = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [isScanning, scanLocked, permissionStatus, onScanComplete]);

  useEffect(() => {
    requestCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleToggleFlash = async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track) {
      setFlashEnabled((prev) => !prev);
      return;
    }

    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      if (!capabilities.torch) {
        setFlashEnabled((prev) => !prev);
        return;
      }
      const nextValue = !flashEnabled;
      await track.applyConstraints({
        advanced: [{ torch: nextValue }]
      } as MediaTrackConstraints);
      setFlashEnabled(nextValue);
    } catch (error) {
      setFlashEnabled((prev) => !prev);
    }
  };

  const handleStartScan = () => {
    if (scanError || !detectorRef.current) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLocked(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) return;
    setScanLocked(true);
    stopCamera();
    onScanComplete(manualBarcode.trim());
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    if (!file) return;
    if (!detectorRef.current) {
      setPhotoError("Tu navegador no soporta lectura desde foto.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detectorRef.current.detect(bitmap);
      if (codes.length > 0) {
        setScanLocked(true);
        stopCamera();
        onScanComplete(codes[0].rawValue);
        return;
      }
      setPhotoError("No se detectó ningún código en la foto. Probá otra imagen.");
    } catch (error) {
      setPhotoError("No se pudo procesar la foto. Probá nuevamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <h2 className="text-white text-lg font-semibold">Escaneá el código de barras</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToggleFlash}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            disabled={permissionStatus !== "granted"}
          >
            {flashEnabled ? (
              <FlashlightOff className="w-6 h-6" />
            ) : (
              <Flashlight className="w-6 h-6" />
            )}
          </Button>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-y-auto py-20">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Scanning Overlay */}
        <div className="relative z-10 w-full max-w-sm px-6 pb-10">
          {permissionStatus !== "granted" && (
            <div className="mb-4 rounded-xl bg-white/10 border border-white/20 p-4 text-white text-sm">
              {permissionStatus === "checking"
                ? "Solicitando permiso de cámara..."
                : "Necesitamos permiso de cámara para escanear."}
              {permissionStatus === "denied" && (
                <Button
                  className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white"
                  onClick={requestCamera}
                >
                  Volver a intentar
                </Button>
              )}
            </div>
          )}
          {scanError && (
            <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-400/40 p-4 text-amber-100 text-sm">
              {scanError}
            </div>
          )}
          {photoError && (
            <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-400/40 p-4 text-amber-100 text-sm">
              {photoError}
            </div>
          )}
          {/* Scan Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="border-4 border-blue-400 rounded-2xl p-8 bg-black/20 backdrop-blur-sm">
              <div className="aspect-[3/1] flex items-center justify-center">
                {!isScanning ? (
                  <Camera className="w-16 h-16 text-blue-400" />
                ) : (
                  <div className="w-full space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-2 bg-blue-400/30 rounded"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          delay: i * 0.1,
                          repeat: Infinity
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Corner Indicators */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-2xl" />

              {/* Scanning Line */}
              {isScanning && !scanLocked && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-lg shadow-blue-400"
                  initial={{ top: 0 }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>

            {/* Scan Detection Effect */}
            {scanProgress === 100 && (
              <motion.div
                className="absolute inset-0 border-4 border-blue-400 rounded-2xl"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center space-y-4"
          >
            {!isScanning ? (
              <>
                <p className="text-white/90 text-sm">
                  Colocá el código de barras dentro del marco
                </p>
                <Button
                  onClick={handleStartScan}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold h-12"
                  disabled={
                    permissionStatus !== "granted" || Boolean(scanError) || !detectorRef.current
                  }
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Iniciar Escaneo
                </Button>
                {permissionStatus !== "granted" && (
                  <p className="text-xs text-white/70 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Permiso requerido para escanear
                  </p>
                )}
                {scanError && (
                  <p className="text-xs text-amber-200">
                    Si tu navegador no soporta el escaneo, podés ingresar el código manualmente.
                  </p>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-5 h-5" />
                  </motion.div>
                  <span className="font-semibold">Escaneando... {scanProgress}%</span>
                </div>
                <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>

          {scanError && (
            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-white">
              <p className="text-sm font-semibold">Ingreso manual</p>
              <input
                value={manualBarcode}
                onChange={(event) => setManualBarcode(event.target.value)}
                inputMode="numeric"
                placeholder="Ingresá el código de barras"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Button
                onClick={handleManualSubmit}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold"
              >
                Confirmar código
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-white">
            <p className="text-sm font-semibold">Escanear desde una foto</p>
            <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/30 px-3 py-3 text-sm text-white/80 transition hover:bg-white/10">
              Sacá una foto o subí una imagen
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
            <p className="text-xs text-white/70">
              Ideal si querés usar la cámara propia del teléfono.
            </p>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <p className="text-white/80 text-xs text-center">
              💡 Tip: Asegurate de que el código esté bien iluminado y enfocado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
