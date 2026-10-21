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

// Deleting is asked about first: it takes the quack's poll and votes with it, and can't be undone.
export function DeleteQuackButton({
  quackId,
  authorUsername,
}: {
  quackId: string
  // Set when deleting someone else's quack.
  authorUsername?: string
}) {
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
            {authorUsername ? `Delete @${authorUsername}'s quack?` : "Delete this quack?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from the feed for everyone, along with its poll and votes. This can&apos;t
            be undone.
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
