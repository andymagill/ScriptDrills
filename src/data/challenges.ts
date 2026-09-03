import raw from "./drill-challenges.json"
import type { Challenge, Difficulty } from "@/types"

const DIFFICULTIES = ["easy", "medium", "hard"] as const

function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value)
}

// `raw as Challenge[]` would compile but verify nothing here: TS's `as` uses the
// comparable relation, so the JSON's inferred `difficulty: string` silently
// launders into the union type even for a typo'd or missing value. This guarded
// map makes every other field a real assignability check and narrows
// `difficulty` with an actual predicate, so a bad entry fails at build/import
// time instead of silently reaching the UI.
export const challenges: Challenge[] = raw.map((c) => {
  if (!isDifficulty(c.difficulty)) {
    throw new Error(`challenge ${c.id}: invalid difficulty ${JSON.stringify(c.difficulty)}`)
  }
  return { ...c, difficulty: c.difficulty }
})

const byId = new Map(challenges.map((c) => [String(c.id), c]))

export function findChallenge(id: string | number): Challenge | undefined {
  return byId.get(String(id))
}
