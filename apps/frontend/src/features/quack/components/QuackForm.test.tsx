import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { addQuack } from "@/features/quack/api/addQuack"
import { QuackForm } from "@/features/quack/components/QuackForm"

vi.mock("@/features/quack/api/addQuack", () => ({ addQuack: vi.fn() }))

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuackForm />
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
})
