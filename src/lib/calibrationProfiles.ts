export type CalibrationProfile = {
  id: string;
  name: string;
  threshold: number;
  createdAt: string;
};

const STORAGE_KEY = "jumpRope.calibrationProfiles";

function readAll(): CalibrationProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(profiles: CalibrationProfile[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function listCalibrationProfiles(): CalibrationProfile[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveCalibrationProfile(
  name: string,
  threshold: number
): CalibrationProfile {
  const profile: CalibrationProfile = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    threshold,
    createdAt: new Date().toISOString(),
  };
  const profiles = readAll();
  profiles.push(profile);
  writeAll(profiles);
  return profile;
}

export function removeCalibrationProfile(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function getCalibrationProfile(
  id: string
): CalibrationProfile | undefined {
  return readAll().find((p) => p.id === id);
}
