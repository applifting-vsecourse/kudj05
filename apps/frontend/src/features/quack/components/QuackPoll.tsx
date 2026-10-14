import { Check } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import type { Poll } from "@/features/quack/api/quackSchemas"

type QuackPollProps = {
  poll: Poll
  // Called with the picked option, or null when the user takes their vote back.
  // Without it the poll only shows the results.
  onVote?: (optionId: string | null) => void
  className?: string
}

const formatTotal = (total: number) => {
  if (total === 0) return "No votes yet"
  return total === 1 ? "1 vote" : `${total} votes`
}

export function QuackPoll({ poll, onVote, className }: QuackPollProps) {
  // Summed here rather than sent by the server, so it can never disagree with the numbers above it.
  const total = poll.options.reduce((sum, option) => sum + option.voteCount, 0)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={2}
        aria-label="Poll options"
        // Radix reports "nothing selected" as an empty string — picking your own option again takes the vote back.
        value={poll.myOptionId ?? ""}
        onValueChange={(next) => onVote?.(next || null)}
        disabled={!onVote}
        className="w-full flex-col items-stretch"
      >
        {poll.options.map((option) => {
          const isMine = option.id === poll.myOptionId
          const share = total === 0 ? 0 : (option.voteCount / total) * 100

          return (
            <ToggleGroupItem
              key={option.id}
              value={option.id}
              // The bar is the background here, so hover and "on" are shown by the border instead of a fill.
              className="relative h-auto w-full justify-between gap-3 overflow-hidden py-2 text-left font-normal whitespace-normal hover:border-accent-foreground hover:bg-transparent data-[state=on]:border-accent-foreground data-[state=on]:bg-transparent"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-secondary transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${share}%` }}
              />
              <span className="relative flex min-w-0 flex-wrap items-center gap-x-2">
                <span className="break-words">{option.text}</span>
                {isMine ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    <Check
                      aria-hidden
                      className="size-3.5"
                    />
                    Your vote
                  </span>
                ) : null}
              </span>
              <span className="relative tabular-nums">
                {option.voteCount}
                <span className="sr-only">{option.voteCount === 1 ? " vote" : " votes"}</span>
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">{formatTotal(total)}</p>
    </div>
  )
}
