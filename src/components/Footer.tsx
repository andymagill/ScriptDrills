import { Bug, Scale, Globe } from "lucide-react"

const REPO_URL = "https://github.com/andymagill/ScriptDrills"

export function Footer() {
  return (
    <footer className="border-t bg-card/30 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          Built by{" "}
          <a
            href="https://magill.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
          >
            <Globe className="size-3" />
            magill.dev
          </a>
        </p>

        <a
          href={`${REPO_URL}/blob/main/LICENSE`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
        >
          <Scale className="size-3" />
          MIT License
        </a>

        <a
          href={`${REPO_URL}/issues/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
        >
          <Bug className="size-3" />
          Report an issue
        </a>
      </div>
    </footer>
  )
}
