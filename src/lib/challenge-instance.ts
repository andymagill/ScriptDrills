import { transpileTypeScript } from "@/lib/transpile"
import { evaluateCode, stringifyResult } from "@/lib/run-code"
import type { Challenge, ChallengeInstance } from "@/types"

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function runGenerate(source: string): Record<string, unknown> {
  const js = transpileTypeScript(source)
  const fn = new Function("randInt", "randFrom", "shuffle", `"use strict";\n${js}`)
  const values = fn(randInt, randFrom, shuffle)
  if (values === null || typeof values !== "object") {
    throw new Error("generate must return an object of named values")
  }
  return values as Record<string, unknown>
}

function runSolve(source: string, values: Record<string, unknown>): unknown {
  const js = transpileTypeScript(source)
  const keys = Object.keys(values)
  const fn = new Function(...keys, `"use strict";\n${js}`)
  return fn(...keys.map((k) => values[k]))
}

// {{name}} -> JSON.stringify(values[name]); {{__answer}} -> the computed
// expectedOutput string, used raw (it's already the exact text to show).
function substitute(
  text: string,
  values: Record<string, unknown>,
  answer: string
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (token, name: string) => {
    if (name === "__answer") return answer
    if (name in values) return JSON.stringify(values[name])
    return token
  })
}

/**
 * Produces the concrete instance the UI renders and grades against. Static
 * challenges (no `randomize`) pass through unchanged. Randomized challenges
 * get fresh generate -> solve -> substitute on every call, so calling this
 * twice for the same Challenge can yield different instances by design -
 * callers that need a stable instance across renders/reloads must persist
 * the returned instance themselves (see ActiveChallenge.instance).
 *
 * A malformed generate/solve script degrades that single challenge to its
 * static fields rather than breaking the app.
 */
export function instantiateChallenge(challenge: Challenge): ChallengeInstance {
  const base: ChallengeInstance = {
    challengeId: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty,
    description: challenge.description,
    objective: challenge.objective,
    hints: challenge.hints,
    starterCode: challenge.starterCode,
    expectedOutput: challenge.expectedOutput,
    explanation: challenge.explanation,
  }

  const r = challenge.randomize
  if (!r) return base

  try {
    const values = runGenerate(r.generate)
    const answer = runSolve(r.solve, values)
    const expectedOutput = stringifyResult(answer)
    const sub = (text: string) => substitute(text, values, expectedOutput)

    return {
      ...base,
      description: sub(r.description ?? challenge.description),
      objective:
        challenge.objective !== undefined
          ? sub(r.objective ?? challenge.objective)
          : undefined,
      hints: (r.hints ?? challenge.hints).map(sub),
      starterCode: sub(r.starterCode ?? challenge.starterCode),
      expectedOutput,
    }
  } catch (err) {
    console.warn(
      `Challenge ${challenge.id} randomize failed, falling back to static content:`,
      err
    )
    return base
  }
}

// Re-exported so authoring/testing code can evaluate a rolled instance's
// starterCode the same way Practice.tsx evaluates user-submitted code.
export { evaluateCode, stringifyResult }
