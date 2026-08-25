import type { AppStorage, UserStats, ActivityEntry, ActiveChallenge } from "@/types"

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
  state.activityLog = [newEntry, ...state.activityLog].slice(0, 100)

  if (entry.status === "correct") state.stats.totalCorrect++
  else if (entry.status === "incorrect") state.stats.totalIncorrect++
  else state.stats.totalSkipped++

  save(state)
}

export function clearAll(): void {
  save(structuredClone(DEFAULT_STATE))
}
