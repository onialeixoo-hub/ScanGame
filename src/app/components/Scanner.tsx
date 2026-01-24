import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, Flashlight, FlashlightOff, Lock, X, Zap } from "lucide-react";
import { Button } from "@/app/components/ui/button";

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
  const streamRef = useRef<MediaStream | null>(null);

  const requestCamera = async () => {
    setPermissionStatus("checking");
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      streamRef.current = stream;
      setPermissionStatus("granted");
    } catch (error) {
      setPermissionStatus("denied");
    }
  };

  // Simulación de escaneo automático
  useEffect(() => {
    if (isScanning && !scanLocked) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Generar código de barras simulado
            const mockBarcode = `${Math.floor(Math.random() * 900000000000) + 100000000000}`;
            setScanLocked(true);
            setTimeout(() => onScanComplete(mockBarcode), 300);
            return 100;
          }
          return prev + 5;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isScanning, onScanComplete]);

  useEffect(() => {
    requestCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
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
    setIsScanning(true);
    setScanProgress(0);
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
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Camera View Simulation */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background pattern to simulate camera */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700" />
        </div>

        {/* Scanning Overlay */}
        <div className="relative z-10 w-full max-w-sm px-6">
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
                  disabled={permissionStatus !== "granted"}
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
        </div>
      </div>

      {/* Tips */}
      <div className="absolute bottom-8 left-0 right-0 px-6">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <p className="text-white/80 text-xs text-center">
            💡 Tip: Asegurate de que el código esté bien iluminado y enfocado
          </p>
        </div>
      </div>
    </div>
  );
}
