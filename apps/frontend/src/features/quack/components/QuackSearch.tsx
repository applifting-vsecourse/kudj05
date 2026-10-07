import { useEffect, useId, useRef } from "react"
import { Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type QuackSearchProps = {
  value: string
  onChange: (value: string) => void
  isSearching?: boolean
  className?: string
}

export function QuackSearch({ value, onChange, isSearching, className }: QuackSearchProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // The field only exists while search is open, so mounting means "the user just opened search".
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const StatusIcon = isSearching ? Loader2 : Search

  return (
    <div
      role="search"
      className={cn("grid gap-2", className)}
    >
      <Label htmlFor={inputId}>Search quacks</Label>
      <div className="relative">
        <StatusIcon
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground",
            isSearching && "animate-spin",
          )}
        />
        <Input
          id={inputId}
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. pond, or an author’s name"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className="pr-16 pl-8"
        />
        {value ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0"
              onClick={() => {
                onChange("")
                inputRef.current?.focus()
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
