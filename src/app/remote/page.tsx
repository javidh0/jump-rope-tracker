"use client";

import { useState } from "react";
import { useMotionCounter } from "@/hooks/useMotionCounter";
import {
  listCalibrationProfiles,
  saveCalibrationProfile,
  type CalibrationProfile,
} from "@/lib/calibrationProfiles";

const CALIBRATION_SAMPLE_MS = 6000;

function defaultProfileName() {
  return `Calibration – ${new Date().toLocaleDateString()}`;
}

function LevelMeter({ level }: { level: number }) {
  const pct = Math.min(100, (level / 20) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full bg-emerald-500 transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

type Step = "code" | "calibrate" | "armed";

async function relayFetch(code: string, method: string) {
  try {
    await fetch(`/api/remote/${code}/count`, { method });
  } catch {
    // best-effort — the laptop's poll will just see a stale count momentarily
  }
}

/**
 * Best-effort — most browsers support Element.requestFullscreen(), but
 * notably iPhone Safari (unlike iPad) never implemented it, so this is a
 * silent no-op there. On iPhone, "Add to Home Screen" is the real way to
 * get a chrome-free view (see the apple-mobile-web-app-capable meta tag
 * in layout.tsx).
 */
async function requestFullscreenBestEffort() {
  try {
    const el = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
    };
    await el.requestFullscreen?.();
  } catch {
    // unsupported or denied — non-fatal, page still works normally
  }
}

export default function RemotePage() {
  const motion = useMotionCounter();
  const [step, setStep] = useState<Step>("code");
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<CalibrationProfile[]>(() =>
    listCalibrationProfiles()
  );
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [armedThreshold, setArmedThreshold] = useState<number | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [pendingThreshold, setPendingThreshold] = useState<number | null>(
    null
  );
  const [calibrationName, setCalibrationName] = useState(
    defaultProfileName()
  );
  const [saved, setSaved] = useState(false);

  async function handleJoin() {
    // Fire this first, still directly inside the tap handler — some
    // browsers require fullscreen to be requested synchronously within a
    // user gesture, before any await, or they silently ignore it.
    requestFullscreenBestEffort();

    setJoinError(null);
    const trimmed = codeInput.trim();
    if (trimmed.length !== 4) {
      setJoinError("Enter the 4-digit code shown on your laptop.");
      return;
    }
    const res = await fetch(`/api/remote/${trimmed}/count`, {
      method: "PATCH",
    });
    if (!res.ok) {
      setJoinError("That code wasn't found — check the laptop screen.");
      return;
    }
    setCode(trimmed);
    setStep("calibrate");
  }

  function handleSelectProfile(id: string) {
    setSelectedProfileId(id);
    setPendingThreshold(null);
    setSaved(false);
    if (id === "new" || id === "") {
      setArmedThreshold(null);
      return;
    }
    const profile = profiles.find((p) => p.id === id);
    setArmedThreshold(profile?.threshold ?? null);
  }

  async function handleRunCalibration() {
    setCalibrating(true);
    const result = await motion.calibrate(CALIBRATION_SAMPLE_MS);
    setCalibrating(false);
    if (result) {
      setArmedThreshold(result.threshold);
      setPendingThreshold(result.threshold);
      setCalibrationName(defaultProfileName());
      setSaved(false);
    }
  }

  function handleSaveProfile() {
    if (pendingThreshold == null) return;
    const profile = saveCalibrationProfile(
      calibrationName || defaultProfileName(),
      pendingThreshold
    );
    setProfiles(listCalibrationProfiles());
    setSelectedProfileId(profile.id);
    setSaved(true);
  }

  async function handleStartCounting() {
    if (!code || armedThreshold == null) return;
    motion.reset();
    await relayFetch(code, "PUT");
    const ok = await motion.start(armedThreshold, () => {
      relayFetch(code, "POST");
    });
    if (ok) setStep("armed");
  }

  function handleStop() {
    motion.stop();
    setStep("calibrate");
  }

  if (!motion.supported) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-black p-6 text-center text-white">
        <p className="font-semibold">Motion sensor not available</p>
        <p className="text-sm text-zinc-400">
          This needs a secure (https) connection and a browser that supports
          motion sensors — try opening this page in Safari on an iPhone over
          https.
        </p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-black p-6 text-white">
        <h1 className="text-lg font-semibold">Connect as remote sensor</h1>
        <p className="max-w-xs text-center text-sm text-zinc-400">
          Enter the code shown on your laptop&apos;s Timer or Workout screen.
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
          className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-center font-mono text-3xl tracking-widest"
          placeholder="0000"
        />
        {joinError && <p className="text-sm text-red-400">{joinError}</p>}
        <button
          onClick={handleJoin}
          className="rounded-full bg-white px-8 py-3 text-sm font-medium text-black"
        >
          Join
        </button>
      </div>
    );
  }

  if (step === "calibrate") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-black p-6 text-white">
        <h1 className="text-lg font-semibold">Calibrate</h1>
        <label className="flex w-full max-w-xs flex-col gap-1 text-sm">
          <span className="text-zinc-400">Calibration</span>
          <select
            value={selectedProfileId}
            onChange={(e) => handleSelectProfile(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-2"
          >
            <option value="">Select a calibration…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="new">+ New calibration</option>
          </select>
        </label>

        {selectedProfileId === "new" && (
          <div className="flex w-full max-w-xs flex-col gap-3 rounded-lg bg-zinc-900 p-4">
            {!calibrating && pendingThreshold == null && (
              <>
                <p className="text-xs text-zinc-400">
                  Hold your phone (pocket or hand) and jump normally for a
                  few seconds — we&apos;ll set a threshold from your motion.
                </p>
                <button
                  onClick={handleRunCalibration}
                  className="self-start rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black"
                >
                  Start calibration
                </button>
              </>
            )}
            {calibrating && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-400">
                  Listening… keep jumping.
                </p>
                <LevelMeter level={motion.level} />
              </div>
            )}
            {!calibrating && pendingThreshold != null && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-emerald-400">
                  Calibration captured{saved ? " and saved" : ""}.
                </p>
                {!saved && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={calibrationName}
                      onChange={(e) => setCalibrationName(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs"
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs"
                    >
                      Save
                    </button>
                  </div>
                )}
                <button
                  onClick={handleRunCalibration}
                  className="self-start text-xs text-zinc-400 underline"
                >
                  Recalibrate
                </button>
              </div>
            )}
          </div>
        )}

        {motion.permissionState === "denied" && (
          <p className="max-w-xs text-center text-sm text-red-400">
            Motion access was denied — enable it for this site in Settings →
            Safari, then reload.
          </p>
        )}

        <button
          onClick={handleStartCounting}
          disabled={armedThreshold == null}
          className="rounded-full bg-white px-8 py-3 text-sm font-medium text-black disabled:opacity-40"
        >
          Start counting
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-black p-6 text-white">
      <span className="relative flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
      </span>
      <p className="text-lg font-semibold">Connected</p>
      <p className="max-w-xs text-center text-sm text-zinc-400">
        Counting your jumps — check your laptop screen for the live count.
      </p>
      <div className="w-full max-w-[200px]">
        <LevelMeter level={motion.level} />
      </div>
      <button
        onClick={handleStop}
        className="mt-4 rounded-full border border-red-800 px-6 py-2 text-sm text-red-400"
      >
        Stop
      </button>
    </div>
  );
}
