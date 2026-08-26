const REFRACTORY_MS = 200;
const CALIBRATION_THRESHOLD_FACTOR = 0.6;
const MIN_THRESHOLD = 2;
const MAX_THRESHOLD = 40;
const RISING_THRESHOLD = 3;

export type MotionDetectorHandle = {
  stop: () => void;
};

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function isMotionDetectionSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return "DeviceMotionEvent" in window;
}

export function motionPermissionNeedsPrompt(): boolean {
  if (typeof window === "undefined") return false;
  const Ctor = window.DeviceMotionEvent as DeviceMotionEventWithPermission | undefined;
  return typeof Ctor?.requestPermission === "function";
}

/**
 * Must be called from within a user gesture handler (a click/tap), per the
 * iOS Safari requirement for motion sensor access.
 */
export async function requestMotionPermission(): Promise<boolean> {
  const Ctor = window.DeviceMotionEvent as DeviceMotionEventWithPermission | undefined;
  if (typeof Ctor?.requestPermission !== "function") {
    // Non-iOS browsers that support DeviceMotionEvent don't gate it behind
    // an explicit permission prompt.
    return true;
  }
  try {
    const result = await Ctor.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

function accelerationMagnitude(event: DeviceMotionEvent): number | null {
  const a = event.accelerationIncludingGravity;
  if (!a || a.x == null || a.y == null || a.z == null) return null;
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}

/**
 * Starts listening to devicemotion events and calls onCount() each time a
 * jump-like acceleration spike is detected, gated by a refractory window so
 * one landing's settle doesn't get double-counted. Calls onLevel(level)
 * continuously for a live meter.
 */
export function startCounting(
  threshold: number,
  onCount: () => void,
  onLevel: (level: number) => void
): MotionDetectorHandle {
  let above = false;
  let lastCountAt = 0;

  function handler(event: DeviceMotionEvent) {
    const magnitude = accelerationMagnitude(event);
    if (magnitude == null) return;
    // Subtract gravity's resting ~9.8 baseline so level reads near zero
    // at rest regardless of phone orientation.
    const level = Math.abs(magnitude - 9.8);
    onLevel(level);

    const now = performance.now();
    if (!above && level >= threshold) {
      above = true;
      if (now - lastCountAt >= REFRACTORY_MS) {
        lastCountAt = now;
        onCount();
      }
    } else if (above && level < threshold * 0.5) {
      above = false;
    }
  }

  window.addEventListener("devicemotion", handler);

  return {
    stop: () => {
      window.removeEventListener("devicemotion", handler);
    },
  };
}

/**
 * Listens for `sampleMs` and returns a suggested detection threshold based
 * on the peak accelerations observed while the user jumps normally.
 */
export function runCalibration(
  sampleMs: number,
  onLevel: (level: number) => void
): Promise<{ threshold: number; peakCount: number }> {
  return new Promise((resolve) => {
    const peaks: number[] = [];
    let above = false;
    let currentPeak = 0;
    let settled = false;

    function finish() {
      if (settled) return;
      settled = true;
      window.removeEventListener("devicemotion", handler);
      clearTimeout(timeoutId);

      let threshold: number;
      if (peaks.length === 0) {
        threshold = 6;
      } else {
        const sorted = [...peaks].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        threshold = Math.min(
          MAX_THRESHOLD,
          Math.max(MIN_THRESHOLD, median * CALIBRATION_THRESHOLD_FACTOR)
        );
      }
      resolve({ threshold, peakCount: peaks.length });
    }

    function handler(event: DeviceMotionEvent) {
      const magnitude = accelerationMagnitude(event);
      if (magnitude == null) return;
      const level = Math.abs(magnitude - 9.8);
      onLevel(level);

      if (!above && level >= RISING_THRESHOLD) {
        above = true;
        currentPeak = level;
      } else if (above) {
        currentPeak = Math.max(currentPeak, level);
        if (level < RISING_THRESHOLD * 0.5) {
          above = false;
          peaks.push(currentPeak);
        }
      }
    }

    // The sample window must end on a wall-clock timer, not only when a
    // devicemotion event happens to arrive — if the browser/device never
    // fires one (no sensor, permission silently no-op, etc.) the handler
    // would otherwise never run and this would hang forever.
    const timeoutId = setTimeout(finish, sampleMs);
    window.addEventListener("devicemotion", handler);
  });
}
