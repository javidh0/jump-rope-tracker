import { getUserSettings, updateUserSettings } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getUserSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-500">
          Personal preferences for how the app tracks and reminds you.
        </p>
      </div>

      <form action={updateUserSettings} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Weekly session target</span>
          <input
            type="number"
            name="weeklySessionTarget"
            min={1}
            defaultValue={settings.weeklySessionTarget}
            className="input w-32"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Preferred units</span>
          <select
            name="preferredUnits"
            defaultValue={settings.preferredUnits}
            className="input w-40"
          >
            <option value="metric">Metric</option>
            <option value="imperial">Imperial</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="reminderEnabled"
              defaultChecked={settings.reminderEnabled}
            />
            Daily reminder
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Reminder time</span>
            <input
              type="time"
              name="reminderTime"
              defaultValue={settings.reminderTime ?? "18:00"}
              className="input w-32"
            />
          </label>
          <p className="text-xs text-zinc-500">
            Note: this stores a preference only — push notifications aren&apos;t
            wired up yet in this version.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-300 p-3 opacity-60 dark:border-zinc-700">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" disabled checked={false} />
            Connect wearable / heart-rate monitor
          </label>
          <p className="text-xs text-zinc-500">
            Not available yet — true VO₂ max, heart-rate zones, and HRV-based
            recovery require a sensor. Coming in a future version.
          </p>
        </div>

        <button
          type="submit"
          className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save settings
        </button>
      </form>

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Data
        </h2>
        <p className="text-zinc-500">
          Your data is stored locally in a SQLite database for this app. There
          is no export tool yet — flag it if you need one.
        </p>
      </section>
    </div>
  );
}
