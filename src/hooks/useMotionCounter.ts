"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isMotionDetectionSupported,
  motionPermissionNeedsPrompt,
  requestMotionPermission,
  runCalibration,
  startCounting,
  type MotionDetectorHandle,
} from "@/lib/motion/motionDetector";

export type PermissionState = "idle" | "denied" | "error";

export function useMotionCounter() {
  const [count, setCount] = useState(0);
  const [level, setLevel] = useState(0);
  const [listening, setListening] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>(
    "idle"
  );
  const handleRef = useRef<MotionDetectorHandle | null>(null);

  const [supported, setSupported] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with a browser-only capability check, not derived from props/state
    setSupported(isMotionDetectionSupported());
  }, []);

  const ensurePermission = useCallback(async () => {
    if (!isMotionDetectionSupported()) {
      setPermissionState("error");
      return false;
    }
    if (!motionPermissionNeedsPrompt()) return true;
    const granted = await requestMotionPermission();
    if (!granted) {
      setPermissionState("denied");
    }
    return granted;
  }, []);

  const start = useCallback(
    async (threshold: number, onJump?: () => void) => {
      const granted = await ensurePermission();
      if (!granted) return false;
      const handle = startCounting(
        threshold,
        () => {
          setCount((c) => c + 1);
          onJump?.();
        },
        (l) => setLevel(l)
      );
      handleRef.current = handle;
      setListening(true);
      setPermissionState("idle");
      return true;
    },
    [ensurePermission]
  );

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setListening(false);
    setLevel(0);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  const adjust = useCallback((delta: number) => {
    setCount((c) => Math.max(0, c + delta));
  }, []);

  const calibrate = useCallback(
    async (sampleMs: number, onLevel?: (level: number) => void) => {
      const granted = await ensurePermission();
      if (!granted) return null;
      try {
        const result = await runCalibration(sampleMs, (l) => {
          setLevel(l);
          onLevel?.(l);
        });
        setPermissionState("idle");
        return result;
      } finally {
        setLevel(0);
      }
    },
    [ensurePermission]
  );

  return {
    supported,
    count,
    level,
    listening,
    permissionState,
    start,
    stop,
    reset,
    adjust,
    calibrate,
  };
}
