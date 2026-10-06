import type { ComponentProps } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import { MOODS, type Mood } from "@/features/quack/api/quackSchemas"
import { MOOD_OPTIONS } from "@/features/quack/components/moodOptions"

type MoodPickerProps = Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "dir"> & {
  value: Mood | null
  onChange: (mood: Mood | null) => void
  isDisabled?: boolean
}

export function MoodPicker({ value, onChange, isDisabled, className, ...props }: MoodPickerProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      // Radix reports "nothing selected" as an empty string — picking the active mood again clears it.
      value={value ?? ""}
      onValueChange={(next) => onChange(MOODS.find((mood) => mood === next) ?? null)}
      disabled={isDisabled}
      className={cn("grid w-full grid-cols-4", className)}
      {...props}
    >
      {MOODS.map((mood) => {
        const { icon: Icon, label } = MOOD_OPTIONS[mood]
        return (
          <ToggleGroupItem
            key={mood}
            value={mood}
            className="group/mood h-auto flex-col gap-1 p-2 text-muted-foreground data-[state=on]:border-accent-foreground"
          >
            <Icon
              aria-hidden
              className="size-5 transition-transform duration-200 group-data-[state=on]/mood:scale-110 motion-reduce:transition-none"
            />
            {label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
