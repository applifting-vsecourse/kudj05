// Example component test — the pattern to copy for your own components.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

type LiveQuack = Extract<Quack, { isDeleted: false }>

const quack = (overrides: Partial<LiveQuack> = {}): LiveQuack => ({
  id: "q1",
  text: "quack quack",
  mood: null,
  poll: null,
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  isDeleted: false,
  parentId: null,
  replyCount: 0,
  ...overrides,
})

// What the server sends for a deleted quack: nothing its author wrote.
const tombstone = (replyCount: number): Quack => ({
  id: "q9",
  text: "",
  mood: null,
  poll: null,
  userId: null,
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: null,
  isDeleted: true,
  parentId: null,
  replyCount,
})

vi.mock("@/lib/api-client", () => ({ api: { delete: vi.fn(), get: vi.fn(), post: vi.fn() } }))

const renderList = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

describe("QuackList", () => {
  beforeEach(() => {
    vi.mocked(api.delete).mockReset()
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  it("shows a deleted quack without anything its author wrote, and no Delete", () => {
    renderList(
      <QuackList
        currentUserId="u9"
        canDeleteAny
        quacks={[tombstone(2)]}
      />,
    )

    expect(screen.getByText("This quack was deleted.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "2 replies" })).toBeInTheDocument()
  })

  it("counts the replies on the thread button", () => {
    renderList(
      <QuackList
        quacks={[
          quack({ id: "q1", replyCount: 0 }),
          quack({ id: "q2", replyCount: 1 }),
          quack({ id: "q3", replyCount: 3 }),
        ]}
      />,
    )

    expect(screen.getByRole("button", { name: "Reply" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "1 reply" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3 replies" })).toBeInTheDocument()
  })

  it("opens the thread with its replies and posts a reply to the quack", async () => {
    const reply = quack({ id: "r1", text: "count me in", parentId: "q1", userId: "u2" })
    vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([reply]) } as never)
    vi.mocked(api.post).mockReturnValue({
      json: () => Promise.resolve({ ...reply, id: "r2", text: "me too" }),
    } as never)
    renderList(<QuackList quacks={[quack({ replyCount: 1 })]} />)

    await userEvent.click(screen.getByRole("button", { name: "1 reply" }))

    expect(await screen.findByText("count me in")).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith("quacks/q1/replies")

    await userEvent.type(screen.getByRole("textbox", { name: "Your reply" }), "me too")
    await userEvent.click(screen.getByRole("button", { name: "Reply" }))

    expect(api.post).toHaveBeenCalledWith("quacks/q1/replies", { json: { text: "me too" } })
  })

  it("won't send an empty reply", async () => {
    vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([]) } as never)
    renderList(<QuackList quacks={[quack()]} />)

    await userEvent.click(screen.getByRole("button", { name: "Reply" }))
    expect(await screen.findByText("No replies yet. Be the first to reply.")).toBeInTheDocument()

    await userEvent.click(
      within(screen.getByRole("article")).getAllByRole("button", { name: "Reply" })[1]!,
    )

    expect(await screen.findByText("Write something first")).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("takes no new replies under a deleted quack", async () => {
    vi.mocked(api.get).mockReturnValue({
      json: () => Promise.resolve([quack({ id: "r1", text: "still here", parentId: "q9" })]),
    } as never)
    renderList(<QuackList quacks={[tombstone(1)]} />)

    await userEvent.click(screen.getByRole("button", { name: "1 reply" }))

    expect(await screen.findByText("still here")).toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Your reply" })).not.toBeInTheDocument()
  })

  it("shows the mood of a quack that has one", () => {
    render(<QuackList quacks={[quack({ mood: "silly" })]} />)
    expect(screen.getByText("Silly")).toBeInTheDocument()
  })

  it("says what would appear when there are no quacks", () => {
    render(<QuackList quacks={[]} />)
    expect(screen.getByRole("status")).toHaveTextContent("No quacks yet. Post the first one.")
  })

  it("lets the caller word the empty state", () => {
    render(
      <QuackList
        quacks={[]}
        emptyMessage="No quacks match “pond”."
      />,
    )
    expect(screen.getByRole("status")).toHaveTextContent("No quacks match “pond”.")
  })

  it("renders quacks with author info", () => {
    render(<QuackList quacks={[quack()]} />)

    expect(screen.getByText("quack quack")).toBeInTheDocument()
    expect(screen.getByText("Caffeinated Duck")).toBeInTheDocument()
    expect(screen.getByText("@CaffeinatedDuck")).toBeInTheDocument()
  })

  it("shows an error with a working reload button", async () => {
    const onReload = vi.fn()
    render(
      <QuackList
        quacks={[]}
        error={new Error("Server unreachable")}
        onReload={onReload}
      />,
    )

    expect(screen.getByText("Couldn't load quacks")).toBeInTheDocument()
    expect(screen.getByText("Server unreachable")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })

  it("offers Delete on my quacks only", () => {
    renderList(
      <QuackList
        currentUserId="u1"
        quacks={[
          quack({ id: "q1", text: "mine" }),
          quack({ id: "q2", text: "theirs", userId: "u2" }),
        ]}
      />,
    )

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1)
  })

  it("offers Delete on every quack to an admin or a moderator", () => {
    renderList(
      <QuackList
        currentUserId="u9"
        canDeleteAny
        quacks={[
          quack({ id: "q1", text: "spam" }),
          quack({ id: "q2", text: "more spam", userId: "u2" }),
        ]}
      />,
    )

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2)
  })

  it("names the author when someone else's quack is about to go", async () => {
    vi.mocked(api.delete).mockResolvedValue({} as never)
    renderList(
      <QuackList
        currentUserId="u9"
        canDeleteAny
        quacks={[quack()]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.getByText("Delete @CaffeinatedDuck's quack?")).toBeInTheDocument()

    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    )
    expect(api.delete).toHaveBeenCalledWith("quacks/q1")
  })

  it("asks before deleting and deletes only after confirming", async () => {
    vi.mocked(api.delete).mockResolvedValue({} as never)
    renderList(
      <QuackList
        currentUserId="u1"
        quacks={[quack()]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.getByText("Delete this quack?")).toBeInTheDocument()
    expect(api.delete).not.toHaveBeenCalled()

    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    )
    expect(api.delete).toHaveBeenCalledWith("quacks/q1")
  })

  it("does not delete when the question is cancelled", async () => {
    renderList(
      <QuackList
        currentUserId="u1"
        quacks={[quack()]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(api.delete).not.toHaveBeenCalled()
  })
})
