import type { ReactNode } from "react"
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
  // Shown under the empty message when there is a next step to offer.
  emptyAction?: ReactNode
  // Quacks by this user get a Delete action.
  currentUserId?: string
  // Admins and moderators get Delete on every quack.
  canDeleteAny?: boolean
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
  emptyAction,
  currentUserId,
  canDeleteAny,
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
        <div className="flex flex-col items-center gap-3 py-8 motion-safe:animate-in motion-safe:fade-in-0">
          <p
            role="status"
            className="text-center text-sm text-muted-foreground"
          >
            {emptyMessage}
          </p>
          {emptyAction}
        </div>
      ) : null}

      {quacks.map((quack) => {
        const isMine = currentUserId !== undefined && quack.userId === currentUserId
        return (
          <QuackItem
            key={quack.id}
            quack={quack}
            isMine={isMine}
            canDelete={isMine || canDeleteAny}
          />
        )
      })}

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
