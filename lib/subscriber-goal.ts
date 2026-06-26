export const DEFAULT_SUBSCRIBER_GOAL = 10_000;

export function getSubscriberGoal(): number {
  const fromEnv = process.env.SUBSCRIBER_GOAL?.trim();
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_SUBSCRIBER_GOAL;
}

export type SubscriberGoalProgress = {
  goal: number;
  current: number;
  remaining: number;
  progressPct: number;
  reached: boolean;
};

export function getSubscriberGoalProgress(activeSubscribers: number): SubscriberGoalProgress {
  const goal = getSubscriberGoal();
  const current = Math.max(0, activeSubscribers);
  const remaining = Math.max(0, goal - current);
  const progressPct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  return {
    goal,
    current,
    remaining,
    progressPct,
    reached: current >= goal,
  };
}

export function formatSubscriberCount(value: number): string {
  return value.toLocaleString("en-ZA");
}
