type RemoteSession = {
  count: number;
  createdAt: number;
  lastSeenAt: number;
};

const IDLE_TTL_MS = 30 * 60 * 1000;
const CODE_LENGTH = 4;

const sessions = new Map<string, RemoteSession>();

function sweepExpired() {
  const now = Date.now();
  for (const [code, session] of sessions) {
    if (now - session.lastSeenAt > IDLE_TTL_MS) {
      sessions.delete(code);
    }
  }
}

function randomCode(): string {
  const n = Math.floor(Math.random() * 10 ** CODE_LENGTH);
  return String(n).padStart(CODE_LENGTH, "0");
}

export function createSession(): string {
  sweepExpired();
  let code = randomCode();
  while (sessions.has(code)) {
    code = randomCode();
  }
  sessions.set(code, {
    count: 0,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
  });
  return code;
}

export function getCount(code: string): number | null {
  sweepExpired();
  const session = sessions.get(code);
  if (!session) return null;
  return session.count;
}

export function incrementCount(code: string): number | null {
  sweepExpired();
  const session = sessions.get(code);
  if (!session) return null;
  session.count += 1;
  session.lastSeenAt = Date.now();
  return session.count;
}

export function decrementCount(code: string): number | null {
  sweepExpired();
  const session = sessions.get(code);
  if (!session) return null;
  session.count = Math.max(0, session.count - 1);
  session.lastSeenAt = Date.now();
  return session.count;
}

export function resetCount(code: string): boolean {
  sweepExpired();
  const session = sessions.get(code);
  if (!session) return false;
  session.count = 0;
  session.lastSeenAt = Date.now();
  return true;
}

export function touchSession(code: string): boolean {
  sweepExpired();
  const session = sessions.get(code);
  if (!session) return false;
  session.lastSeenAt = Date.now();
  return true;
}
