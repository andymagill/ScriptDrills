export interface Challenge {
  id: string | number
  title: string
  description: string
  objective?: string
  hints: string[]
  starterCode: string
  expectedOutput: string
  explanation: string
}

export type ActivityStatus = "correct" | "incorrect" | "skipped"

export interface ActivityEntry {
  id: string
  challengeId: string | number
  challengeTitle: string
  status: ActivityStatus
  submittedCode: string
  timestamp: number
}

export interface UserStats {
  totalCorrect: number
  totalIncorrect: number
  totalSkipped: number
}

export interface ActiveChallenge {
  challengeId: string | number
  currentCode: string
}

export interface ChallengeSummary {
  challengeId: string | number
  challengeTitle: string
  bestStatus: ActivityStatus
  attemptCount: number
  lastAttemptAt: number
}

export interface AppStorage {
  stats: UserStats
  activityLog: ActivityEntry[]
  activeChallenge: ActiveChallenge | null
}
