import type {
  AppStorage,
  UserStats,
  ActivityEntry,
  ActiveChallenge,
  ActivityStatus,
  ChallengeSummary,
} from "@/types"

const STORAGE_KEY = "ts-sandbox-state"

const DEFAULT_STATE: AppStorage = {
  stats: { totalCorrect: 0, totalIncorrect: 0, totalSkipped: 0 },
  activityLog: [],
  activeChallenge: null,
}

function load(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_STATE)
    return JSON.parse(raw) as AppStorage
  } catch {
    return structuredClone(DEFAULT_STATE)
  }
}

function save(state: AppStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getStats(): UserStats {
  return load().stats
}

export function getActivityLog(): ActivityEntry[] {
  return load().activityLog
}

export function getActiveChallenge(): ActiveChallenge | null {
  return load().activeChallenge
}

export function setActiveChallenge(active: ActiveChallenge | null): void {
  const state = load()
  state.activeChallenge = active
  save(state)
}

export function recordResult(
  entry: Omit<ActivityEntry, "id" | "timestamp">
): void {
  const state = load()
  const newEntry: ActivityEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  state.activityLog = [newEntry, ...state.activityLog]

  if (entry.status === "correct") state.stats.totalCorrect++
  else if (entry.status === "incorrect") state.stats.totalIncorrect++
  else state.stats.totalSkipped++

  save(state)
}

export function clearAll(): void {
  save(structuredClone(DEFAULT_STATE))
}

// "Finished" beats "skipped" beats "incorrect" when summarizing a challenge's
// best-ever outcome across multiple attempts.
function statusRank(status: ActivityStatus): number {
  if (status === "correct") return 2
  if (status === "skipped") return 1
  return 0
}

export function getChallengeHistory(challengeId: string | number): ActivityEntry[] {
  return getActivityLog().filter(
    (entry) => String(entry.challengeId) === String(challengeId)
  )
}

// Distinct challenge ids from the activity log, newest-first, any outcome
// (correct/incorrect/skipped all count) - used to avoid repeating recently
// attempted challenges. The log is uncapped, so this breaks early at `limit`
// rather than deduping the whole thing on every call.
export function getRecentChallengeIds(limit = 5): (string | number)[] {
  const seen = new Set<string>()
  const ids: (string | number)[] = []
  for (const entry of getActivityLog()) {
    const key = String(entry.challengeId)
    if (seen.has(key)) continue
    seen.add(key)
    ids.push(entry.challengeId)
    if (ids.length >= limit) break
  }
  return ids
}

export function getChallengeSummaries(): ChallengeSummary[] {
  const summaries = new Map<string, ChallengeSummary>()

  for (const entry of getActivityLog()) {
    const key = String(entry.challengeId)
    const existing = summaries.get(key)
    if (!existing) {
      summaries.set(key, {
        challengeId: entry.challengeId,
        challengeTitle: entry.challengeTitle,
        bestStatus: entry.status,
        attemptCount: 1,
        lastAttemptAt: entry.timestamp,
      })
      continue
    }
    existing.attemptCount++
    existing.lastAttemptAt = Math.max(existing.lastAttemptAt, entry.timestamp)
    if (statusRank(entry.status) > statusRank(existing.bestStatus)) {
      existing.bestStatus = entry.status
    }
  }

  return Array.from(summaries.values()).sort(
    (a, b) => b.lastAttemptAt - a.lastAttemptAt
  )
}

// Distinct challenges the user has finished (solved or skipped) - the active,
// still-in-progress challenge (if any) isn't counted until it's finished.
export function getFinishedChallengeCount(): number {
  const finished = new Set<string>()
  for (const entry of getActivityLog()) {
    if (entry.status === "correct" || entry.status === "skipped") {
      finished.add(String(entry.challengeId))
    }
  }
  return finished.size
}
