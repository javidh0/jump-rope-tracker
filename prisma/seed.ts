import { PrismaClient, SessionType, SkillTier } from "@prisma/client";

const prisma = new PrismaClient();

const presetWorkouts = [
  {
    name: "Beginner HIIT",
    isPreset: true,
    workSec: 30,
    restSec: 30,
    rounds: 8,
    warmupSec: 60,
    cooldownSec: 60,
    type: SessionType.HIIT,
  },
  {
    name: "Anaerobic Capacity Builder",
    isPreset: true,
    workSec: 40,
    restSec: 20,
    rounds: 10,
    warmupSec: 90,
    cooldownSec: 60,
    type: SessionType.HIIT,
  },
  {
    name: "Endurance Steady-State",
    isPreset: true,
    workSec: 900,
    restSec: 0,
    rounds: 1,
    warmupSec: 60,
    cooldownSec: 60,
    type: SessionType.STEADY_STATE,
  },
  {
    name: "Double-Under Skill Ladder",
    isPreset: true,
    workSec: 20,
    restSec: 40,
    rounds: 12,
    warmupSec: 60,
    cooldownSec: 30,
    type: SessionType.SKILL_PRACTICE,
  },
];

const skillLadder = [
  {
    tier: SkillTier.SINGLES,
    order: 1,
    unlockCriteria: "5 minutes of unbroken single jumps",
  },
  {
    tier: SkillTier.DOUBLES,
    order: 2,
    unlockCriteria: "10 unbroken double-unders",
  },
  {
    tier: SkillTier.CROSSOVERS,
    order: 3,
    unlockCriteria: "10 unbroken crossovers",
  },
  {
    tier: SkillTier.TRIPLES,
    order: 4,
    unlockCriteria: "3 unbroken triple-unders",
  },
];

async function main() {
  for (const workout of presetWorkouts) {
    await prisma.workout.upsert({
      where: { name: workout.name },
      update: workout,
      create: workout,
    });
  }

  for (const entry of skillLadder) {
    await prisma.skillLadderEntry.upsert({
      where: { tier: entry.tier },
      update: entry,
      create: entry,
    });
  }

  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
