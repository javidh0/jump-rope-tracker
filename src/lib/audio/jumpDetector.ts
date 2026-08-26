const REFRACTORY_MS = 150;
const CALIBRATION_THRESHOLD_FACTOR = 0.55;
const MIN_THRESHOLD = 0.02;
const MAX_THRESHOLD = 0.9;

export type JumpDetectorHandle = {
  stop: () => void;
};

function rms(data: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    const centered = (data[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  return Math.sqrt(sumSquares / data.length);
}

async function openStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
}

/**
 * Starts listening on the mic and calls onEnergy(level) on every animation
 * frame with the current short-time RMS energy (0-1ish). Caller is
 * responsible for turning that into counted jumps (see startCounting) or
 * calibration sampling (see runCalibration).
 */
async function openAnalyser(): Promise<{
  stream: MediaStream;
  ctx: AudioContext;
  analyser: AnalyserNode;
  buffer: Uint8Array<ArrayBuffer>;
}> {
  const stream = await openStream();
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
  return { stream, ctx, analyser, buffer };
}

function closeAll(stream: MediaStream, ctx: AudioContext) {
  stream.getTracks().forEach((t) => t.stop());
  ctx.close().catch(() => {});
}

/**
 * Starts mic-based jump counting. Calls onCount() each time a jump is
 * detected and onLevel(level) continuously for a live meter. Returns a
 * handle whose stop() releases the mic and audio context.
 */
export async function startCounting(
  threshold: number,
  onCount: () => void,
  onLevel: (level: number) => void
): Promise<JumpDetectorHandle> {
  const { stream, ctx, analyser, buffer } = await openAnalyser();

  let above = false;
  let lastCountAt = 0;
  let rafId: number;

  function tick() {
    analyser.getByteTimeDomainData(buffer);
    const level = rms(buffer);
    onLevel(level);

    const now = performance.now();
    if (!above && level >= threshold) {
      above = true;
      if (now - lastCountAt >= REFRACTORY_MS) {
        lastCountAt = now;
        onCount();
      }
    } else if (above && level < threshold * 0.6) {
      above = false;
    }

    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return {
    stop: () => {
      cancelAnimationFrame(rafId);
      closeAll(stream, ctx);
    },
  };
}

/**
 * Listens for `sampleMs` and returns a suggested detection threshold based
 * on the peak energies observed, plus the raw peaks for debugging/inspection.
 * Calls onLevel(level) continuously so callers can render a live meter
 * during calibration.
 */
export async function runCalibration(
  sampleMs: number,
  onLevel: (level: number) => void
): Promise<{ threshold: number; peakCount: number }> {
  const { stream, ctx, analyser, buffer } = await openAnalyser();

  const peaks: number[] = [];
  let above = false;
  let currentPeak = 0;
  let rafId: number;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    function tick() {
      analyser.getByteTimeDomainData(buffer);
      const level = rms(buffer);
      onLevel(level);

      const risingThreshold = 0.08;
      if (!above && level >= risingThreshold) {
        above = true;
        currentPeak = level;
      } else if (above) {
        currentPeak = Math.max(currentPeak, level);
        if (level < risingThreshold * 0.6) {
          above = false;
          peaks.push(currentPeak);
        }
      }

      if (performance.now() - startedAt >= sampleMs) {
        cancelAnimationFrame(rafId);
        closeAll(stream, ctx);

        let threshold: number;
        if (peaks.length === 0) {
          threshold = 0.15;
        } else {
          const sorted = [...peaks].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          threshold = Math.min(
            MAX_THRESHOLD,
            Math.max(MIN_THRESHOLD, median * CALIBRATION_THRESHOLD_FACTOR)
          );
        }
        resolve({ threshold, peakCount: peaks.length });
        return;
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  });
}

export function isJumpDetectionSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  const hasAudioContext =
    "AudioContext" in window || "webkitAudioContext" in window;
  return hasAudioContext;
}
