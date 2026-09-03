import type { Challenge, Difficulty } from "@/types"

export const RECENT_WINDOW = 5

export interface SelectChallengeOptions {
  difficulty?: Difficulty
  /** Newest-first ids to avoid, e.g. [currentId, ...recentIds]. */
  excludeIds?: (string | number)[]
}

/**
 * Picks a random challenge. The difficulty filter is never relaxed - if the
 * requested tier is empty (a data bug, not a user-visible state) this falls
 * back to the full set rather than throwing. The recency exclusion IS relaxed
 * progressively when it would otherwise leave no candidates, dropping the
 * OLDEST ids first so the current/most-recent challenge stays excluded longest.
 */
export function selectChallenge(
  challenges: Challenge[],
  opts: SelectChallengeOptions = {}
): Challenge {
  if (challenges.length === 0) {
    throw new Error("selectChallenge: no challenges available")
  }

  const tier = opts.difficulty
    ? challenges.filter((c) => c.difficulty === opts.difficulty)
    : challenges
  const pool = tier.length > 0 ? tier : challenges

  // Ids are string|number on both sides (Challenge.id, ActivityEntry.challengeId)
  // and the activity log is uncapped and never migrated, so normalize before
  // comparing. Dedup here (not at the call site) so the caller can safely
  // prepend the current id even when it's also the newest log entry.
  const exclude = [...new Set((opts.excludeIds ?? []).map(String))]

  let candidates = pool
  for (let cut = exclude.length; cut > 0; cut--) {
    const banned = new Set(exclude.slice(0, cut))
    const filtered = pool.filter((c) => !banned.has(String(c.id)))
    if (filtered.length > 0) {
      candidates = filtered
      break
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}
