import { describe, expect, it } from "vitest"
import { selectChallenge } from "./challenge-select"
import type { Challenge } from "@/types"

function fixture(id: string, difficulty: Challenge["difficulty"]): Challenge {
  return {
    id,
    title: id,
    difficulty,
    description: "",
    hints: [],
    starterCode: "",
    expectedOutput: "",
    explanation: "",
  }
}

const pool: Challenge[] = [
  fixture("e1", "easy"),
  fixture("e2", "easy"),
  fixture("e3", "easy"),
  fixture("m1", "medium"),
  fixture("m2", "medium"),
  fixture("m3", "medium"),
  fixture("h1", "hard"),
  fixture("h2", "hard"),
  fixture("h3", "hard"),
]

describe("selectChallenge", () => {
  it("only ever returns challenges from the requested tier", () => {
    for (let i = 0; i < 200; i++) {
      expect(selectChallenge(pool, { difficulty: "hard" }).difficulty).toBe("hard")
    }
  })

  it("never relaxes the difficulty filter, even when every candidate in the tier is excluded", () => {
    for (let i = 0; i < 50; i++) {
      const result = selectChallenge(pool, {
        difficulty: "hard",
        excludeIds: ["h1", "h2", "h3"],
      })
      expect(result.difficulty).toBe("hard")
    }
  })

  it("honors exclusion when the pool can still satisfy it", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const result = selectChallenge(pool, {
        difficulty: "easy",
        excludeIds: ["e1"],
      })
      expect(result.id).not.toBe("e1")
      seen.add(String(result.id))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it("relaxes the recency window from the oldest id first", () => {
    const small = [fixture("a", "easy"), fixture("b", "easy"), fixture("c", "easy")]
    // Newest-first: c is most recent, a is oldest.
    for (let i = 0; i < 30; i++) {
      const result = selectChallenge(small, { excludeIds: ["c", "b", "a"] })
      expect(result.id).toBe("a")
    }
  })

  it("ignores excluded ids that aren't in the pool when relaxing", () => {
    const small = [fixture("a", "easy"), fixture("b", "easy"), fixture("c", "easy")]
    for (let i = 0; i < 30; i++) {
      const result = selectChallenge(small, { excludeIds: ["c", "b", "a", "z"] })
      expect(result.id).toBe("a")
    }
  })

  it("returns the sole candidate even when it is excluded", () => {
    const single = [fixture("only", "hard")]
    const result = selectChallenge(single, { difficulty: "hard", excludeIds: ["only"] })
    expect(result.id).toBe("only")
  })

  it("does not let duplicate excluded ids consume extra ladder rungs", () => {
    const small = [fixture("a", "easy"), fixture("b", "easy"), fixture("c", "easy")]
    for (let i = 0; i < 30; i++) {
      const result = selectChallenge(small, { excludeIds: ["c", "c", "b", "a"] })
      expect(result.id).toBe("a")
    }
  })

  it("normalizes string/number id mismatches", () => {
    const numeric = [fixture("7", "easy"), fixture("8", "easy")]
    for (let i = 0; i < 30; i++) {
      const result = selectChallenge(numeric, { excludeIds: [7] })
      expect(String(result.id)).toBe("8")
    }
  })

  it("draws from every tier when no difficulty is requested", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      seen.add(selectChallenge(pool).difficulty)
    }
    expect(seen).toEqual(new Set(["easy", "medium", "hard"]))
  })

  it("falls back to the full set when the requested tier is empty", () => {
    const easyOnly = [fixture("e1", "easy")]
    const result = selectChallenge(easyOnly, { difficulty: "hard" })
    expect(result.id).toBe("e1")
  })

  it("throws when there are no challenges at all", () => {
    expect(() => selectChallenge([])).toThrow()
  })
})
