export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: (search = "", isMine = false) => [...quackKeys.all(), "list", { search, isMine }] as const,
}
