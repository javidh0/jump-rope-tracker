"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useJumpCounter } from "@/hooks/useJumpCounter";
import {
  listCalibrationProfiles,
  saveCalibrationProfile,
  type CalibrationProfile,
} from "@/lib/calibrationProfiles";

const CALIBRATION_SAMPLE_MS = 6000;

export type JumpCounterHandle = {
  isArmed: () => boolean;
  startListening: (resetCount?: boolean) => Promise<boolean>;
  stopListening: () => void;
  getCount: () => number;
};

function defaultProfileName() {
  return `Calibration – ${new Date().toLocaleDateString()}`;
}

function LevelMeter({ level }: { level: number }) {
  const pct = Math.min(100, level * 250);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full bg-emerald-500 transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const JumpCounterPanel = forwardRef<JumpCounterHandle, { running: boolean }>(
  function JumpCounterPanel({ running }, ref) {
    const hook = useJumpCounter();
    const [micEnabled, setMicEnabled] = useState(false);
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

    useImperativeHandle(ref, () => ({
      isArmed: () => micEnabled && armedThreshold != null,
      startListening: async (resetCount = true) => {
        if (!micEnabled || armedThreshold == null) return false;
        if (resetCount) hook.reset();
        return hook.start(armedThreshold);
      },
      stopListening: () => hook.stop(),
      getCount: () => hook.count,
    }));

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
      const result = await hook.calibrate(CALIBRATION_SAMPLE_MS);
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

    if (!hook.supported) {
      return (
        <div className="flex flex-col gap-1 rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
          <span className="font-medium">Auto-count jumps (mic)</span>
          <span>
            Not available in this browser/context — microphone jump
            detection needs HTTPS (or localhost) and mic access support.
            You can still enter skip count manually below.
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={micEnabled}
            disabled={running}
            onChange={(e) => {
              setMicEnabled(e.target.checked);
              if (!e.target.checked) {
                setArmedThreshold(null);
                setSelectedProfileId("");
              }
            }}
          />
          Auto-count jumps (mic)
        </label>

        {hook.permissionState === "denied" && (
          <p className="text-xs text-red-500">
            Microphone access was denied — allow it in your browser to use
            auto-counting, or enter skip count manually.
          </p>
        )}

        {micEnabled && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Calibration
              </span>
              <select
                value={selectedProfileId}
                disabled={running}
                onChange={(e) => handleSelectProfile(e.target.value)}
                className="input"
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
              <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                {!calibrating && pendingThreshold == null && (
                  <>
                    <p className="text-xs text-zinc-500">
                      Jump normally for a few seconds — we&apos;ll listen and
                      set a threshold for your rope and floor.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunCalibration}
                      className="self-start rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Start calibration
                    </button>
                  </>
                )}
                {calibrating && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-500">
                      Listening… keep jumping.
                    </p>
                    <LevelMeter level={hook.level} />
                  </div>
                )}
                {!calibrating && pendingThreshold != null && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Calibration captured{saved ? " and saved" : ""}. You can
                      use it right away.
                    </p>
                    {!saved && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={calibrationName}
                          onChange={(e) => setCalibrationName(e.target.value)}
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Save for next time
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRunCalibration}
                      className="self-start text-xs text-zinc-500 underline"
                    >
                      Recalibrate
                    </button>
                  </div>
                )}
              </div>
            )}

            {armedThreshold != null && (running || hook.listening) && (
              <div className="flex flex-col items-center gap-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Detected jumps
                </span>
                <span className="font-mono text-4xl tabular-nums">
                  {hook.count}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => hook.adjust(-1)}
                    className="rounded-full border border-zinc-300 px-4 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    −1
                  </button>
                  <button
                    type="button"
                    onClick={() => hook.adjust(1)}
                    className="rounded-full border border-zinc-300 px-4 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    +1
                  </button>
                </div>
                <div className="w-full max-w-[160px]">
                  <LevelMeter level={hook.level} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default JumpCounterPanel;
