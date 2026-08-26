import Link from "next/link";
import {
  getDashboardStats,
  getSuggestedWorkout,
  listSessions,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats, sessions, suggestion] = await Promise.all([
    getDashboardStats(),
    listSessions(),
    getSuggestedWorkout(),
  ]);
  const recent = sessions.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-3 gap-4">
        <StatCard
          label="This week"
          value={`${stats.sessionsThisWeek} / ${stats.weeklyTarget}`}
          hint="sessions"
        />
        <StatCard label="Current streak" value={`${stats.streak}`} hint="days" />
        <StatCard
          label="Total sessions"
          value={`${stats.totalSessions}`}
          hint="all time"
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Suggested today
        </p>
        <p className="mt-1 text-sm">{suggestion.message}</p>
        {suggestion.workout && (
          <Link
            href={`/workouts/${suggestion.workout.id}/run`}
            className="mt-3 inline-block rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start {suggestion.workout.name}
          </Link>
        )}
      </section>

      <section className="flex gap-3">
        <Link
          href="/log"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Log a session
        </Link>
        <Link
          href="/sessions"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          View history
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Recent sessions
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No sessions logged yet. Log your first one to get started.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {recent.map((s) => (
              <li key={s.id} className="p-3 text-sm">
                <Link
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between hover:underline"
                >
                  <span>
                    {s.dateTime.toLocaleDateString()} · {s.type}
                  </span>
                  <span className="text-zinc-500">
                    {Math.round(s.durationSec / 60)} min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
