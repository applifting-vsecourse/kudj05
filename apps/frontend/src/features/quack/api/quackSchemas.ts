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

export const quackSchema = z.object({
  id: z.string(),
  text: z.string(),
  mood: moodSchema.nullable(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  // null = a plain quack without a poll
  poll: pollSchema.nullable(),
  user: quackUserSchema,
})

export const quacksSchema = z.array(quackSchema)

export const quackPageSchema = z.object({
  items: z.array(quackSchema),
  nextOffset: z.number().nullable(),
})

export type Quack = z.infer<typeof quackSchema>
export type Poll = z.infer<typeof pollSchema>
