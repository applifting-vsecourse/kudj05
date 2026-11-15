import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { repliesQueryOptions } from "@/features/quack/api/replies"
import { QuackItem } from "@/features/quack/components/QuackItem"
import { ReplyForm } from "@/features/quack/components/ReplyForm"

type QuackRepliesProps = {
  quackId: string
  canReply: boolean
  currentUserId?: string
  canDeleteAny?: boolean
}

// The thread under a quack: its replies oldest first, then the form to add one.
export function QuackReplies({
  quackId,
  canReply,
  currentUserId,
  canDeleteAny,
}: QuackRepliesProps) {
  const repliesQuery = useQuery(repliesQueryOptions(quackId))
  const replies = repliesQuery.data ?? []

  return (
    <div className="mt-2 flex flex-col gap-3 border-l border-border pl-4">
      {repliesQuery.isLoading ? (
        <div className="flex items-center py-3 text-muted-foreground">
          <Loader2
            aria-label="Loading replies"
            className="size-4 animate-spin"
          />
        </div>
      ) : null}

      {repliesQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load replies</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{repliesQuery.error.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void repliesQuery.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {repliesQuery.isSuccess && replies.length === 0 ? (
        <p
          role="status"
          className="py-1 text-sm text-muted-foreground"
        >
          {canReply ? "No replies yet. Be the first to reply." : "No replies left."}
        </p>
      ) : null}

      {replies.length > 0 ? (
        <div className="flex flex-col">
          {replies.map((reply) => (
            <QuackItem
              key={reply.id}
              quack={reply}
              currentUserId={currentUserId}
              canDeleteAny={canDeleteAny}
            />
          ))}
        </div>
      ) : null}

      {canReply ? <ReplyForm quackId={quackId} /> : null}
    </div>
  )
}
