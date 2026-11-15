import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack, QuackPage } from "@/features/quack/api/quackSchemas"

// What the server turns a deleted quack into (docs/adr/0001): only what holds its replies stays.
const toTombstone = (quack: Quack): Quack => ({
  id: quack.id,
  createdAt: quack.createdAt,
  parentId: quack.parentId,
  replyCount: quack.replyCount,
  isDeleted: true,
  text: "",
  mood: null,
  poll: null,
  userId: null,
  user: null,
})

// As soon as the server confirms, the quack leaves every cached list (feed, Mine, searches) and
// every open thread; one that has replies stays in its place as a tombstone. Then everything is
// refetched, so the pages behind close the gap and the counts catch up.
export function useDeleteQuack() {
  const queryClient = useQueryClient()
  const lists = { queryKey: quackKeys.all() }
  const threads = { queryKey: quackKeys.allReplies() }

  return useMutation({
    mutationFn: deleteQuack,
    onSuccess: (_data, quackId) => {
      queryClient.setQueriesData<InfiniteData<QuackPage>>(
        lists,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.flatMap((quack) => {
                if (quack.id !== quackId) return [quack]
                return quack.replyCount > 0 ? [toTombstone(quack)] : []
              }),
            })),
          },
      )
      queryClient.setQueriesData<Quack[]>(threads, (replies) =>
        replies?.filter((reply) => reply.id !== quackId),
      )
    },
    onError: () => toast.error("Couldn't delete the quack. Try again."),
    onSettled: () =>
      Promise.all([queryClient.invalidateQueries(lists), queryClient.invalidateQueries(threads)]),
  })
}
