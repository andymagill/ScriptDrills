import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export function CodeEditor({ value, onChange, className, disabled }: CodeEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = React.useRef<HTMLDivElement>(null)

  const lineCount = value.split("\n").length

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = value.substring(0, start) + "  " + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2
          textareaRef.current.selectionEnd = start + 2
        }
      })
    }
  }

  function syncScroll() {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  return (
    <div
      className={cn(
        "relative flex w-full overflow-hidden rounded-lg border border-border",
        "bg-[oklch(0.13_0_0)] font-mono text-sm",
        className
      )}
    >
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden px-3 py-4 text-right text-[oklch(0.45_0_0)] leading-[1.6rem]"
        style={{ minWidth: "3rem" }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-[oklch(0.25_0_0)] shrink-0" />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className={cn(
          "flex-1 resize-none bg-transparent px-4 py-4 text-[oklch(0.88_0_0)]",
          "leading-[1.6rem] outline-none placeholder:text-[oklch(0.45_0_0)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "selection:bg-[oklch(0.35_0.1_240)]"
        )}
        style={{ tabSize: 2 }}
      />
    </div>
  )
}
