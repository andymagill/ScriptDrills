import { describe, expect, it } from "vitest"
import { evaluateCode, stringifyResult } from "./run-code"

describe("evaluateCode", () => {
  it("runs a plain return statement", () => {
    const { result, error } = evaluateCode('return "hello";')
    expect(error).toBeNull()
    expect(result).toBe("hello")
  })

  it("transpiles and runs TypeScript syntax", () => {
    const { result, error } = evaluateCode(
      "const nums: number[] = [1, 2, 3];\nreturn nums.reduce((a, b) => a + b, 0);"
    )
    expect(error).toBeNull()
    expect(result).toBe(6)
  })

  it("returns undefined when the code never returns", () => {
    const { result, error } = evaluateCode("const x = 1;")
    expect(error).toBeNull()
    expect(result).toBeUndefined()
  })

  it("captures a thrown error's message instead of throwing", () => {
    const { result, error } = evaluateCode('throw new Error("boom");')
    expect(result).toBeNull()
    expect(error).toBe("boom")
  })

  it("captures a syntax error's message instead of throwing", () => {
    const { result, error } = evaluateCode("return (;")
    expect(result).toBeNull()
    expect(error).toBeTruthy()
  })
})

describe("stringifyResult", () => {
  it("passes strings through unchanged", () => {
    expect(stringifyResult("hello")).toBe("hello")
  })

  it("stringifies null and undefined as literal text", () => {
    expect(stringifyResult(null)).toBe("null")
    expect(stringifyResult(undefined)).toBe("undefined")
  })

  it("stringifies numbers and booleans via String()", () => {
    expect(stringifyResult(42)).toBe("42")
    expect(stringifyResult(true)).toBe("true")
  })

  it("JSON.stringifies objects and arrays", () => {
    expect(stringifyResult({ a: 1, b: [2, 3] })).toBe('{"a":1,"b":[2,3]}')
    expect(stringifyResult([1, 2, 3])).toBe("[1,2,3]")
  })

  it("falls back to String() when JSON.stringify would throw", () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(stringifyResult(circular)).toBe(String(circular))
  })
})
