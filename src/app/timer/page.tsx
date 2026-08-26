"use client";

import { useEffect, useRef, useState } from "react";
import { createSession } from "@/lib/actions";
import SessionForm from "@/components/SessionForm";

function formatTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SkipTimerPage() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [stopped, setStopped] = useState(false);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startRef.current != null) {
        setElapsedMs(baseRef.current + (Date.now() - startRef.current));
      }
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // wake lock not available/denied — non-fatal
    }
  }

  function releaseWakeLock() {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }

  function handleStart() {
    startRef.current = Date.now();
    setRunning(true);
    setStopped(false);
    requestWakeLock();
  }

  function handlePause() {
    if (startRef.current != null) {
      baseRef.current += Date.now() - startRef.current;
    }
    startRef.current = null;
    setRunning(false);
    releaseWakeLock();
  }

  function handleStop() {
    if (startRef.current != null) {
      baseRef.current += Date.now() - startRef.current;
      setElapsedMs(baseRef.current);
    }
    startRef.current = null;
    setRunning(false);
    setStopped(true);
    releaseWakeLock();
  }

  function handleReset() {
    baseRef.current = 0;
    startRef.current = null;
    setElapsedMs(0);
    setRunning(false);
    setStopped(false);
  }

  const elapsedSec = Math.round(elapsedMs / 1000);

  if (stopped) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Log this session?</h1>
        <p className="text-sm text-zinc-500">
          Timer recorded {formatTime(elapsedSec)}. Fill in what you can — skip
          count is estimated unless you tell us otherwise.
        </p>
        <SessionForm
          action={createSession}
          submitLabel="Save session"
          defaultDurationSec={elapsedSec}
          defaultType="STEADY_STATE"
          hiddenFields={{ source: "TIMER" }}
        />
        <button
          onClick={handleReset}
          className="self-start text-sm text-zinc-500 underline"
        >
          Discard and start a new timer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Skip Timer
      </h1>
      <div className="font-mono text-7xl tabular-nums">
        {formatTime(elapsedSec)}
      </div>
      <div className="flex gap-3">
        {!running && elapsedMs === 0 && (
          <button
            onClick={handleStart}
            className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start
          </button>
        )}
        {!running && elapsedMs > 0 && (
          <button
            onClick={handleStart}
            className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Resume
          </button>
        )}
        {running && (
          <button
            onClick={handlePause}
            className="rounded-full border border-zinc-300 px-8 py-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Pause
          </button>
        )}
        {elapsedMs > 0 && (
          <button
            onClick={handleStop}
            className="rounded-full border border-red-300 px-8 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
