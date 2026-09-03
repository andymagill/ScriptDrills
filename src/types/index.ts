export interface ChallengeRandomization {
  /** JS body. Returns an object of named values, e.g. `return { nums: [1,2,3] }`. */
  generate: string
  /** JS body. Named values from `generate` are in scope as bindings; returns the correct answer. */
  solve: string
  /**
   * Template overrides, substituted with generated values (`{{name}}`) and the
   * computed answer (`{{__answer}}`). Each is optional and falls back to the
   * Challenge's own field when omitted - e.g. `description` rarely needs an
   * override since most descriptions don't name concrete values, while
   * `starterCode` almost always does.
   *
   * The *un-substituted* top-level Challenge fields (starterCode/description/
   * objective/hints/expectedOutput) stay a fully valid, concrete worked
   * example on their own - not a template - so if generate/solve ever throws,
   * the fallback is real content, never raw `{{...}}` text.
   */
  starterCode?: string
  description?: string
  objective?: string
  hints?: string[]
}

export type Difficulty = "easy" | "medium" | "hard"

/** What the difficulty picker emits; "any" is the Random default. */
export type DifficultyFilter = Difficulty | "any"

export interface Challenge {
  id: string | number
  title: string
  difficulty: Difficulty
  description: string
  objective?: string
  hints: string[]
  starterCode: string
  expectedOutput: string
  explanation: string
  /** Opt-in. When present, each load rolls fresh values - see ChallengeRandomization. */
  randomize?: ChallengeRandomization
}

/**
 * A challenge with one roll of values baked in - what the UI actually renders
 * and grades against. For a non-randomized Challenge this is just its static
 * fields; for a randomized one, `{{placeholder}}` tokens have been substituted
 * and `expectedOutput` was computed fresh by running `randomize.solve`.
 */
export interface ChallengeInstance {
  challengeId: string | number
  title: string
  difficulty: Difficulty
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
  /** The instance's expectedOutput at attempt time. Only set for randomized
   *  challenges - static ones can always look this up from the source data. */
  expectedOutput?: string
}

export interface UserStats {
  totalCorrect: number
  totalIncorrect: number
  totalSkipped: number
}

export interface ActiveChallenge {
  challengeId: string | number
  currentCode: string
  /** The rolled instance being worked on. Optional so state saved before this
   *  field existed still loads; absent means "look up the static challenge." */
  instance?: ChallengeInstance
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
