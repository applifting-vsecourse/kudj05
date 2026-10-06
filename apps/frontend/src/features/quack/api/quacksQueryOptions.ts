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
    // While a search is being refined, the previous results stay on screen instead of
    // flashing a spinner on every keystroke. The plain feed never stands in for results.
    placeholderData: (previousData, previousQuery) =>
      search && previousQuery?.queryKey[2].search ? previousData : undefined,
  })
