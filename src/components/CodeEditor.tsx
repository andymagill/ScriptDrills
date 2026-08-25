import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { indentUnit } from "@codemirror/language"
import { oneDark } from "@codemirror/theme-one-dark"
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

const extensions = [
  javascript({ typescript: true }),
  indentUnit.of("  "),
  keymap.of([indentWithTab]),
]

export function CodeEditor({ value, onChange, className, disabled }: CodeEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border font-mono text-sm",
        disabled && "opacity-60",
        className
      )}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={oneDark}
        editable={!disabled}
        basicSetup={{
          highlightActiveLine: !disabled,
          highlightActiveLineGutter: !disabled,
          foldGutter: false,
        }}
        height="100%"
        className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono"
      />
    </div>
  )
}
