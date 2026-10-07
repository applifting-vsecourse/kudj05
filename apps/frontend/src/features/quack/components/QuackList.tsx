import { Loader2, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackItem } from "@/features/quack/components/QuackItem"

type QuackListProps = {
  quacks: Quack[]
  isLoading?: boolean
  isFetchingNextPage?: boolean
  // The quacks on screen belong to the previous request while the next one loads.
  isStale?: boolean
  emptyMessage?: string
  error?: Error
  onReload?: () => void
  onLoadMore?: () => void
}

export function QuackList({
  quacks,
  isLoading,
  isFetchingNextPage,
  isStale,
  emptyMessage = "No quacks yet. Post the first one.",
  error,
  onReload,
  onLoadMore,
}: QuackListProps) {
  return (
    <div
      aria-busy={isStale}
      className={cn(
        "flex flex-col transition-opacity duration-200 motion-reduce:transition-none",
        isStale && "opacity-60",
      )}
    >
      {isLoading && quacks.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : null}

      {error ? (
        <Alert
          variant="destructive"
          className="mb-4"
        >
          <AlertTitle>Couldn&apos;t load quacks</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error.message}</span>
            {onReload ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onReload}
              >
                <RefreshCw className="size-4" />
                Reload
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !error && quacks.length === 0 ? (
        <p
          role="status"
          className="py-8 text-center text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0"
        >
          {emptyMessage}
        </p>
      ) : null}

      {quacks.map((quack) => (
        <QuackItem
          key={quack.id}
          quack={quack}
        />
      ))}

      {onLoadMore ? (
        <div className="flex min-h-10 items-center justify-center py-4">
          <div
            ref={(element) => {
              if (!element || isFetchingNextPage) return
              const observer = new IntersectionObserver(([entry]) => {
                if (entry?.isIntersecting) onLoadMore()
              })
              observer.observe(element)
              return () => observer.disconnect()
            }}
            className="flex items-center justify-center"
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
