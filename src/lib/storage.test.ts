import { beforeEach, describe, expect, it } from "vitest"
import {
  clearAll,
  getActiveChallenge,
  getActivityLog,
  getChallengeHistory,
  getChallengeSummaries,
  getFinishedChallengeCount,
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

  it("keeps every entry with no cap, so history stays complete", () => {
    for (let i = 0; i < 150; i++) {
      recordResult({
        challengeId: `ts-${i}`,
        challengeTitle: `Challenge ${i}`,
        status: "correct",
        submittedCode: "",
      })
    }

    const log = getActivityLog()
    expect(log).toHaveLength(150)
    expect(log[0].challengeTitle).toBe("Challenge 149")
    expect(log.find((e) => e.challengeTitle === "Challenge 0")).toBeDefined()
  })
})

describe("getChallengeHistory", () => {
  it("returns only entries for the given challenge, newest first", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "incorrect",
      submittedCode: "return 1;",
    })
    recordResult({
      challengeId: "ts-002",
      challengeTitle: "Sum Two Numbers",
      status: "correct",
      submittedCode: "return 100;",
    })
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "return \"Hello, TypeScript!\";",
    })

    const history = getChallengeHistory("ts-001")
    expect(history).toHaveLength(2)
    expect(history[0].status).toBe("correct")
    expect(history[1].status).toBe("incorrect")
  })

  it("returns an empty array for a challenge with no attempts", () => {
    expect(getChallengeHistory("ts-999")).toEqual([])
  })
})

describe("getChallengeSummaries", () => {
  it("groups attempts by challenge with an attempt count and best-ever status", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "incorrect",
      submittedCode: "return 1;",
    })
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "return \"Hello, TypeScript!\";",
    })
    recordResult({
      challengeId: "ts-002",
      challengeTitle: "Sum Two Numbers",
      status: "skipped",
      submittedCode: "",
    })

    const summaries = getChallengeSummaries()
    expect(summaries).toHaveLength(2)

    const first = summaries.find((s) => s.challengeId === "ts-001")
    expect(first).toMatchObject({
      challengeTitle: "Hello, TypeScript!",
      bestStatus: "correct",
      attemptCount: 2,
    })
  })

  it("prefers correct over skipped over incorrect when ranking best status", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "skipped",
      submittedCode: "",
    })
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "incorrect",
      submittedCode: "return 1;",
    })

    const [summary] = getChallengeSummaries()
    expect(summary.bestStatus).toBe("skipped")
  })

  it("sorts by most recently attempted first", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "First",
      status: "correct",
      submittedCode: "",
    })
    recordResult({
      challengeId: "ts-002",
      challengeTitle: "Second",
      status: "correct",
      submittedCode: "",
    })

    const summaries = getChallengeSummaries()
    expect(summaries[0].challengeTitle).toBe("Second")
    expect(summaries[1].challengeTitle).toBe("First")
  })
})

describe("getFinishedChallengeCount", () => {
  it("counts distinct challenges that were solved or skipped", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "",
    })
    recordResult({
      challengeId: "ts-002",
      challengeTitle: "Sum Two Numbers",
      status: "skipped",
      submittedCode: "",
    })
    expect(getFinishedChallengeCount()).toBe(2)
  })

  it("does not count a challenge with only incorrect attempts (still in progress)", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "incorrect",
      submittedCode: "",
    })
    expect(getFinishedChallengeCount()).toBe(0)
  })

  it("counts a re-solved challenge once, not per attempt", () => {
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "",
    })
    recordResult({
      challengeId: "ts-001",
      challengeTitle: "Hello, TypeScript!",
      status: "correct",
      submittedCode: "",
    })
    expect(getFinishedChallengeCount()).toBe(1)
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
