import { z } from "zod"

import { moodSchema } from "@/lib/moods"

// Per the Applifting frontend playbook: validate every server payload with zod
// and infer types from the schema rather than auto-generating them.
export const quackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
})

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  voteCount: z.number().int().nonnegative(),
})

export const pollSchema = z.object({
  options: z.array(pollOptionSchema),
  // The option the signed-in user picked, null when they haven't voted.
  myOptionId: z.string().nullable(),
})

const quackFields = {
  id: z.string(),
  mood: moodSchema.nullable(),
  createdAt: z.coerce.date(),
  // null = a plain quack without a poll
  poll: pollSchema.nullable(),
  // The quack this one replies to; null for a quack in the feed.
  parentId: z.string().nullable(),
  // Replies that aren't deleted.
  replyCount: z.number().int().nonnegative(),
}

export const quackSchema = z.discriminatedUnion("isDeleted", [
  z.object({
    ...quackFields,
    isDeleted: z.literal(false),
    text: z.string(),
    userId: z.string(),
    user: quackUserSchema,
  }),
  // A deleted quack stays only to hold its replies: the server sends nothing its
  // author wrote, not even who they are (docs/adr/0001).
  z.object({
    ...quackFields,
    isDeleted: z.literal(true),
    text: z.literal(""),
    userId: z.null(),
    user: z.null(),
  }),
])

export const quacksSchema = z.array(quackSchema)

export const quackPageSchema = z.object({
  items: z.array(quackSchema),
  nextOffset: z.number().nullable(),
})

export type Quack = z.infer<typeof quackSchema>
export type Poll = z.infer<typeof pollSchema>
export type QuackPage = z.infer<typeof quackPageSchema>
