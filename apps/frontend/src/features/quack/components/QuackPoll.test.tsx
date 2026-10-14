import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { QuackPoll } from "@/features/quack/components/QuackPoll"

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  options: [
    { id: "o1", text: "Pizza", voteCount: 3 },
    { id: "o2", text: "Sushi", voteCount: 1 },
    { id: "o3", text: "Soup", voteCount: 0 },
  ],
  myOptionId: null,
  ...overrides,
})

describe("QuackPoll", () => {
  it("shows every option in order with its count, before voting too", () => {
    render(<QuackPoll poll={poll()} />)

    const options = screen.getAllByRole("radio")
    expect(options.map((option) => option.textContent)).toEqual([
      "Pizza3 votes",
      "Sushi1 vote",
      "Soup0 votes",
    ])
  })

  it("shows a total that is the sum of the counts", () => {
    render(<QuackPoll poll={poll()} />)
    expect(screen.getByText("4 votes")).toBeInTheDocument()
  })

  it("words a single vote in the singular", () => {
    render(
      <QuackPoll
        poll={poll({
          options: [
            { id: "o1", text: "Pizza", voteCount: 1 },
            { id: "o2", text: "Sushi", voteCount: 0 },
          ],
        })}
      />,
    )
    expect(screen.getByText("1 vote", { selector: "p" })).toBeInTheDocument()
  })

  it("says so when nobody has voted yet", () => {
    render(
      <QuackPoll
        poll={poll({
          options: [
            { id: "o1", text: "Pizza", voteCount: 0 },
            { id: "o2", text: "Sushi", voteCount: 0 },
          ],
        })}
      />,
    )
    expect(screen.getByText("No votes yet")).toBeInTheDocument()
  })

  it("marks the option the user voted for", () => {
    render(<QuackPoll poll={poll({ myOptionId: "o2" })} />)

    expect(screen.getByRole("radio", { name: /sushi/i })).toBeChecked()
    expect(screen.getByRole("radio", { name: /sushi/i })).toHaveTextContent("Your vote")
    expect(screen.getByRole("radio", { name: /pizza/i })).not.toBeChecked()
    expect(screen.getAllByText("Your vote")).toHaveLength(1)
  })

  it("marks nothing when the user has not voted", () => {
    render(<QuackPoll poll={poll()} />)
    expect(screen.queryByText("Your vote")).not.toBeInTheDocument()
  })
})
