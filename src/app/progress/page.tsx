import { getMetricsData, getSkillLadder } from "@/lib/actions";
import ProgressTabs from "@/components/ProgressTabs";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [metrics, ladder] = await Promise.all([
    getMetricsData(),
    getSkillLadder(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Progress</h1>
        <p className="text-sm text-zinc-500">
          Trends derived from your logged sessions and calibration tests.
        </p>
      </div>
      <ProgressTabs metrics={metrics} ladder={ladder} />
    </div>
  );
}
