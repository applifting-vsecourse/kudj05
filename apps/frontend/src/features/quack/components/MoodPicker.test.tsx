import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MoodPicker } from "@/features/quack/components/MoodPicker"

describe("MoodPicker", () => {
  it("offers the four moods side by side, each with a visible label", () => {
    render(
      <MoodPicker
        value={null}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getAllByRole("radio").map((option) => option.textContent)).toEqual([
      "Happy",
      "Sad",
      "Angry",
      "Silly",
    ])
  })

  it("marks only the chosen mood as selected", () => {
    render(
      <MoodPicker
        value="sad"
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole("radio", { name: "Sad" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Happy" })).not.toBeChecked()
  })

  it("reports the mood the user picks", async () => {
    const onChange = vi.fn()
    render(
      <MoodPicker
        value={null}
        onChange={onChange}
      />,
    )

    await userEvent.click(screen.getByRole("radio", { name: "Silly" }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith("silly")
  })

  it("clears the mood when the selected one is picked again", async () => {
    const onChange = vi.fn()
    render(
      <MoodPicker
        value="happy"
        onChange={onChange}
      />,
    )

    await userEvent.click(screen.getByRole("radio", { name: "Happy" }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null)
  })
})
