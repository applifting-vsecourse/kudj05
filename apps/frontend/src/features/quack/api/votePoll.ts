import { api } from "@/lib/api-client"

import { pollSchema, type Poll } from "@/features/quack/api/quackSchemas"

// optionId null takes the vote back. Either way the server answers with the poll as it is now.
export async function votePoll(input: { quackId: string; optionId: string | null }): Promise<Poll> {
  const path = `quacks/${encodeURIComponent(input.quackId)}/vote`
  const json = input.optionId
    ? await api.put(path, { json: { optionId: input.optionId } }).json()
    : await api.delete(path).json()
  return pollSchema.parse(json)
}
