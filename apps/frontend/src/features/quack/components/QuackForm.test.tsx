import type { ComponentProps } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { addQuack } from "@/features/quack/api/addQuack"
import { QuackForm } from "@/features/quack/components/QuackForm"

vi.mock("@/features/quack/api/addQuack", () => ({ addQuack: vi.fn() }))

const renderForm = (props: ComponentProps<typeof QuackForm> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuackForm {...props} />
    </QueryClientProvider>,
  )

const postedQuack = () => vi.mocked(addQuack).mock.calls[0]?.[0]

describe("QuackForm mood", () => {
  beforeEach(() => {
    vi.mocked(addQuack).mockReset()
    vi.mocked(addQuack).mockResolvedValue({
      id: "q1",
      text: "hello pond",
      mood: null,
      poll: null,
      userId: "u1",
      createdAt: new Date("2026-01-01T12:00:00Z"),
      user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
    })
  })

  it("labels the mood options as one group", () => {
    renderForm()
    expect(screen.getByRole("radiogroup", { name: "Mood optional" })).toBeInTheDocument()
  })

  it("posts the picked mood with the quack and starts over afterwards", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "hello pond")
    await userEvent.click(screen.getByRole("radio", { name: "Silly" }))
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    await waitFor(() => expect(postedQuack()).toEqual({ text: "hello pond", mood: "silly" }))
    await waitFor(() => expect(screen.getByRole("radio", { name: "Silly" })).not.toBeChecked())
  })

  it("posts without a mood when none is picked", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "hello pond")
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    await waitFor(() => expect(postedQuack()).toEqual({ text: "hello pond", mood: undefined }))
  })

  it("starts with the user's default mood picked and posts it", async () => {
    renderForm({ defaultMood: "sad" })

    expect(screen.getByRole("radio", { name: "Sad" })).toBeChecked()

    await userEvent.type(screen.getByLabelText("New quack"), "hello pond")
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    await waitFor(() => expect(postedQuack()).toEqual({ text: "hello pond", mood: "sad" }))
    // After posting, the next quack starts from the default again, not from nothing.
    await waitFor(() => expect(screen.getByRole("radio", { name: "Sad" })).toBeChecked())
  })

  it("lets the user change the default mood for a single quack", async () => {
    renderForm({ defaultMood: "sad" })

    await userEvent.type(screen.getByLabelText("New quack"), "hello pond")
    await userEvent.click(screen.getByRole("radio", { name: "Sad" }))
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    await waitFor(() => expect(postedQuack()).toEqual({ text: "hello pond", mood: undefined }))
  })
})

describe("QuackForm poll", () => {
  beforeEach(() => {
    vi.mocked(addQuack).mockReset()
    vi.mocked(addQuack).mockResolvedValue({
      id: "q1",
      text: "Where do we go for lunch?",
      mood: null,
      poll: null,
      userId: "u1",
      createdAt: new Date("2026-01-01T12:00:00Z"),
      user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
    })
  })

  const startPoll = async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText("New quack"), "Where do we go for lunch?")
    await userEvent.click(screen.getByRole("button", { name: "Add poll" }))
  }
  const optionField = (number: number) => screen.getByLabelText(`Option ${number}`)
  const submit = () => userEvent.click(screen.getByRole("button", { name: "Quack" }))

  it("turns the text into the question, framed together with the options", async () => {
    await startPoll()

    const poll = screen.getByRole("group", { name: "Poll" })
    expect(within(poll).getByLabelText("Question")).toHaveValue("Where do we go for lunch?")
    expect(within(poll).getByLabelText("Option 1")).toBeInTheDocument()
    expect(screen.queryByLabelText("New quack")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Remove poll" }))

    expect(screen.getByLabelText("New quack")).toHaveValue("Where do we go for lunch?")
    expect(screen.queryByRole("group", { name: "Poll" })).not.toBeInTheDocument()
  })

  it("adds two labelled option fields and puts the cursor in the first", async () => {
    await startPoll()

    expect(optionField(1)).toHaveFocus()
    expect(optionField(2)).toBeInTheDocument()
    expect(screen.queryByLabelText("Option 3")).not.toBeInTheDocument()
  })

  it("adds options up to four, then hides the button", async () => {
    await startPoll()

    await userEvent.click(screen.getByRole("button", { name: "Add option" }))
    expect(optionField(3)).toHaveFocus()
    await userEvent.click(screen.getByRole("button", { name: "Add option" }))

    expect(optionField(4)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add option" })).not.toBeInTheDocument()
  })

  it("lets the third and fourth option be removed, never the first two", async () => {
    await startPoll()
    await userEvent.click(screen.getByRole("button", { name: "Add option" }))

    expect(screen.queryByRole("button", { name: "Remove option 1" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove option 2" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Remove option 3" }))
    expect(screen.queryByLabelText("Option 3")).not.toBeInTheDocument()
  })

  it("posts the trimmed options in order and starts over without a poll", async () => {
    await startPoll()
    await userEvent.type(optionField(1), "  Pizza ")
    await userEvent.type(optionField(2), "Sushi")
    await userEvent.click(screen.getByRole("button", { name: "Add option" }))
    await userEvent.type(optionField(3), "Soup")
    await submit()

    await waitFor(() =>
      expect(postedQuack()).toEqual({
        text: "Where do we go for lunch?",
        mood: undefined,
        poll: { options: ["Pizza", "Sushi", "Soup"] },
      }),
    )
    await waitFor(() => expect(screen.queryByLabelText("Option 1")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Add poll" })).toBeInTheDocument()
    expect(screen.getByLabelText("New quack")).toHaveValue("")
  })

  it("posts a plain quack after the poll is removed", async () => {
    await startPoll()
    await userEvent.type(optionField(1), "Pizza")
    await userEvent.click(screen.getByRole("button", { name: "Remove poll" }))
    await submit()

    await waitFor(() =>
      expect(postedQuack()).toEqual({ text: "Where do we go for lunch?", mood: undefined }),
    )
  })

  it("asks to fill in an empty option and posts nothing", async () => {
    await startPoll()
    await userEvent.type(optionField(1), "Pizza")
    await userEvent.type(optionField(2), "   ")
    await submit()

    expect(await screen.findByText("Fill in this option")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("rejects an option over 80 characters", async () => {
    await startPoll()
    await userEvent.type(optionField(1), "Pizza")
    await userEvent.type(optionField(2), "x".repeat(81))
    await submit()

    expect(await screen.findByText("Keep it under 80 characters")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("rejects the same option twice, ignoring case and spaces, under the second copy", async () => {
    await startPoll()
    await userEvent.type(optionField(1), "Pizza")
    await userEvent.type(optionField(2), " pizza ")
    await submit()

    expect(await screen.findByText("Options have to differ")).toBeInTheDocument()
    expect(optionField(2)).toHaveAttribute("aria-invalid", "true")
    expect(optionField(1)).toHaveAttribute("aria-invalid", "false")
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("still needs the question itself", async () => {
    renderForm()
    await userEvent.click(screen.getByRole("button", { name: "Add poll" }))
    await userEvent.type(optionField(1), "Pizza")
    await userEvent.type(optionField(2), "Sushi")
    await submit()

    expect(await screen.findByText("Write something first")).toBeInTheDocument()
    expect(screen.getByLabelText("Question")).toHaveAttribute("aria-invalid", "true")
    expect(addQuack).not.toHaveBeenCalled()
  })
})
