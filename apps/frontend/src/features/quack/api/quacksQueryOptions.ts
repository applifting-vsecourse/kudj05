import { infiniteQueryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quackPageSchema } from "@/features/quack/api/quackSchemas"

export const quacksQueryOptions = (search = "") =>
  infiniteQueryOptions({
    queryKey: quackKeys.lists(search),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      quackPageSchema.parse(
        await api
          .get("quacks", {
            searchParams: {
              ...(search ? { search } : {}),
              offset: pageParam,
              limit: 20,
            },
          })
          .json(),
      ),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  })
