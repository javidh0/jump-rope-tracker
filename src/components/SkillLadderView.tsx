import type { SkillLadderEntry } from "@prisma/client";

const TIER_LABELS: Record<string, string> = {
  SINGLES: "Singles",
  DOUBLES: "Doubles",
  CROSSOVERS: "Crossovers",
  TRIPLES: "Triples",
};

export default function SkillLadderView({
  ladder,
}: {
  ladder: SkillLadderEntry[];
}) {
  return (
    <ol className="flex flex-col gap-2">
      {ladder.map((entry, i) => (
        <li
          key={entry.id}
          className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
            entry.achieved
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
              : "border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              entry.achieved
                ? "bg-emerald-500 text-white"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {entry.achieved ? "✓" : i + 1}
          </span>
          <div className="flex flex-col">
            <span className="font-medium">
              {TIER_LABELS[entry.tier] ?? entry.tier}
            </span>
            <span className="text-xs text-zinc-500">
              {entry.unlockCriteria}
              {entry.achieved && entry.achievedAt
                ? ` · achieved ${entry.achievedAt.toLocaleDateString()}`
                : ""}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
