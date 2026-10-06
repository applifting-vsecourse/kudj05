import { useEffect, useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search, X } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  component: QuacksPage,
})

function QuacksPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const clearSearch = () => {
    setSearch("")
    setDebouncedSearch("")
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!isSearchOpen) return
    searchInputRef.current?.focus()
    const handlePointerDown = (event: PointerEvent) => {
      if (searchRef.current?.contains(event.target as Node)) return
      setIsSearchOpen(false)
      clearSearch()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [isSearchOpen])

  const quacksQuery = useInfiniteQuery({
    ...quacksQueryOptions(isSearchOpen ? debouncedSearch : ""),
    enabled: !isSearchOpen || Boolean(debouncedSearch),
  })
  const quacks =
    isSearchOpen && !debouncedSearch
      ? []
      : (quacksQuery.data?.pages.flatMap((page) => page.items) ?? [])

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Quacks</h1>
          {!isSearchOpen ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search posts"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search />
            </Button>
          ) : null}
        </div>

        {isSearchOpen ? (
          <div
            ref={searchRef}
            className="mb-4 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <label
                htmlFor="quack-search"
                className="sr-only"
              >
                Search posts
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="quack-search"
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search posts or authors"
                className="pr-16 pl-9"
              />
              {search ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                  onClick={clearSearch}
                >
                  <X className="size-3.5" />
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <QuackForm className="mb-4" />

        <QuackList
          quacks={quacks}
          isLoading={quacksQuery.isLoading}
          isFetchingNextPage={quacksQuery.isFetchingNextPage}
          isSearchOpen={isSearchOpen}
          hasSearchQuery={Boolean(debouncedSearch)}
          error={quacksQuery.error ?? undefined}
          // Only the error state offers a retry — posting invalidates the list,
          // and refocusing the tab refetches it.
          onReload={() => void quacksQuery.refetch()}
          onLoadMore={quacksQuery.hasNextPage ? () => void quacksQuery.fetchNextPage() : undefined}
        />
      </section>
    </>
  )
}
