import { describe, expect, it } from "vitest"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { applyVote } from "@/features/quack/hooks/useVote"

const poll = (myOptionId: string | null, counts: [number, number]): Poll => ({
  options: [
    { id: "o1", text: "Pizza", voteCount: counts[0] },
    { id: "o2", text: "Sushi", voteCount: counts[1] },
  ],
  myOptionId,
})

describe("applyVote", () => {
  it("adds a first vote", () => {
    expect(applyVote(poll(null, [2, 1]), "o2")).toEqual(poll("o2", [2, 2]))
  })

  it("moves a vote without changing the total", () => {
    expect(applyVote(poll("o1", [2, 1]), "o2")).toEqual(poll("o2", [1, 2]))
  })

  it("takes a vote back", () => {
    expect(applyVote(poll("o1", [2, 1]), null)).toEqual(poll(null, [1, 1]))
  })
})
