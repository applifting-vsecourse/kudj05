import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authKeys } from "@/lib/auth-keys"
import type { Mood } from "@/lib/moods"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"

// Only the fields that changed are sent: re-sending an unchanged username would
// still make the server rewrite it.
export type ProfileUpdate = {
  username?: string
  name?: string
  bio?: string | null
  defaultMood?: Mood | null
}

// Carries BetterAuth's error code so the form can put the message under the right field.
export class ProfileUpdateError extends Error {
  readonly code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.name = "ProfileUpdateError"
    this.code = code
  }
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      const { error } = await authClient.updateUser({
        ...update,
        // BetterAuth keeps the username lower-cased and the typed spelling beside it.
        ...(update.username === undefined ? {} : { displayUsername: update.username }),
      })
      if (error) {
        throw new ProfileUpdateError(error.message ?? "Could not save your settings", error.code)
      }

      // Refetch right away (not just mark stale), so the header and the form
      // see the stored values — e.g. the lower-cased username.
      const session = await queryClient.fetchQuery({ ...authSessionQueryOptions(), staleTime: 0 })
      return session?.user ?? null
    },
    onSuccess: async () => {
      // Quacks carry their author's name and @username, so every cached list is out of date.
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== authKeys.all()[0],
      })
    },
  })
}
