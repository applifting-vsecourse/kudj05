import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, QuackPage } from "@/features/quack/api/quackSchemas"
import { votePoll } from "@/features/quack/api/votePoll"

type QuackPages = InfiniteData<QuackPage>

// What the poll will look like once the server has the vote: the old pick loses one, the new one gains one.
export function applyVote(poll: Poll, optionId: string | null): Poll {
  return {
    myOptionId: optionId,
    options: poll.options.map((option) => {
      let { voteCount } = option
      if (option.id === poll.myOptionId) voteCount -= 1
      if (option.id === optionId) voteCount += 1
      return { ...option, voteCount }
    }),
  }
}

const updatePoll = (
  data: QuackPages | undefined,
  quackId: string,
  update: (poll: Poll) => Poll,
): QuackPages | undefined =>
  data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((quack) =>
        quack.id === quackId && quack.poll ? { ...quack, poll: update(quack.poll) } : quack,
      ),
    })),
  }

// The vote shows at once (optimistically) in every cached list holding the quack — the feed
// and any search — and is put back if the server refuses it.
export function useVote(quackId: string) {
  const queryClient = useQueryClient()
  const lists = { queryKey: quackKeys.all() }

  return useMutation({
    mutationFn: (optionId: string | null) => votePoll({ quackId, optionId }),
    onMutate: async (optionId) => {
      // A refetch landing after this would overwrite the optimistic vote with older counts.
      await queryClient.cancelQueries(lists)
      const previous = queryClient.getQueriesData<QuackPages>(lists)
      queryClient.setQueriesData<QuackPages>(lists, (data) =>
        updatePoll(data, quackId, (poll) => applyVote(poll, optionId)),
      )
      return { previous }
    },
    onError: (_error, _optionId, context) => {
      context?.previous.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    // The server's answer includes other people's votes, so it replaces the guess.
    onSuccess: (poll) => {
      queryClient.setQueriesData<QuackPages>(lists, (data) => updatePoll(data, quackId, () => poll))
    },
    onSettled: () => queryClient.invalidateQueries(lists),
  })
}
