import { useMutation, useQueryClient } from "@tanstack/react-query"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { addReply } from "@/features/quack/api/replies"

export function useAddReply(quackId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (text: string) => addReply({ quackId, text }),
    onSuccess: async () => {
      // The thread shows the new reply, the lists show the new count.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: quackKeys.replies(quackId) }),
        queryClient.invalidateQueries({ queryKey: quackKeys.all() }),
      ])
    },
  })
}
