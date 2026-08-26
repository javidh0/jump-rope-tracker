"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Workout } from "@prisma/client";
import { createSession } from "@/lib/actions";
import SessionForm from "@/components/SessionForm";
import RemoteSensorPanel, {
  type RemoteSensorHandle,
} from "@/components/RemoteSensorPanel";

type Phase = { label: string; sec: number; kind: "warmup" | "work" | "rest" | "cooldown" };

function buildPhases(w: Workout): Phase[] {
  const phases: Phase[] = [];
  if (w.warmupSec > 0) phases.push({ label: "Warmup", sec: w.warmupSec, kind: "warmup" });
  for (let round = 1; round <= w.rounds; round++) {
    phases.push({ label: `Round ${round}`, sec: w.workSec, kind: "work" });
    const isLast = round === w.rounds;
    if (w.restSec > 0 && !isLast) {
      phases.push({ label: "Rest", sec: w.restSec, kind: "rest" });
    }
  }
  if (w.cooldownSec > 0) phases.push({ label: "Cooldown", sec: w.cooldownSec, kind: "cooldown" });
  return phases;
}

function beep(freq: number, durationMs: number) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => ctx.close();
  } catch {
    // audio not available — non-fatal
  }
}

function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutRunner({ workout }: { workout: Workout }) {
  const phases = useMemo(() => buildPhases(workout), [workout]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0]?.sec ?? 0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [finalJumpCount, setFinalJumpCount] = useState<number | undefined>(
    undefined
  );
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const remotePanelRef = useRef<RemoteSensorHandle>(null);

  const currentPhase = phases[phaseIndex];

  function captureJumpCount() {
    if (remotePanelRef.current?.isArmed()) {
      setFinalJumpCount(remotePanelRef.current.getCount());
    }
    remotePanelRef.current?.stopListening();
  }

  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextIndex = phaseIndex + 1;
          if (nextIndex >= phases.length) {
            beep(880, 400);
            vibrate([200, 100, 200]);
            captureJumpCount();
            setFinished(true);
            setRunning(false);
            return 0;
          }
          beep(660, 200);
          vibrate(150);
          setPhaseIndex(nextIndex);
          return phases[nextIndex].sec;
        }
        return prev - 1;
      });
      setElapsedSec((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, finished, phaseIndex, phases]);

  useEffect(() => {
    if (finished) {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, [finished]);

  async function handleStart() {
    const isFirstStart = elapsedSec === 0;
    setRunning(true);
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // non-fatal
    }
    await remotePanelRef.current?.startListening(isFirstStart);
  }

  function handlePause() {
    setRunning(false);
    remotePanelRef.current?.stopListening();
  }

  function handleSkip() {
    setPhaseIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= phases.length) {
        captureJumpCount();
        setFinished(true);
        setRunning(false);
        return prev;
      }
      setSecondsLeft(phases[nextIndex].sec);
      return nextIndex;
    });
  }

  function handleStop() {
    setRunning(false);
    captureJumpCount();
    setFinished(true);
  }

  if (phases.length === 0) {
    return <p className="text-sm text-zinc-500">This workout has no phases configured.</p>;
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Workout complete 🎉</h1>
        <p className="text-sm text-zinc-500">
          {workout.name} · {formatTime(elapsedSec)} total.{" "}
          {finalJumpCount != null
            ? `Remote sensor detected ${finalJumpCount} jumps — adjust below if needed.`
            : "Add the details below to save it."}
        </p>
        <SessionForm
          action={createSession}
          submitLabel="Save session"
          defaultDurationSec={elapsedSec}
          defaultType={workout.type}
          defaultSkipCount={finalJumpCount}
          hiddenFields={{ source: "WORKOUT_RUNNER", workoutId: workout.id }}
        />
      </div>
    );
  }

  const totalPhaseSec = currentPhase.sec;
  const progress = 1 - secondsLeft / totalPhaseSec;

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {workout.name}
        </h1>
        <p className="text-xs text-zinc-500">
          Phase {phaseIndex + 1} / {phases.length}
        </p>
      </div>

      <div
        className={`rounded-full px-4 py-1 text-sm font-medium ${
          currentPhase.kind === "work"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            : currentPhase.kind === "rest"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        }`}
      >
        {currentPhase.label}
      </div>

      <div className="font-mono text-7xl tabular-nums">
        {formatTime(secondsLeft)}
      </div>

      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-zinc-900 transition-all dark:bg-white"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      <div className="w-full max-w-sm">
        <RemoteSensorPanel ref={remotePanelRef} running={running} />
      </div>

      <div className="flex gap-3">
        {!running ? (
          <button
            onClick={handleStart}
            className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {elapsedSec === 0 ? "Start" : "Resume"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="rounded-full border border-zinc-300 px-8 py-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleSkip}
          className="rounded-full border border-zinc-300 px-8 py-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Skip
        </button>
        <button
          onClick={handleStop}
          className="rounded-full border border-red-300 px-8 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          Stop
        </button>
      </div>

      <p className="text-xs text-zinc-500">Total elapsed: {formatTime(elapsedSec)}</p>
    </div>
  );
}
