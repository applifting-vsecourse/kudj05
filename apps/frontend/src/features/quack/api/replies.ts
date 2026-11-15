import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quackSchema, quacksSchema, type Quack } from "@/features/quack/api/quackSchemas"

// Live replies to a quack, oldest first.
export const repliesQueryOptions = (quackId: string) =>
  queryOptions({
    queryKey: quackKeys.replies(quackId),
    queryFn: async () =>
      quacksSchema.parse(await api.get(`quacks/${encodeURIComponent(quackId)}/replies`).json()),
  })

export async function addReply(input: { quackId: string; text: string }): Promise<Quack> {
  const json = await api
    .post(`quacks/${encodeURIComponent(input.quackId)}/replies`, { json: { text: input.text } })
    .json()
  return quackSchema.parse(json)
}
