import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { QuackFeed } from "@/features/quack/components/QuackFeed"

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }))

const quack = (id: string, text: string) => ({
  id,
  text,
  mood: null,
  poll: null,
  userId: "u1",
  createdAt: "2026-01-01T12:00:00Z",
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
})

const FEED = [quack("q1", "Crumbs at the pond"), quack("q2", "Rainy day thoughts")]

// Stands in for the backend: the plain feed without `search`, a text match with it.
const respondLikeTheApi = () => {
  vi.mocked(api.get).mockImplementation(((_url: string, options: SearchOptions) => {
    const search = options.searchParams.search?.toLowerCase()
    const items = search ? FEED.filter((item) => item.text.toLowerCase().includes(search)) : FEED
    return { json: () => Promise.resolve({ items, nextOffset: null }) }
  }) as unknown as typeof api.get)
}

type SearchOptions = { searchParams: { search?: string; mine?: boolean } }

const searchRequests = () =>
  vi
    .mocked(api.get)
    .mock.calls.map(([, options]) => (options as SearchOptions).searchParams.search)
    .filter((search) => search !== undefined)

const renderFeed = (onWriteFirst?: () => void) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <button type="button">Somewhere else</button>
      <QuackFeed onWriteFirst={onWriteFirst} />
    </QueryClientProvider>,
  )

const openSearch = async () => {
  await screen.findByText("Crumbs at the pond")
  await userEvent.click(screen.getByRole("button", { name: "Toggle search" }))
  return screen.getByRole("textbox", { name: "Search quacks" })
}

describe("QuackFeed search", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    respondLikeTheApi()
  })

  it("keeps the search field tucked away until the magnifier is clicked", async () => {
    renderFeed()

    await screen.findByText("Crumbs at the pond")
    expect(screen.queryByRole("textbox", { name: "Search quacks" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Toggle search" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("opens a focused field and shows no quacks before anything is typed", async () => {
    renderFeed()
    const field = await openSearch()

    expect(field).toHaveFocus()
    expect(screen.getByRole("button", { name: "Toggle search" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    expect(screen.queryByText("Crumbs at the pond")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Matching quacks will show up here as you type.",
    )
  })

  it("filters while typing, without Enter and without a request per keystroke", async () => {
    renderFeed()
    const field = await openSearch()

    await userEvent.type(field, "pond")

    expect(await screen.findByText("Crumbs at the pond")).toBeInTheDocument()
    expect(screen.queryByText("Rainy day thoughts")).not.toBeInTheDocument()
    expect(searchRequests()).toEqual(["pond"])
  })

  it("says so when nothing matches", async () => {
    renderFeed()
    const field = await openSearch()

    await userEvent.type(field, "zebra")

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("No quacks match “zebra”."),
    )
  })

  it("Clear wipes the query but leaves search open", async () => {
    renderFeed()
    const field = await openSearch()
    await userEvent.type(field, "pond")
    await screen.findByText("Crumbs at the pond")

    await userEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(field).toHaveValue("")
    expect(field).toHaveFocus()
    expect(screen.queryByText("Crumbs at the pond")).not.toBeInTheDocument()
  })

  it("stays open when a result is clicked", async () => {
    renderFeed()
    const field = await openSearch()
    await userEvent.type(field, "pond")

    await userEvent.click(await screen.findByText("Crumbs at the pond"))

    expect(screen.getByRole("textbox", { name: "Search quacks" })).toHaveValue("pond")
  })

  it("closes on a click elsewhere and brings the feed back", async () => {
    renderFeed()
    const field = await openSearch()
    await userEvent.type(field, "pond")
    await screen.findByText("Crumbs at the pond")

    await userEvent.click(screen.getByRole("button", { name: "Somewhere else" }))

    expect(screen.queryByRole("textbox", { name: "Search quacks" })).not.toBeInTheDocument()
    expect(await screen.findByText("Rainy day thoughts")).toBeInTheDocument()
  })

  it("closes on Escape and returns focus to the magnifier", async () => {
    renderFeed()
    await openSearch()

    await userEvent.keyboard("{Escape}")

    expect(screen.queryByRole("textbox", { name: "Search quacks" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Toggle search" })).toHaveFocus()
    expect(await screen.findByText("Rainy day thoughts")).toBeInTheDocument()
  })

  it("starts empty again after being closed with a query", async () => {
    renderFeed()
    const field = await openSearch()
    await userEvent.type(field, "pond")
    await screen.findByText("Crumbs at the pond")

    await userEvent.click(screen.getByRole("button", { name: "Toggle search" }))
    await userEvent.click(screen.getByRole("button", { name: "Toggle search" }))

    expect(screen.getByRole("textbox", { name: "Search quacks" })).toHaveValue("")
  })
})

describe("QuackFeed tabs", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    respondLikeTheApi()
  })

  const mineRequests = () =>
    vi.mocked(api.get).mock.calls.map(([, options]) => (options as SearchOptions).searchParams.mine)

  it("starts on All and asks for Mine only when that tab is picked, without any user id", async () => {
    renderFeed()
    await screen.findByText("Crumbs at the pond")
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true")
    expect(mineRequests()).toEqual([undefined])

    await userEvent.click(screen.getByRole("tab", { name: "Mine" }))

    await waitFor(() => expect(mineRequests()).toContain(true))
    const mineCall = vi
      .mocked(api.get)
      .mock.calls.find(([, options]) => (options as SearchOptions).searchParams.mine)
    expect(Object.keys((mineCall?.[1] as SearchOptions).searchParams)).not.toContain("userId")
  })

  it("says so when Mine is empty and offers to write the first quack", async () => {
    vi.mocked(api.get).mockImplementation(((_url: string, options: SearchOptions) => ({
      json: () =>
        Promise.resolve({ items: options.searchParams.mine ? [] : FEED, nextOffset: null }),
    })) as unknown as typeof api.get)
    const onWriteFirst = vi.fn()
    renderFeed(onWriteFirst)
    await screen.findByText("Crumbs at the pond")

    await userEvent.click(screen.getByRole("tab", { name: "Mine" }))

    expect(await screen.findByText("You haven't posted any quacks yet.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Write your first quack" }))
    expect(onWriteFirst).toHaveBeenCalledOnce()
  })
})
