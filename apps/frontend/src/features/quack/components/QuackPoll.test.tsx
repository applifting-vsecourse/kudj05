import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, QuackPage } from "@/features/quack/api/quackSchemas"
import { votePoll } from "@/features/quack/api/votePoll"
import { QuackPoll } from "@/features/quack/components/QuackPoll"

vi.mock("@/features/quack/api/votePoll", () => ({ votePoll: vi.fn() }))

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  options: [
    { id: "o1", text: "Pizza", voteCount: 3 },
    { id: "o2", text: "Sushi", voteCount: 1 },
    { id: "o3", text: "Soup", voteCount: 0 },
  ],
  myOptionId: null,
  ...overrides,
})

// Stands in for the database: what the feed gets whenever it is (re)fetched.
let serverPoll: Poll

const pageWith = (current: Poll): QuackPage => ({
  items: [
    {
      id: "q1",
      text: "Where do we go for lunch?",
      mood: null,
      poll: current,
      userId: "u1",
      createdAt: new Date("2026-01-01T12:00:00Z"),
      user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
    },
  ],
  nextOffset: null,
})

// Reads the poll from the cached feed, the way QuackItem gets it, so optimistic updates show up.
function FeedPoll() {
  const feed = useInfiniteQuery({
    queryKey: quackKeys.lists(""),
    initialPageParam: 0,
    queryFn: () => pageWith(serverPoll),
    getNextPageParam: () => undefined,
  })
  const current = feed.data?.pages[0]?.items[0]?.poll
  return current ? (
    <QuackPoll
      quackId="q1"
      poll={current}
    />
  ) : null
}

const renderPoll = (initial: Poll) => {
  serverPoll = initial
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <FeedPoll />
    </QueryClientProvider>,
  )
}

// A request that stays in flight, to look at the poll before the server answers.
const neverAnswers = (): Promise<Poll> => new Promise(() => undefined)

const option = (name: RegExp) => screen.getByRole("radio", { name })
const total = () => screen.getByText(/votes?$|No votes yet/, { selector: "p" })

