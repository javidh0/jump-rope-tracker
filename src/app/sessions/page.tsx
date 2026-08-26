import Link from "next/link";
import { listSessions } from "@/lib/actions";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  STEADY_STATE: "Steady-state",
  HIIT: "HIIT",
  SKILL_PRACTICE: "Skill practice",
  CALIBRATION_TEST: "Calibration test",
};

export default async function SessionsPage() {
  const sessions = await listSessions();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Session history</h1>
        <Link
          href="/log"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Log session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No sessions yet. Log your first one.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {TYPE_LABELS[s.type] ?? s.type}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {s.dateTime.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end text-xs text-zinc-500">
                  <span>{Math.round(s.durationSec / 60)} min</span>
                  {s.skipCount != null && (
                    <span>
                      {s.skipCount} skips{s.skipCountEstimated ? " (est.)" : ""}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
