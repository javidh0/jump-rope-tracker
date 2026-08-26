"use client";

import { useState } from "react";
import type { SkillLadderEntry } from "@prisma/client";
import MetricChart, { type MetricPoint } from "@/components/MetricChart";
import SkillLadderView from "@/components/SkillLadderView";

type Metrics = {
  cardioEndurance: MetricPoint[];
  anaerobicCapacity: MetricPoint[];
  coordination: MetricPoint[];
  legEndurance: MetricPoint[];
  recovery: MetricPoint[];
};

const TABS = [
  { key: "cardio", label: "Cardio & Endurance" },
  { key: "anaerobic", label: "Anaerobic Capacity" },
  { key: "coordination", label: "Coordination" },
  { key: "legs", label: "Leg Endurance" },
  { key: "skill", label: "Skill Level" },
  { key: "recovery", label: "Recovery" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProgressTabs({
  metrics,
  ladder,
}: {
  metrics: Metrics;
  ladder: SkillLadderEntry[];
}) {
  const [tab, setTab] = useState<TabKey>("cardio");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              tab === t.key
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cardio" && (
        <TabPanel
          title="Cardio & aerobic endurance"
          hint="Proxy: time for 500 skips (calibration test). Lower is better."
        >
          <MetricChart
            data={metrics.cardioEndurance}
            unit="sec"
            emptyMessage="Log a 'Time for 500 skips' calibration test to start tracking this."
          />
        </TabPanel>
      )}

      {tab === "anaerobic" && (
        <TabPanel
          title="Anaerobic capacity"
          hint="Proxy: max skips/double-unders in a fixed window. Higher is better."
        >
          <MetricChart
            data={metrics.anaerobicCapacity}
            emptyMessage="Log a max-skips or max-double-unders calibration test to start tracking this."
          />
        </TabPanel>
      )}

      {tab === "coordination" && (
        <TabPanel
          title="Coordination / rhythm"
          hint="Miss rate per 100 skips. Lower is better."
        >
          <MetricChart
            data={metrics.coordination}
            unit="misses/100"
            emptyMessage="Log misses and skip count together in a session to start tracking this."
          />
        </TabPanel>
      )}

      {tab === "legs" && (
        <TabPanel
          title="Leg muscular endurance"
          hint="Longest unbroken streak per session. Higher is better."
        >
          <MetricChart
            data={metrics.legEndurance}
            unit="skips"
            emptyMessage="Log your longest unbroken streak in a session to start tracking this."
          />
        </TabPanel>
      )}

      {tab === "skill" && (
        <TabPanel
          title="Skill progression"
          hint="Unlocked automatically from unbroken-streak milestones you log."
        >
          <SkillLadderView ladder={ladder} />
        </TabPanel>
      )}

      {tab === "recovery" && (
        <TabPanel
          title="Recovery (self-reported)"
          hint="Soreness (1-5) per session. Lower is better — no wearable needed."
        >
          <MetricChart
            data={metrics.recovery}
            unit="/5"
            emptyMessage="Log soreness in a session to start tracking this."
          />
        </TabPanel>
      )}
    </div>
  );
}

function TabPanel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
      {children}
    </div>
  );
}
