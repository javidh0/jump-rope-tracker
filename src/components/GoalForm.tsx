"use client";

import { useState } from "react";

const GOAL_TYPES = [
  { value: "FREQUENCY", label: "Sessions per week", unit: "sessions", placeholder: "3" },
  { value: "STREAK", label: "Day streak", unit: "days", placeholder: "7" },
  { value: "PROXY_TEST_TIME", label: "500-skip test time (lower is better)", unit: "sec", placeholder: "150" },
  { value: "UNBROKEN_STREAK", label: "Longest unbroken streak", unit: "skips", placeholder: "100" },
  { value: "SKILL_MILESTONE", label: "Skill milestone", unit: "", placeholder: "" },
];

const SKILL_TIERS = ["SINGLES", "DOUBLES", "CROSSOVERS", "TRIPLES"];

export default function GoalForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [type, setType] = useState("FREQUENCY");
  const current = GOAL_TYPES.find((t) => t.value === type)!;

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Goal type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input"
        >
          {GOAL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {type === "SKILL_MILESTONE" ? (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Skill tier</span>
            <select name="targetUnit" className="input">
              {SKILL_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="targetValue" value="1" />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Target value</span>
            <input
              type="number"
              name="targetValue"
              step="any"
              placeholder={current.placeholder}
              required
              className="input"
            />
          </label>
          <input type="hidden" name="targetUnit" value={current.unit} />
          <div className="mt-6 text-xs text-zinc-500">unit: {current.unit}</div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Target date (optional)</span>
        <input type="date" name="targetDate" className="input" />
      </label>

      <button
        type="submit"
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Add goal
      </button>
    </form>
  );
}
