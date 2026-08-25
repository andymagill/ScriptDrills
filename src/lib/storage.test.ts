import { beforeEach, describe, expect, it } from "vitest"
import {
  clearAll,
  getActiveChallenge,
  getActivityLog,
  getStats,
  recordResult,
  setActiveChallenge,
} from "./storage"

const STORAGE_KEY = "ts-sandbox-state"

beforeEach(() => {
  localStorage.clear()
})

describe("getStats / getActivityLog / getActiveChallenge", () => {
  it("return defaults when nothing is stored", () => {
    expect(getStats()).toEqual({
      totalCorrect: 0,
      totalIncorrect: 0,
      totalSkipped: 0,
    })
    expect(getActivityLog()).toEqual([])
    expect(getActiveChallenge()).toBeNull()
  })

  it("fall back to defaults when stored JSON is corrupted", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json")
    expect(getStats()).toEqual({
      totalCorrect: 0,
      totalIncorrect: 0,
      totalSkipped: 0,
    })
  })
})

describe("setActiveChallenge", () => {
  it("persists and retrieves the active challenge", () => {
    setActiveChallenge({ challengeId: "ts-001", currentCode: "return 1;" })
    expect(getActiveChallenge()).toEqual({
      challengeId: "ts-001",
      currentCode: "return 1;",
    })
  })

  it("clears the active challenge when set to null", () => {
    setActiveChallenge({ challengeId: "ts-001", currentCode: "return 1;" })
    setActiveChallenge(null)
    expect(getActiveChallenge()).toBeNull()
  })
})

describe("recordResult", () => {
  it("increments totalCorrect and prepends a timestamped entry for a correct result", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "return \"Hello, TypeScript!\";",
    })

    expect(getStats()).toEqual({
      totalCorrect: 1,
      totalIncorrect: 0,
      totalSkipped: 0,
    })

    const log = getActivityLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
    })
    expect(log[0].id).toBeTruthy()
    expect(typeof log[0].timestamp).toBe("number")
  })

  it("increments totalIncorrect for an incorrect result", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "incorrect",
      submittedCode: "return 1;",
    })
    expect(getStats().totalIncorrect).toBe(1)
  })

  it("increments totalSkipped for a skipped result", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "skipped",
      submittedCode: "",
    })
    expect(getStats().totalSkipped).toBe(1)
  })

  it("prepends new entries so the most recent attempt is first", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "First",
      status: "correct",
      submittedCode: "",
    })
    recordResult({
      challengeId: "ts-002",
      challengeTitle: "Second",
      status: "incorrect",
      submittedCode: "",
    })

    const log = getActivityLog()
    expect(log[0].challengeTitle).toBe("Second")
    expect(log[1].challengeTitle).toBe("First")
  })

  it("caps the activity log at 100 entries, dropping the oldest", () => {
    for (let i = 0; i < 101; i++) {
      recordResult({
        challengeId: `ts-${i}`,
        challengeTitle: `Challenge ${i}`,
        status: "correct",
        submittedCode: "",
      })
    }

    const log = getActivityLog()
    expect(log).toHaveLength(100)
    // Most recent (id 100) is first; oldest (id 0) was dropped.
    expect(log[0].challengeTitle).toBe("Challenge 100")
    expect(log.find((e) => e.challengeTitle === "Challenge 0")).toBeUndefined()
  })
})

describe("clearAll", () => {
  it("resets stats, activity log, and active challenge back to defaults", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "",
    })
    setActiveChallenge({ challengeId: "ts-001", currentCode: "return 1;" })

    clearAll()

    expect(getStats()).toEqual({
      totalCorrect: 0,
      totalIncorrect: 0,
      totalSkipped: 0,
    })
    expect(getActivityLog()).toEqual([])
    expect(getActiveChallenge()).toBeNull()
  })
})
