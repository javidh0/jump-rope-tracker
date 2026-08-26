import Link from "next/link";
import { createCustomWorkout, listWorkouts } from "@/lib/actions";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  STEADY_STATE: "Steady-state",
  HIIT: "HIIT",
  SKILL_PRACTICE: "Skill practice",
  CALIBRATION_TEST: "Calibration test",
};

function summarize(w: {
  workSec: number;
  restSec: number;
  rounds: number;
}) {
  if (w.rounds === 1 && w.restSec === 0) {
    return `${Math.round(w.workSec / 60)} min continuous`;
  }
  return `${w.workSec}s on / ${w.restSec}s off × ${w.rounds}`;
}

export default async function WorkoutsPage() {
  const workouts = await listWorkouts();
  const presets = workouts.filter((w) => w.isPreset);
  const custom = workouts.filter((w) => !w.isPreset);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Workouts</h1>
        <p className="text-sm text-zinc-500">
          Pick a preset or build your own interval structure.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Presets
        </h2>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {presets.map((w) => (
            <li key={w.id}>
              <Link
                href={`/workouts/${w.id}/run`}
                className="flex items-center justify-between p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-xs text-zinc-500">
                    {TYPE_LABELS[w.type] ?? w.type}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">{summarize(w)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {custom.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Your custom workouts
          </h2>
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {custom.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/workouts/${w.id}/run`}
                  className="flex items-center justify-between p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{w.name}</span>
                    <span className="text-xs text-zinc-500">
                      {TYPE_LABELS[w.type] ?? w.type}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{summarize(w)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Build a custom workout
        </h2>
        <form action={createCustomWorkout} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Name</span>
            <input
              type="text"
              name="name"
              placeholder="e.g. Tuesday HIIT"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Type</span>
            <select name="type" defaultValue="HIIT" className="input">
              <option value="STEADY_STATE">Steady-state</option>
              <option value="HIIT">HIIT</option>
              <option value="SKILL_PRACTICE">Skill practice</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Work (sec)</span>
              <input
                type="number"
                name="workSec"
                min={1}
                defaultValue={30}
                required
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Rest (sec)</span>
              <input
                type="number"
                name="restSec"
                min={0}
                defaultValue={30}
                className="input"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Rounds</span>
            <input
              type="number"
              name="rounds"
              min={1}
              defaultValue={8}
              required
              className="input"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Warmup (sec)</span>
              <input
                type="number"
                name="warmupSec"
                min={0}
                defaultValue={60}
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Cooldown (sec)</span>
              <input
                type="number"
                name="cooldownSec"
                min={0}
                defaultValue={60}
                className="input"
              />
            </label>
          </div>
          <button
            type="submit"
            className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Build & start
          </button>
        </form>
      </section>
    </div>
  );
}
