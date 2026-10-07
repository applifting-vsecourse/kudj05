import { Angry, Frown, Laugh, Smile, type LucideIcon } from "lucide-react"

import type { Mood } from "@/features/quack/api/quackSchemas"

// Record<Mood, …> turns a newly added mood into a type error until it has a label and an icon.
export const MOOD_OPTIONS: Record<Mood, { label: string; icon: LucideIcon }> = {
  happy: { label: "Happy", icon: Smile },
  sad: { label: "Sad", icon: Frown },
  angry: { label: "Angry", icon: Angry },
  silly: { label: "Silly", icon: Laugh },
}
