import { useEffect, useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch } from "@/features/quack/components/QuackSearch"

// Long enough to skip a request per keystroke, short enough to still feel live.
const SEARCH_DEBOUNCE_MS = 250

export function QuackFeed() {
  // null = search is closed; any string, even an empty one = search is open.
  const [search, setSearch] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const searchToggleRef = useRef<HTMLButtonElement>(null)

  const isSearchOpen = search !== null
  const typedQuery = search?.trim() ?? ""
  const debouncedQuery = useDebouncedValue(typedQuery, SEARCH_DEBOUNCE_MS)
  // Clearing or closing applies at once; only newly typed text waits for the debounce.
  const query = typedQuery ? debouncedQuery : ""
  const isAwaitingQuery = isSearchOpen && !query

  useEffect(() => {
    if (!isSearchOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const { target } = event
      if (!(target instanceof Node)) return
      // <html> itself is only hit by the page scrollbar — scrolling through results isn't clicking away.
      if (target === document.documentElement || feedRef.current?.contains(target)) return
      setSearch(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setSearch(null)
      searchToggleRef.current?.focus()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isSearchOpen])

  const quacksQuery = useInfiniteQuery({
    ...quacksQueryOptions(query),
    enabled: !isAwaitingQuery,
  })
  // An open search with nothing typed shows no quacks at all, not the cached feed.
  const quacks = isAwaitingQuery
    ? []
    : (quacksQuery.data?.pages.flatMap((page) => page.items) ?? [])
  const isSearching =
    typedQuery !== "" &&
    (typedQuery !== debouncedQuery || (quacksQuery.isFetching && !quacksQuery.isFetchingNextPage))
  const canLoadMore = quacksQuery.hasNextPage && !isAwaitingQuery && !quacksQuery.isPlaceholderData

  const searchEmptyMessage = isAwaitingQuery
    ? "Matching quacks will show up here as you type."
    : `No quacks match “${query}”.`

  return (
    <Collapsible
      ref={feedRef}
      open={isSearchOpen}
      onOpenChange={(isOpen) => setSearch(isOpen ? "" : null)}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Latest quacks</h2>
        <CollapsibleTrigger asChild>
          <Button
            ref={searchToggleRef}
            variant="ghost"
            size="icon"
            aria-label="Toggle search"
            className="group"
          >
            <Search className="transition-all duration-200 group-data-[state=open]:scale-0 group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
            <X className="absolute scale-0 -rotate-90 transition-all duration-200 group-data-[state=open]:scale-100 group-data-[state=open]:rotate-0 motion-reduce:transition-none" />
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* The side padding leaves room for the input's focus ring, which overflow-hidden would clip. */}
      <CollapsibleContent className="-mx-1 overflow-hidden px-1 pb-4 motion-safe:data-[state=closed]:animate-collapsible-up motion-safe:data-[state=open]:animate-collapsible-down">
        <QuackSearch
          value={search ?? ""}
          onChange={setSearch}
          isSearching={isSearching}
        />
      </CollapsibleContent>

      <QuackList
        quacks={quacks}
        isLoading={!isAwaitingQuery && quacksQuery.isLoading}
        isFetchingNextPage={quacksQuery.isFetchingNextPage}
        isStale={isSearchOpen && quacksQuery.isPlaceholderData}
        emptyMessage={isSearchOpen ? searchEmptyMessage : undefined}
        error={isAwaitingQuery ? undefined : (quacksQuery.error ?? undefined)}
        // Only the error state offers a retry — posting invalidates the list,
        // and refocusing the tab refetches it.
        onReload={() => void quacksQuery.refetch()}
        onLoadMore={canLoadMore ? () => void quacksQuery.fetchNextPage() : undefined}
      />
    </Collapsible>
  )
}
