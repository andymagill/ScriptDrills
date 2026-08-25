import * as React from "react"
import {
  CheckCircle,
  XCircle,
  SkipForward,
  Play,
  Shuffle,
  Clock,
  Code2,
  BarChart3,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getStats, getActivityLog, getActiveChallenge, clearAll } from "@/lib/storage"
import type { ActivityEntry } from "@/types"

interface DashboardProps {
  onNavigate: (route: string) => void
}

function statusBadge(status: ActivityEntry["status"]) {
  if (status === "correct") {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 hover:bg-emerald-500/20">
        <CheckCircle className="size-3" />
        Correct
      </Badge>
    )
  }
  if (status === "incorrect") {
    return (
      <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15">
        <XCircle className="size-3" />
        Incorrect
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <SkipForward className="size-3" />
      Skipped
    </Badge>
  )
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = React.useState(getStats)
  const [log, setLog] = React.useState(getActivityLog)
  const hasActive = getActiveChallenge() !== null

  // Warm the code-splitted CodeEditor/CodeMirror chunk while the user is idle on
  // the Dashboard, so navigating to Practice usually doesn't hit its loading state.
  // requestIdleCallback isn't available in Safari, so fall back to a timeout.
  React.useEffect(() => {
    const prefetch = () => {
      import("@/components/CodeEditor")
    }
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(prefetch)
      return () => cancelIdleCallback(id)
    }
    const id = window.setTimeout(prefetch, 1)
    return () => window.clearTimeout(id)
  }, [])

  function handleClear() {
    clearAll()
    setStats(getStats())
    setLog(getActivityLog())
  }

  const total = stats.totalCorrect + stats.totalIncorrect + stats.totalSkipped
  const accuracy = total > 0 ? Math.round((stats.totalCorrect / total) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Code2 className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">TypeScript Sandbox</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Developer Practice Environment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                  <Trash2 className="size-3.5" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear your stats and activity log. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleClear}
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Track your progress and jump back into practice.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="py-5">
            <CardContent className="px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Correct</p>
                <CheckCircle className="size-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalCorrect}</p>
            </CardContent>
          </Card>

          <Card className="py-5">
            <CardContent className="px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incorrect</p>
                <XCircle className="size-4 text-destructive" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalIncorrect}</p>
            </CardContent>
          </Card>

          <Card className="py-5">
            <CardContent className="px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skipped</p>
                <SkipForward className="size-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalSkipped}</p>
            </CardContent>
          </Card>

          <Card className="py-5">
            <CardContent className="px-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accuracy</p>
                <BarChart3 className="size-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{accuracy}%</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3">
          {hasActive ? (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => onNavigate("practice")}
            >
              <Play className="size-4" />
              Continue Most Recent Challenge
            </Button>
          ) : (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                // Signal practice page to load a random challenge
                sessionStorage.setItem("ts-sandbox-force-new", "1")
                onNavigate("practice")
              }}
            >
              <Shuffle className="size-4" />
              Start Random Challenge
            </Button>
          )}
        </div>

        <Separator />

        {/* Activity Log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Activity Log</h3>
              <p className="text-sm text-muted-foreground">Your last {log.length} attempts</p>
            </div>
          </div>

          {log.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No activity yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Start a challenge to see your history here.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => onNavigate("practice")}
                >
                  <Play className="size-3.5" />
                  Start Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead>Challenge</TableHead>
                    <TableHead className="hidden md:table-cell">Last Submission</TableHead>
                    <TableHead className="hidden lg:table-cell w-[160px]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{statusBadge(entry.status)}</TableCell>
                      <TableCell className="font-medium">{entry.challengeTitle}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        {entry.submittedCode ? (
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground truncate block max-w-sm">
                            {entry.submittedCode}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {formatTime(entry.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
