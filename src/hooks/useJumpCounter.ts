"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isJumpDetectionSupported,
  runCalibration,
  startCounting,
  type JumpDetectorHandle,
} from "@/lib/audio/jumpDetector";

export type PermissionState = "idle" | "denied" | "error";

export function useJumpCounter() {
  const [count, setCount] = useState(0);
  const [level, setLevel] = useState(0);
  const [listening, setListening] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>(
    "idle"
  );
  const handleRef = useRef<JumpDetectorHandle | null>(null);

  // Default to unsupported on the very first render so server and client
  // markup match; the real capability is a browser-only check, so it's
  // synced in after mount rather than computed during render.
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with a browser-only capability check, not derived from props/state
    setSupported(isJumpDetectionSupported());
  }, []);

  const start = useCallback(async (threshold: number) => {
    if (!isJumpDetectionSupported()) {
      setPermissionState("error");
      return false;
    }
    try {
      const handle = await startCounting(
        threshold,
        () => setCount((c) => c + 1),
        (l) => setLevel(l)
      );
      handleRef.current = handle;
      setListening(true);
      setPermissionState("idle");
      return true;
    } catch {
      setPermissionState("denied");
      return false;
    }
  }, []);

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
      if (!isJumpDetectionSupported()) {
        setPermissionState("error");
        return null;
      }
      try {
        const result = await runCalibration(sampleMs, (l) => {
          setLevel(l);
          onLevel?.(l);
        });
        setPermissionState("idle");
        return result;
      } catch {
        setPermissionState("denied");
        return null;
      } finally {
        setLevel(0);
      }
    },
    []
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
