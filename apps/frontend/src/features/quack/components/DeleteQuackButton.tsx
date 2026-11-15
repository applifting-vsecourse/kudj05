import { Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { useDeleteQuack } from "@/features/quack/hooks/useDeleteQuack"

// Deleting is asked about first: it wipes the quack's text, poll and votes, and can't be undone.
// Replies under it stay (docs/adr/0001).
export function DeleteQuackButton({
  quackId,
  authorUsername,
  isReply = false,
}: {
  quackId: string
  // Set when deleting someone else's quack.
  authorUsername?: string
  isReply?: boolean
}) {
  const noun = isReply ? "reply" : "quack"
  const deleteQuack = useDeleteQuack()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-my-1 text-muted-foreground"
        >
          <Trash2 aria-hidden />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {authorUsername ? `Delete @${authorUsername}'s ${noun}?` : `Delete this ${noun}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isReply
              ? "It disappears from the thread for everyone. This can't be undone."
              : "Its text disappears for everyone, along with its poll and votes. Replies to it stay. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => deleteQuack.mutate(quackId)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
