import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { QuackSearch } from "@/features/quack/components/QuackSearch"

function ControlledSearch({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue)
  return (
    <QuackSearch
      value={value}
      onChange={setValue}
    />
  )
}

describe("QuackSearch", () => {
  it("has a visible label and takes focus as soon as it appears", () => {
    render(<ControlledSearch />)

    expect(screen.getByText("Search quacks")).toBeVisible()
    expect(screen.getByLabelText("Search quacks")).toHaveFocus()
  })

  it("only offers Clear once something is typed", async () => {
    render(<ControlledSearch />)
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText("Search quacks"), "pond")
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument()
  })

  it("Clear empties the field and hands focus back to it", async () => {
    render(<ControlledSearch initialValue="pond" />)

    await userEvent.click(screen.getByRole("button", { name: "Clear" }))

    expect(screen.getByLabelText("Search quacks")).toHaveValue("")
    expect(screen.getByLabelText("Search quacks")).toHaveFocus()
  })
})
