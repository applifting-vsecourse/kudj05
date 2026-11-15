export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: (search = "", isMine = false) => [...quackKeys.all(), "list", { search, isMine }] as const,
  // A root of its own: thread caches hold a plain array, not pages, so the list
  // updaters that run over quackKeys.all() must never see them.
  allReplies: () => ["quack-replies"] as const,
  replies: (quackId: string) => [...quackKeys.allReplies(), quackId] as const,
}
