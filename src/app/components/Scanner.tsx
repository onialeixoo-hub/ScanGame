import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Keyboard, ScanLine, X, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface ScannerProps {
  onScanComplete: (barcode: string) => void;
  onClose: () => void;
}

type Status = "starting" | "active" | "error" | "success";

const validBarcode = (value: string) =>
  /^\d{6,18}$/.test(value.trim());

export function Scanner({
  onScanComplete,
  onClose
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lockedRef = useRef(false);

  const [status, setStatus] = useState<Status>("starting");
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualError, setManualError] = useState("");

  const stopScanner = () => {
    try {
      readerRef.current?.reset();
    } catch {
      // Nothing to stop.
    }

    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    readerRef.current = null;
  };

  const finishScan = (rawValue: string) => {
    const value = rawValue.trim();

    if (lockedRef.current || !validBarcode(value)) return;

    lockedRef.current = true;
    setStatus("success");
    stopScanner();

    navigator.vibrate?.(80);

    window.setTimeout(() => {
      onScanComplete(value);
    }, 180);
  };

  const startScanner = async () => {
    stopScanner();
    lockedRef.current = false;
    setStatus("starting");
    setError("");

    if (!videoRef.current) return;

    try {
      const reader = new BrowserMultiFormatReader();
      reader.timeBetweenDecodingAttempts = 120;
      readerRef.current = reader;

      const devices = await reader.listVideoInputDevices();

      const rearCamera =
        [...devices].reverse().find((device) =>
          /back|rear|environment|trasera/i.test(device.label)
        ) ?? devices[devices.length - 1];

      await reader.decodeFromVideoDevice(
        rearCamera?.deviceId ?? null,
        videoRef.current,
        (result) => {
          if (result && !lockedRef.current) {
            finishScan(result.getText());
          }
        }
      );

      if (!lockedRef.current) {
        setStatus("active");
      }
    } catch (cameraError) {
