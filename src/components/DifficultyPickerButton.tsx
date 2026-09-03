import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DifficultyFilter } from "@/types"

const ICON_SIZE_BY_SIZE = {
  sm: "icon-sm",
  default: "icon",
  lg: "icon-lg",
} as const

interface DifficultyPickerButtonProps {
  /** Called once per click - the main button always fires "any" (Random). */
  onPick: (difficulty: DifficultyFilter) => void
  /** Primary button content, e.g. "Next Challenge" + an icon. */
  children: React.ReactNode
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline"
  className?: string
}

export function DifficultyPickerButton({
  onPick,
  children,
  size = "default",
  variant = "default",
  className,
}: DifficultyPickerButtonProps) {
  return (
    <ButtonGroup className={className}>
      <Button
        size={size}
        variant={variant}
        className="flex-1 gap-2"
        onClick={() => onPick("any")}
      >
        {children}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={ICON_SIZE_BY_SIZE[size]} variant={variant}>
            <ChevronDown className="size-4" />
            <span className="sr-only">Choose difficulty</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onPick("any")}>
            Random
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onPick("easy")}>
            Easy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("medium")}>
            Medium
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("hard")}>
            Hard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