describe("QuackPoll", () => {
  beforeEach(() => {
    vi.mocked(votePoll).mockReset()
  })

  it("shows every option in order with its count, before voting too", async () => {
    renderPoll(poll())

    const options = await screen.findAllByRole("radio")
    expect(options.map((item) => item.textContent)).toEqual([
      "Pizza3 votes",
      "Sushi1 vote",
      "Soup0 votes",
    ])
    expect(total()).toHaveTextContent("4 votes")
  })

  it("words a single vote in the singular", async () => {
    renderPoll(
      poll({
        options: [
          { id: "o1", text: "Pizza", voteCount: 1 },
          { id: "o2", text: "Sushi", voteCount: 0 },
        ],
      }),
    )
    expect(await screen.findByText("1 vote", { selector: "p" })).toBeInTheDocument()
  })

  it("says so when nobody has voted yet", async () => {
    renderPoll(
      poll({
        options: [
          { id: "o1", text: "Pizza", voteCount: 0 },
          { id: "o2", text: "Sushi", voteCount: 0 },
        ],
      }),
    )
    expect(await screen.findByText("No votes yet")).toBeInTheDocument()
  })

  it("marks the option the user voted for, and nothing else", async () => {
    renderPoll(poll({ myOptionId: "o2" }))

    expect(await screen.findByRole("radio", { name: /sushi/i })).toBeChecked()
    expect(option(/sushi/i)).toHaveTextContent("Your vote")
    expect(option(/pizza/i)).not.toBeChecked()
    expect(screen.getAllByText("Your vote")).toHaveLength(1)
  })

  it("counts a vote at once, before the server answers", async () => {
    vi.mocked(votePoll).mockReturnValue(neverAnswers())
    renderPoll(poll())

    await userEvent.click(await screen.findByRole("radio", { name: /soup/i }))

    expect(option(/soup/i)).toBeChecked()
    expect(option(/soup/i)).toHaveTextContent(/1 vote$/)
    expect(total()).toHaveTextContent("5 votes")
    expect(votePoll).toHaveBeenCalledWith({ quackId: "q1", optionId: "o3" })
  })

  it("moves a vote to another option without changing the total", async () => {
    vi.mocked(votePoll).mockReturnValue(neverAnswers())
    renderPoll(poll({ myOptionId: "o1" }))

    await userEvent.click(await screen.findByRole("radio", { name: /sushi/i }))

    expect(option(/pizza/i)).toHaveTextContent(/2 votes$/)
    expect(option(/sushi/i)).toHaveTextContent(/2 votes$/)
    expect(total()).toHaveTextContent("4 votes")
  })

  it("takes the vote back when the picked option is clicked again", async () => {
    vi.mocked(votePoll).mockReturnValue(neverAnswers())
    renderPoll(poll({ myOptionId: "o1" }))

    await userEvent.click(await screen.findByRole("radio", { name: /pizza/i }))

    expect(option(/pizza/i)).not.toBeChecked()
    expect(option(/pizza/i)).toHaveTextContent(/2 votes$/)
    expect(screen.queryByText("Your vote")).not.toBeInTheDocument()
    expect(votePoll).toHaveBeenCalledWith({ quackId: "q1", optionId: null })
  })

  it("ignores further clicks while a vote is being saved", async () => {
    vi.mocked(votePoll).mockReturnValue(neverAnswers())
    renderPoll(poll())

    await userEvent.click(await screen.findByRole("radio", { name: /soup/i }))
    await userEvent.click(option(/sushi/i))

    expect(votePoll).toHaveBeenCalledOnce()
    expect(option(/soup/i)).toBeChecked()
  })

  it("shows what the server counted once it answers, other people's votes included", async () => {
    const counted = poll({
      options: [
        { id: "o1", text: "Pizza", voteCount: 3 },
        { id: "o2", text: "Sushi", voteCount: 2 },
        { id: "o3", text: "Soup", voteCount: 1 },
      ],
      myOptionId: "o3",
    })
    vi.mocked(votePoll).mockImplementation(() => {
      serverPoll = counted
      return Promise.resolve(counted)
    })
    renderPoll(poll())

    await userEvent.click(await screen.findByRole("radio", { name: /soup/i }))

    await waitFor(() => expect(total()).toHaveTextContent("6 votes"))
    expect(option(/sushi/i)).toHaveTextContent(/2 votes$/)
  })

  it("puts everything back and says so when the vote isn't saved", async () => {
    vi.mocked(votePoll).mockRejectedValue(new Error("Failed to fetch"))
    renderPoll(poll({ myOptionId: "o1" }))

    await userEvent.click(await screen.findByRole("radio", { name: /sushi/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Your vote wasn’t saved. Try again.")
    expect(option(/pizza/i)).toBeChecked()
    expect(option(/pizza/i)).toHaveTextContent(/3 votes$/)
    expect(option(/sushi/i)).toHaveTextContent(/1 vote$/)
    expect(total()).toHaveTextContent("4 votes")
  })

  it("clears the error on the next try", async () => {
    vi.mocked(votePoll).mockRejectedValueOnce(new Error("Failed to fetch"))
    renderPoll(poll())

    await userEvent.click(await screen.findByRole("radio", { name: /sushi/i }))
    await screen.findByRole("alert")

    vi.mocked(votePoll).mockReturnValue(neverAnswers())
    await userEvent.click(option(/sushi/i))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(option(/sushi/i)).toBeChecked()
  })

  it("can be used from the keyboard", async () => {
    vi.mocked(votePoll).mockReturnValue(neverAnswers())
    renderPoll(poll())
    await screen.findAllByRole("radio")

    await userEvent.tab()
    expect(option(/pizza/i)).toHaveFocus()
    await userEvent.keyboard("{Enter}")

    expect(votePoll).toHaveBeenCalledWith({ quackId: "q1", optionId: "o1" })
  })
})
