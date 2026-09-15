/**
 * Adaptation policy: the thresholds that decide when the teacher raises or
 * lowers the level, changes strategy, or retries. One place for the numbers
 * the lesson graph and (in phase 2) the question pools read. Lessons may
 * override any field; parents only set the start level.
 */
export interface AdaptationPolicy {
  /** Correct answers in a row before the level goes up. */
  levelUpAfterCorrect: number;
  /** Wrong answers in a row before the level goes down and the concept is re-explained. */
  levelDownAfterWrong: number;
  /** Unclear answers retried (not counted) before they count as wrong. */
  retryOnUnclear: number;
  /** Level the session starts at (1 = the lesson's first level). */
  startLevel: number;
  /** Highest level the session may reach; undefined = the lesson's last level. */
  maxLevel?: number;
}

export const DEFAULT_POLICY: AdaptationPolicy = {
  levelUpAfterCorrect: 2,
  levelDownAfterWrong: 2,
  retryOnUnclear: 1,
  startLevel: 1,
};

/** Merge lesson and parent overrides onto the defaults. */
export function resolvePolicy(...overrides: (Partial<AdaptationPolicy> | undefined)[]): AdaptationPolicy {
  return overrides.reduce<AdaptationPolicy>((acc, o) => ({ ...acc, ...(o ?? {}) }), { ...DEFAULT_POLICY });
}

/** Keep a level inside [1, min(maxLevel, levelCount)]. */
export function clampLevel(level: number, levelCount: number, policy: AdaptationPolicy = DEFAULT_POLICY): number {
  const top = Math.max(1, Math.min(levelCount, policy.maxLevel ?? levelCount));
  return Math.min(top, Math.max(1, Math.round(level) || 1));
}
