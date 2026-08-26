import {
  createGoal,
  deleteGoal,
  getGoalsWithProgress,
  updateGoalStatus,
} from "@/lib/actions";
import GoalForm from "@/components/GoalForm";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  FREQUENCY: "Sessions per week",
  STREAK: "Day streak",
  PROXY_TEST_TIME: "500-skip test time",
  UNBROKEN_STREAK: "Longest unbroken streak",
  SKILL_MILESTONE: "Skill milestone",
};

export default async function GoalsPage() {
  const goals = await getGoalsWithProgress();
  const active = goals.filter((g) => g.status === "ACTIVE");
  const done = goals.filter((g) => g.status !== "ACTIVE");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Goals</h1>
        <p className="text-sm text-zinc-500">
          Track progress toward specific, measurable targets.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Active
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">No active goals yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {TYPE_LABELS[g.type] ?? g.type}
                  </span>
                  {g.targetDate && (
                    <span className="text-xs text-zinc-500">
                      by {g.targetDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{g.detail}</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-zinc-900 dark:bg-white"
                    style={{ width: `${g.progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {g.progressPct}% complete
                  </span>
                  <div className="flex gap-3">
                    <form action={updateGoalStatus.bind(null, g.id, "ACHIEVED")}>
                      <button
                        type="submit"
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        Mark achieved
                      </button>
                    </form>
                    <form action={deleteGoal.bind(null, g.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Archive
          </h2>
          <ul className="flex flex-col gap-2">
            {done.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <span>{TYPE_LABELS[g.type] ?? g.type}</span>
                <span className="text-xs text-zinc-500">{g.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Add a goal
        </h2>
        <GoalForm action={createGoal} />
      </section>
    </div>
  );
}
