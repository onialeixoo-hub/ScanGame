import {
  useEffect,
  useRef,
  useState
} from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { motion } from "motion/react";
import {
  AlertCircle,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
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

type CameraState =
  | "starting"
  | "active"
  | "denied"
  | "error"
  | "success";

const isValidBarcode = (value: string) =>
  /^\d{6,18}$/.test(value.trim());

export function Scanner({
  onScanComplete,
  onClose
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef =
    useRef<BrowserMultiFormatReader | null>(null);
  const lockedRef = useRef(false);
  const scanCallbackRef = useRef(onScanComplete);

  const [cameraState, setCameraState] =
    useState<CameraState>("starting");
  const [cameraError, setCameraError] =
    useState<string | null>(null);
  const [flashAvailable, setFlashAvailable] =
    useState(false);
  const [flashEnabled, setFlashEnabled] =
    useState(false);
  const [manualOpen, setManualOpen] =
    useState(false);
  const [manualBarcode, setManualBarcode] =
    useState("");
  const [manualError, setManualError] =
    useState<string | null>(null);

  useEffect(() => {
    scanCallbackRef.current = onScanComplete;
  }, [onScanComplete]);

  const getVideoTrack = () => {
    const stream = videoRef.current
      ?.srcObject as MediaStream | null;

    return stream?.getVideoTracks()[0];
  };

  const stopScanner = () => {
    try {
      readerRef.current?.reset();
    } catch {
      // Ignore reset errors.
    }

    const stream = videoRef.current
      ?.srcObject as MediaStream | null;

    stream?.getTracks().forEach((track) => {
      track.stop();
    });

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    readerRef.current = null;
    setFlashAvailable(false);
    setFlashEnabled(false);
  };

  const finishScan = (rawValue: string) => {
    const value = rawValue.trim();
