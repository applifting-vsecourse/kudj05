import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { SessionUser } from "@/features/auth/api/authSessionQueryOptions"
import { SettingsForm } from "@/features/auth/components/SettingsForm"
import { authClient } from "@/features/auth/lib/auth-client"

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { updateUser: vi.fn(), getSession: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn() } }))

const user: SessionUser = {
  id: "u1",
  email: "duck@example.com",
  name: "Caffeinated Duck",
  username: "caffeinatedduck",
  bio: "Coffee first.",
  defaultMood: "happy",
}

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SettingsForm user={user} />
    </QueryClientProvider>,
  )

const username = () => screen.getByLabelText("Username")
const save = () => userEvent.click(screen.getByRole("button", { name: "Save changes" }))
const sentUpdate = () => vi.mocked(authClient.updateUser).mock.calls[0]?.[0]

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.mocked(authClient.updateUser).mockReset()
    vi.mocked(authClient.getSession).mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.info).mockReset()
    vi.mocked(authClient.updateUser).mockResolvedValue({ data: { status: true }, error: null })
    // What the server stored after the save: BetterAuth lower-cases the username.
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: { user: { ...user, username: "new.name_9", name: "Quack Master" } },
      error: null,
    })
  })

  it("starts with what is currently saved", () => {
    renderForm()

    expect(username()).toHaveValue("caffeinatedduck")
    expect(screen.getByLabelText("Display name")).toHaveValue("Caffeinated Duck")
    expect(screen.getByLabelText(/^Bio/)).toHaveValue("Coffee first.")
    expect(screen.getByRole("radio", { name: "Happy" })).toBeChecked()
  })

  it("offers none, happy, sad, angry and silly as the default mood", () => {
    renderForm()

    expect(
      screen.getByRole("radiogroup", { name: "Default mood" }).querySelectorAll("[role=radio]")
        .length,
    ).toBe(5)
    expect(screen.getByRole("radio", { name: "None" })).toBeInTheDocument()
  })

  it.each([
    ["ab", "Use at least 3 characters"],
    ["a".repeat(31), "Use at most 30 characters"],
    ["no spaces", "Use only letters, numbers, dots and underscores"],
  ])("rejects the username %j before asking the server", async (value, message) => {
    renderForm()

    await userEvent.clear(username())
    await userEvent.type(username(), value)
    await save()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(authClient.updateUser).not.toHaveBeenCalled()
  })

  it("requires a display name", async () => {
    renderForm()

    await userEvent.clear(screen.getByLabelText("Display name"))
    await save()

    expect(await screen.findByText("Display name is required")).toBeInTheDocument()
    expect(authClient.updateUser).not.toHaveBeenCalled()
  })

  it("counts the bio and refuses more than 160 characters", async () => {
    renderForm()

    const bio = screen.getByLabelText(/^Bio/)
    await userEvent.clear(bio)
    await userEvent.click(bio)
    await userEvent.paste("x".repeat(161))
    await save()

    expect(screen.getByText("161/160")).toBeInTheDocument()
    expect(await screen.findByText("Keep it under 160 characters")).toBeInTheDocument()
    expect(authClient.updateUser).not.toHaveBeenCalled()
  })

  it("says next to the field that a username is taken and keeps what was typed", async () => {
    vi.mocked(authClient.updateUser).mockResolvedValue({
      data: null,
      error: {
        status: 400,
        code: "USERNAME_IS_ALREADY_TAKEN",
        message: "Username is already taken.",
      },
    })
    renderForm()

    await userEvent.clear(username())
    await userEvent.type(username(), "BreadCritic")
    await save()

    expect(await screen.findByText("That username is already taken")).toBeInTheDocument()
    expect(username()).toHaveValue("BreadCritic")
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("saves only what changed, confirms, and shows what the server stored", async () => {
    renderForm()

    await userEvent.clear(username())
    await userEvent.type(username(), "New.Name_9")
    await userEvent.click(screen.getByRole("radio", { name: "Silly" }))
    await save()

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Settings saved"))
    expect(sentUpdate()).toEqual({
      username: "New.Name_9",
      displayUsername: "New.Name_9",
      defaultMood: "silly",
    })
    await waitFor(() => expect(username()).toHaveValue("new.name_9"))
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeDisabled()
  })

  it("clears the bio and the default mood", async () => {
    renderForm()

    await userEvent.clear(screen.getByLabelText(/^Bio/))
    await userEvent.click(screen.getByRole("radio", { name: "None" }))
    await save()

    await waitFor(() => expect(sentUpdate()).toEqual({ bio: null, defaultMood: null }))
  })

  it("does not call the server when nothing changed", async () => {
    renderForm()

    await save()

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("No changes to save"))
    expect(authClient.updateUser).not.toHaveBeenCalled()
  })

  it("discards edits and returns to what is saved", async () => {
    renderForm()

    await userEvent.clear(username())
    await userEvent.type(username(), "someone_else")
    await userEvent.click(screen.getByRole("radio", { name: "Angry" }))
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }))

    expect(username()).toHaveValue("caffeinatedduck")
    expect(screen.getByRole("radio", { name: "Happy" })).toBeChecked()
    expect(authClient.updateUser).not.toHaveBeenCalled()
  })

  it("shows a server error that belongs to no field above the form", async () => {
    vi.mocked(authClient.updateUser).mockResolvedValue({
      data: null,
      error: { status: 500, message: "Something broke" },
    })
    renderForm()

    await userEvent.type(screen.getByLabelText(/^Bio/), "!")
    await save()

    expect(await screen.findByText("Something broke")).toBeInTheDocument()
  })
})
