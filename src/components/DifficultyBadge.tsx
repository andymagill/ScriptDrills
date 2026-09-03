import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Difficulty } from "@/types"

// Deliberately not emerald - emerald already means "Correct" in the activity
// log, and reusing it here would make these two badge families read as the
// same signal.
const STYLES: Record<Difficulty, string> = {
  easy: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400 hover:bg-sky-500/20",
  medium:
    "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/20",
  hard: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400 hover:bg-rose-500/20",
}

const LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty
  className?: string
}) {
  return (
    <Badge className={cn(STYLES[difficulty], className)}>
      {LABELS[difficulty]}
    </Badge>
  )
}
