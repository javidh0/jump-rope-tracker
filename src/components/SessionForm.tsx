"use client";

import { useState } from "react";
import type { CalibrationTest, Session } from "@prisma/client";

const SESSION_TYPES = [
  { value: "STEADY_STATE", label: "Steady-state" },
  { value: "HIIT", label: "HIIT" },
  { value: "SKILL_PRACTICE", label: "Skill practice" },
  { value: "CALIBRATION_TEST", label: "Calibration test" },
];

const SKILL_TIERS = [
  { value: "", label: "—" },
  { value: "SINGLES", label: "Singles" },
  { value: "DOUBLES", label: "Doubles" },
  { value: "CROSSOVERS", label: "Crossovers" },
  { value: "TRIPLES", label: "Triples" },
  { value: "OTHER", label: "Other" },
];

const CALIBRATION_TEST_TYPES = [
  { value: "MAX_SKIPS_30S", label: "Max skips in 30s", unit: "skips" },
  { value: "MAX_SKIPS_60S", label: "Max skips in 60s", unit: "skips" },
  { value: "TIME_FOR_500", label: "Time for 500 skips", unit: "sec" },
  {
    value: "MAX_DOUBLE_UNDERS_60S",
    label: "Max double-unders in 60s",
    unit: "reps",
  },
];

function toDatetimeLocal(date: Date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export default function SessionForm({
  action,
  session,
  calibrationTest,
  submitLabel,
  defaultDurationSec,
  defaultType,
  defaultSkipCount,
  hiddenFields,
  lockDuration,
}: {
  action: (formData: FormData) => void;
  session?: Session;
  calibrationTest?: CalibrationTest | null;
  submitLabel: string;
  defaultDurationSec?: number;
  defaultType?: string;
  defaultSkipCount?: number;
  hiddenFields?: Record<string, string>;
  lockDuration?: boolean;
}) {
  const effectiveDurationSec = session?.durationSec ?? defaultDurationSec;
  const durationMin =
    effectiveDurationSec != null ? Math.floor(effectiveDurationSec / 60) : "";
  const durationSec =
    effectiveDurationSec != null ? effectiveDurationSec % 60 : "";

  const effectiveSkipCount = session?.skipCount ?? defaultSkipCount;

  const [type, setType] = useState(
    session?.type ?? defaultType ?? "STEADY_STATE"
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <Field label="Date & time">
        <input
          type="datetime-local"
          name="dateTime"
          defaultValue={
            session ? toDatetimeLocal(session.dateTime) : toDatetimeLocal(new Date())
          }
          className="input"
        />
      </Field>

      <Field label="Session type" required>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          className="input"
        >
          {SESSION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Duration" required>
        <div className="flex gap-2">
          <input
            type="number"
            name="durationMin"
            min={0}
            placeholder="min"
            defaultValue={durationMin}
            readOnly={lockDuration}
            required
            className={`input w-24 ${lockDuration ? "opacity-70" : ""}`}
          />
          <input
            type="number"
            name="durationSec"
            min={0}
            max={59}
            placeholder="sec"
            defaultValue={durationSec}
            readOnly={lockDuration}
            className={`input w-24 ${lockDuration ? "opacity-70" : ""}`}
          />
        </div>
      </Field>

      {type === "CALIBRATION_TEST" && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500">
            Calibration test result
          </p>
          <Field label="Test type" required>
            <select
              name="calibrationTestType"
              defaultValue={calibrationTest?.testType ?? "MAX_SKIPS_30S"}
              className="input"
            >
              {CALIBRATION_TEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Result" required>
            <input
              type="number"
              step="any"
              name="calibrationResultValue"
              defaultValue={calibrationTest?.resultValue ?? ""}
              className="input"
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Skip count (optional)">
          <input
            type="number"
            name="skipCount"
            min={0}
            defaultValue={effectiveSkipCount ?? ""}
            className="input"
          />
        </Field>
        <label className="mt-6 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            name="skipCountEstimated"
            defaultChecked={
              session?.skipCountEstimated ?? defaultSkipCount != null
            }
          />
          Estimated
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Misses">
          <input
            type="number"
            name="misses"
            min={0}
            defaultValue={session?.misses ?? ""}
            className="input"
          />
        </Field>
        <Field label="Longest unbroken streak">
          <input
            type="number"
            name="longestUnbrokenStreak"
            min={0}
            defaultValue={session?.longestUnbrokenStreak ?? ""}
            className="input"
          />
        </Field>
      </div>

      <Field label="Skill attempted">
        <select
          name="skillAttempted"
          defaultValue={session?.skillAttempted ?? ""}
          className="input"
        >
          {SKILL_TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="RPE (1-10)">
          <input
            type="number"
            name="rpe"
            min={1}
            max={10}
            defaultValue={session?.rpe ?? ""}
            className="input"
          />
        </Field>
        <Field label="Soreness (1-5)">
          <input
            type="number"
            name="soreness"
            min={1}
            max={5}
            defaultValue={session?.soreness ?? ""}
            className="input"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={3}
          defaultValue={session?.notes ?? ""}
          className="input"
        />
      </Field>

      <button
        type="submit"
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
