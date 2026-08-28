import { describe, expect, it } from "vitest"
import { instantiateChallenge } from "./challenge-instance"
import { evaluateCode, stringifyResult } from "./run-code"
import challengesData from "@/data/drill-challenges.json"
import type { Challenge } from "@/types"

const staticChallenge: Challenge = {
  id: "test-static",
  title: "Static Challenge",
  description: "A static challenge.",
  objective: "Do the thing.",
  hints: ["hint one", "hint two"],
  starterCode: "const x = 1;\n// TODO\n",
  expectedOutput: "42",
  explanation: "Because reasons.",
}

const randomizedChallenge: Challenge = {
  ...staticChallenge,
  id: "test-randomized",
  randomize: {
    generate: "return { n: randInt(1, 100) }",
    solve: "return n * 2",
    starterCode: "const n = {{n}};\n// TODO: double it\n",
    objective: "Double {{n}}. Expected: {{__answer}}.",
    hints: ["It's {{n}} times two."],
  },
}

const brokenChallenge: Challenge = {
  ...staticChallenge,
  id: "test-broken",
  randomize: {
    generate: "throw new Error('nope')",
    solve: "return 1",
  },
}

describe("instantiateChallenge - static (no randomize)", () => {
  it("passes through the source fields unchanged", () => {
    const instance = instantiateChallenge(staticChallenge)
    expect(instance).toEqual({
      challengeId: "test-static",
      title: "Static Challenge",
      description: "A static challenge.",
      objective: "Do the thing.",
      hints: ["hint one", "hint two"],
      starterCode: "const x = 1;\n// TODO\n",
      expectedOutput: "42",
      explanation: "Because reasons.",
    })
  })
})

describe("instantiateChallenge - randomized", () => {
  it("substitutes generated values and the computed answer into starterCode/objective/hints", () => {
    const instance = instantiateChallenge(randomizedChallenge)
    const match = instance.starterCode.match(/const n = (\d+);/)
    expect(match).not.toBeNull()
    const n = Number(match?.[1])
    expect(instance.expectedOutput).toBe(String(n * 2))
    expect(instance.objective).toBe(`Double ${n}. Expected: ${n * 2}.`)
    expect(instance.hints[0]).toBe(`It's ${n} times two.`)
  })

  it("leaves a field untouched when randomize doesn't override it", () => {
    const instance = instantiateChallenge(randomizedChallenge)
    expect(instance.description).toBe("A static challenge.")
  })

  it("produces varying expectedOutput across many rolls", () => {
    const outputs = new Set(
      Array.from(
        { length: 20 },
        () => instantiateChallenge(randomizedChallenge).expectedOutput
      )
    )
    expect(outputs.size).toBeGreaterThan(1)
  })

  it("falls back to the static, non-templated fields when generate/solve throws", () => {
    const instance = instantiateChallenge(brokenChallenge)
    expect(instance.starterCode).toBe(staticChallenge.starterCode)
    expect(instance.expectedOutput).toBe(staticChallenge.expectedOutput)
    expect(instance.starterCode).not.toContain("{{")
  })
})

describe("instantiateChallenge - data-integrity sweep over drill-challenges.json", () => {
  const challenges = challengesData as Challenge[]
  const randomized = challenges.filter((c) => c.randomize)

  it("has at least one randomized challenge to sweep", () => {
    expect(randomized.length).toBeGreaterThan(0)
  })

  it("has unique ids across all challenges", () => {
    const ids = challenges.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("no challenge's default instance leaks its answer via an unsolved starterCode", () => {
    for (const challenge of challenges) {
      const instance = instantiateChallenge(challenge)
      const { result, error } = evaluateCode(instance.starterCode)
      if (!error) {
        expect(
          stringifyResult(result),
          `${challenge.id}: unsolved starterCode already equals expectedOutput`
        ).not.toBe(instance.expectedOutput)
      }
    }
  })

  for (const challenge of randomized) {
    it(`${challenge.id}: rolls stay valid and don't leak across many instantiations`, () => {
      for (let i = 0; i < 20; i++) {
        const instance = instantiateChallenge(challenge)

        const allText = [
          instance.description,
          instance.objective ?? "",
          ...instance.hints,
          instance.starterCode,
        ].join("\n")
        expect(allText).not.toContain("{{")

        expect(instance.expectedOutput.length).toBeGreaterThan(0)

        // Same answer-leak invariant every challenge must hold statically,
        // now checked per roll: the unfilled TODO stub must not already
        // satisfy expectedOutput.
        const { result, error } = evaluateCode(instance.starterCode)
        if (!error) {
          expect(stringifyResult(result)).not.toBe(instance.expectedOutput)
        }
      }
    })
  }
})
