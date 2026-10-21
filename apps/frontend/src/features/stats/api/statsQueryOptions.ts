import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

export const statsSchema = z.object({
  users: z.number().int().nonnegative(),
  quacks: z.number().int().nonnegative(),
  polls: z.number().int().nonnegative(),
  votes: z.number().int().nonnegative(),
})

export type Stats = z.infer<typeof statsSchema>

export const statsQueryOptions = () =>
  queryOptions({
    queryKey: ["stats"],
    queryFn: async () => statsSchema.parse(await api.get("stats").json()),
  })
