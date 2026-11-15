import { useState } from "react"
import { MessageCircle, MessageSquareOff } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatDate } from "@/lib/date"
import { MOOD_OPTIONS } from "@/lib/moods"
import { cn } from "@/lib/utils"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { DeleteQuackButton } from "@/features/quack/components/DeleteQuackButton"
import { QuackPoll } from "@/features/quack/components/QuackPoll"
import { QuackReplies } from "@/features/quack/components/QuackReplies"
import { UsersName } from "@/features/quack/components/UsersName"
import { UsersUserName } from "@/features/quack/components/UsersUserName"

type QuackItemProps = {
  quack: Quack
  // Quacks and replies by this user get a Delete action.
  currentUserId?: string
  // The author, an admin or a moderator gets Delete; the server refuses everyone else anyway.
  canDeleteAny?: boolean
  // Off for the signed-out preview on the landing page, which has no threads to load.
  hasReplies?: boolean
}

const replyLabel = (count: number) =>
  count === 0 ? "Reply" : count === 1 ? "1 reply" : `${count} replies`

export function QuackItem({
  quack,
  currentUserId,
  canDeleteAny,
  hasReplies = true,
}: QuackItemProps) {
  const [isThreadOpen, setIsThreadOpen] = useState(false)
  // Replies are one level deep: a reply has no thread of its own.
  const isReply = quack.parentId !== null
  const hasThread = hasReplies && !isReply && (!quack.isDeleted || quack.replyCount > 0)

  return (
    <article
      className={cn(
        "flex w-full border-b border-border last:border-b-0",
        isReply ? "gap-3 py-3" : "gap-4 pt-2 pb-4",
      )}
    >
      {quack.isDeleted ? (
        <Avatar className="size-12">
          <AvatarFallback>
            <MessageSquareOff
              aria-hidden
              className="size-5 text-muted-foreground"
            />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className={isReply ? "size-8" : "size-12"}>
          <AvatarFallback className={isReply ? "text-xs" : undefined}>
            {initialsOf(quack.user.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {quack.isDeleted ? (
          // Nothing the author wrote is left, not even who they are (docs/adr/0001).
          <p className="py-3 text-sm text-muted-foreground">This quack was deleted.</p>
        ) : (
          <LiveQuack
            quack={quack}
            isReply={isReply}
            currentUserId={currentUserId}
            canDeleteAny={canDeleteAny}
          />
        )}

        {hasThread ? (
          <Collapsible
            open={isThreadOpen}
            onOpenChange={setIsThreadOpen}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 text-muted-foreground"
              >
                <MessageCircle aria-hidden />
                {replyLabel(quack.replyCount)}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <QuackReplies
                quackId={quack.id}
                // A deleted quack keeps its replies but takes no new ones.
                canReply={!quack.isDeleted}
                currentUserId={currentUserId}
                canDeleteAny={canDeleteAny}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>
    </article>
  )
}

function LiveQuack({
  quack,
  isReply,
  currentUserId,
  canDeleteAny,
}: {
  quack: Extract<Quack, { isDeleted: false }>
  isReply: boolean
  currentUserId?: string
  canDeleteAny?: boolean
}) {
  const { name, username } = quack.user
  const mood = quack.mood ? MOOD_OPTIONS[quack.mood] : null
  const isMine = currentUserId !== undefined && quack.userId === currentUserId

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-2">
        <span>
          <UsersName name={name} /> <UsersUserName username={username} />
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <time className="text-xs text-muted-foreground">{formatDate(quack.createdAt)}</time>
        {mood ? (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              <mood.icon
                aria-hidden
                className="mr-1 inline size-3.5 align-text-bottom"
              />
              {mood.label}
            </span>
          </>
        ) : null}
        {isMine || canDeleteAny ? (
          <span className="ml-auto">
            <DeleteQuackButton
              quackId={quack.id}
              // Someone else's quack is named in the dialog, so a moderator sees whose it is.
              authorUsername={isMine ? undefined : username}
              isReply={isReply}
            />
          </span>
        ) : null}
      </div>
      <p className="text-sm break-words whitespace-pre-line">{quack.text}</p>
      {quack.poll ? (
        <QuackPoll
          quackId={quack.id}
          poll={quack.poll}
          className="mt-2"
        />
      ) : null}
    </>
  )
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
