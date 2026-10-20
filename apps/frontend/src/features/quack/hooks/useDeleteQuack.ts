import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { QuackPage } from "@/features/quack/api/quackSchemas"

// The quack leaves every cached list (feed, Mine, searches) as soon as the server confirms,
// then the lists are refetched so the pages behind it close the gap.
export function useDeleteQuack() {
  const queryClient = useQueryClient()
  const lists = { queryKey: quackKeys.all() }

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
              items: page.items.filter((quack) => quack.id !== quackId),
            })),
          },
      )
    },
    onError: () => toast.error("Couldn't delete the quack. Try again."),
    onSettled: () => queryClient.invalidateQueries(lists),
  })
}
