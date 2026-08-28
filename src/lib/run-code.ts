import { transpileTypeScript } from "@/lib/transpile"

export interface EvaluateResult {
  result: unknown
  error: string | null
}

/**
 * Transpiles TS to JS and runs it as a script body via `new Function`, exactly
 * as the user's submitted code is run. Used both to evaluate what the user
 * typed and - for randomized challenges - to run a challenge's `solve` script
 * against generated values, so both paths share one execution semantics.
 */
export function evaluateCode(code: string): EvaluateResult {
  try {
    const jsCode = transpileTypeScript(code)
    const wrapped = `"use strict";\n${jsCode}`
    const fn = new Function(wrapped)
    const result = fn()
    return { result, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { result: null, error: message }
  }
}

/**
 * Renders an evaluated value as the string compared against expectedOutput.
 * Strings pass through as-is; objects/arrays go through JSON.stringify;
 * everything else via String(). This is also how a randomized challenge's
 * `solve` return value becomes its expectedOutput, so authoring a solve
 * script never needs to call JSON.stringify itself.
 */
export function stringifyResult(value: unknown): string {
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (typeof value === "string") return value
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
