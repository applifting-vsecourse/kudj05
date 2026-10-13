import { Angry, Frown, Laugh, Smile, type LucideIcon } from "lucide-react"
import { z } from "zod"

// Shared by the quack feed and the profile settings, which can't import each other.
export const MOODS = ["happy", "sad", "angry", "silly"] as const
export const moodSchema = z.enum(MOODS)
export type Mood = z.infer<typeof moodSchema>

// Record<Mood, …> turns a newly added mood into a type error until it has a label and an icon.
export const MOOD_OPTIONS: Record<Mood, { label: string; icon: LucideIcon }> = {
  happy: { label: "Happy", icon: Smile },
  sad: { label: "Sad", icon: Frown },
  angry: { label: "Angry", icon: Angry },
  silly: { label: "Silly", icon: Laugh },
}
