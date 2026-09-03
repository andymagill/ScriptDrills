import * as React from "react"
import {
  ArrowLeft,
  Play,
  SkipForward,
  CheckCircle2,
  Lightbulb,
  Terminal,
  ArrowRight,
  Target,
  BookOpen,
  Code2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { ModeToggle } from "@/components/mode-toggle"
import { DifficultyPickerButton } from "@/components/DifficultyPickerButton"
import { DifficultyBadge } from "@/components/DifficultyBadge"
import {
  recordResult,
  getActiveChallenge,
  setActiveChallenge,
  getRecentChallengeIds,
} from "@/lib/storage"
import { evaluateCode, stringifyResult } from "@/lib/run-code"
import { instantiateChallenge } from "@/lib/challenge-instance"
import { selectChallenge } from "@/lib/challenge-select"
import { challenges } from "@/data/challenges"
import type { ChallengeInstance, DifficultyFilter } from "@/types"

// CodeMirror pulls in a heavy language/highlighting toolchain (~500kB) that only
// this page needs, so it's split into its own chunk instead of shipping on every
// route. Dashboard prefetches it during idle time so it's usually already warm by
// the time the user navigates here - see the useEffect in Dashboard.tsx.
const CodeEditor = React.lazy(() =>
  import("@/components/CodeEditor").then((m) => ({ default: m.CodeEditor }))
)

interface ConsoleLine {
  type: "info" | "success" | "error"
  text: string
}

interface PracticeProps {
  onNavigate: (route: string) => void
}

// Difficulty is never relaxed by selectChallenge, but recency exclusion is -
// the current challenge plus the last few distinct attempts are avoided when
// possible, without ever serving a difficulty outside what was asked for.
function nextInstance(
  difficulty: DifficultyFilter,
  currentId?: string | number
): ChallengeInstance {
  return instantiateChallenge(
    selectChallenge(challenges, {
      difficulty: difficulty === "any" ? undefined : difficulty,
      excludeIds: [
        ...(currentId !== undefined ? [currentId] : []),
        ...getRecentChallengeIds(),
      ],
    })
  )
}

const READY_LINE: ConsoleLine = {
  type: "info",
  text: "Console ready. Click \"Run Code\" to evaluate your solution.",
}

const NEXT_DIFFICULTY_KEY = "ts-sandbox-next-difficulty"

export function Practice({ onNavigate }: PracticeProps) {
  // Randomized challenges roll fresh values on each instantiation, so the
  // instance itself - not just the challengeId - has to be what's persisted
  // and resumed, or refreshing mid-attempt would silently reroll the values
  // you're solving against.
  const [instance, setInstance] = React.useState<ChallengeInstance>(() => {
    const forceNew = sessionStorage.getItem("ts-sandbox-force-new") === "1"
    if (forceNew) sessionStorage.removeItem("ts-sandbox-force-new")

    const nextDifficulty =
      (sessionStorage.getItem(NEXT_DIFFICULTY_KEY) as DifficultyFilter | null) ??
      "any"
    if (nextDifficulty !== "any") sessionStorage.removeItem(NEXT_DIFFICULTY_KEY)

    if (!forceNew) {
      const active = getActiveChallenge()
      if (active?.instance) return active.instance
      if (active) {
        const found = challenges.find((c) => c.id === active.challengeId)
        if (found) return instantiateChallenge(found)
      }
    }

    return nextInstance(nextDifficulty)
  })

  const [code, setCode] = React.useState<string>(() => {
    const active = getActiveChallenge()
    if (active?.instance && active.challengeId === instance.challengeId) {
      return active.currentCode
    }
    return instance.starterCode
  })

  const [consoleLines, setConsoleLines] = React.useState<ConsoleLine[]>([READY_LINE])
  const [solved, setSolved] = React.useState(false)
  const [showExplanation, setShowExplanation] = React.useState(false)

  // Persist active challenge whenever instance/code changes
  React.useEffect(() => {
    setActiveChallenge({ challengeId: instance.challengeId, currentCode: code, instance })
  }, [instance, code])

  function loadChallenge(newInstance: ChallengeInstance) {
    setInstance(newInstance)
    setCode(newInstance.starterCode)
    setSolved(false)
    setShowExplanation(false)
    setConsoleLines([READY_LINE])
  }

  function handleRun() {
    const { result, error } = evaluateCode(code)

    if (error) {
      setConsoleLines((prev) => [
        ...prev,
        { type: "error", text: `Error: ${error}` },
      ])
      recordResult({
        challengeId: instance.challengeId,
        challengeTitle: instance.title,
        status: "incorrect",
        submittedCode: code,
        expectedOutput: instance.expectedOutput,
      })
      setSolved(false)
      return
    }

    const output = stringifyResult(result)
    const isCorrect = output === instance.expectedOutput

    if (isCorrect) {
      setConsoleLines((prev) => [
        ...prev,
        { type: "success", text: `Output: ${output}` },
        { type: "success", text: `Correct! Expected "${instance.expectedOutput}".` },
      ])
      recordResult({
        challengeId: instance.challengeId,
        challengeTitle: instance.title,
        status: "correct",
        submittedCode: code,
        expectedOutput: instance.expectedOutput,
      })
      setSolved(true)
      setShowExplanation(true)
    } else {
      setConsoleLines((prev) => [
        ...prev,
        { type: "error", text: `Output: ${output}` },
        { type: "error", text: `Incorrect. Expected "${instance.expectedOutput}".` },
      ])
      recordResult({
        challengeId: instance.challengeId,
        challengeTitle: instance.title,
        status: "incorrect",
        submittedCode: code,
        expectedOutput: instance.expectedOutput,
      })
      setSolved(false)
    }
  }

  function handleSkip() {
    recordResult({
      challengeId: instance.challengeId,
      challengeTitle: instance.title,
      status: "skipped",
      submittedCode: code,
      expectedOutput: instance.expectedOutput,
    })
    loadChallenge(nextInstance("any", instance.challengeId))
  }

  function handleNext(difficulty: DifficultyFilter) {
    loadChallenge(nextInstance(difficulty, instance.challengeId))
  }

  function handleResetCode() {
    setCode(instance.starterCode)
    setSolved(false)
    setShowExplanation(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => onNavigate("dashboard")}
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Code2 className="size-4" />
              <span className="text-sm font-medium">TypeScript Sandbox</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <DifficultyBadge difficulty={instance.difficulty} />
            <Badge variant="outline" className="font-mono text-xs">
              {instance.challengeId}
            </Badge>
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* Left: Challenge Pane */}
        <div className="lg:w-[440px] lg:shrink-0 lg:border-r border-b lg:border-b-0 bg-card/30">
          <div className="p-6 space-y-5 lg:max-h-[calc(100vh-57px)] lg:overflow-y-auto">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{instance.title}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {instance.description}
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border bg-background p-3.5">
              <Target className="size-4 shrink-0 mt-0.5 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Objective
                </p>
                <p className="text-sm text-foreground">{instance.objective ?? instance.description}</p>
              </div>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="hints" className="border-b-0 rounded-lg border overflow-hidden">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-500" />
                    Hints
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <ul className="space-y-2 pb-2">
                    {instance.hints.map((hint, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-foreground/40 font-mono text-xs shrink-0 mt-0.5">
                          {i + 1}.
                        </span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {showExplanation && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="size-4" />
                  <p className="text-sm font-semibold">Explanation</p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {instance.explanation}
                </p>
              </div>
            )}

            {solved && (
              <DifficultyPickerButton
                size="lg"
                className="w-full"
                onPick={handleNext}
              >
                Next Challenge
                <ArrowRight className="size-4" />
              </DifficultyPickerButton>
            )}
          </div>
        </div>

        {/* Right: Workspace */}
        <div className="flex-1 flex flex-col min-h-[400px]">
          {/* Code Editor */}
          <div className="flex-1 p-4 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Editor
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleResetCode}
                className="text-muted-foreground"
              >
                Reset code
              </Button>
            </div>
            <React.Suspense
              fallback={<Skeleton className="flex-1 min-h-[260px] rounded-lg" />}
            >
              <CodeEditor
                value={code}
                onChange={setCode}
                disabled={solved}
                className="flex-1 min-h-[260px]"
              />
            </React.Suspense>
          </div>

          {/* Control bar */}
          <div className="border-t bg-card/30 px-4 py-3 flex items-center gap-2.5">
            <Button
              size="sm"
              className="gap-2"
              onClick={handleRun}
              disabled={solved}
            >
              <Play className="size-3.5" />
              Run Code
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleSkip}
              disabled={solved}
            >
              <SkipForward className="size-3.5" />
              Skip Challenge
            </Button>
            {solved && (
              <Badge className="ml-auto gap-1.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Solved
              </Badge>
            )}
          </div>

          {/* Console Output */}
          <div className="border-t bg-[oklch(0.1_0_0)] p-4 min-h-[180px] max-h-[300px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2.5">
              <Terminal className="size-3.5 text-[oklch(0.6_0_0)]" />
              <span className="text-xs font-medium text-[oklch(0.6_0_0)] uppercase tracking-wide">
                Console
              </span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {consoleLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === "success"
                      ? "text-[oklch(0.7_0.15_145)]"
                      : line.type === "error"
                        ? "text-[oklch(0.7_0.18_25)]"
                        : "text-[oklch(0.6_0_0)]"
                  }
                >
                  <span className="opacity-50 mr-2 select-none">
                    {line.type === "success" ? "✓" : line.type === "error" ? "✗" : "›"}
                  </span>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
