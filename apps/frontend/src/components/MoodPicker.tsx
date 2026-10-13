import type { ComponentProps } from "react"
import { Ban } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MOOD_OPTIONS, MOODS, type Mood } from "@/lib/moods"
import { cn } from "@/lib/utils"

type MoodPickerProps = Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "dir"> & {
  value: Mood | null
  onChange: (mood: Mood | null) => void
  isDisabled?: boolean
  // Adds an explicit "no mood" option in front of the moods. Without it, "no mood" is
  // reached by picking the selected mood again, which is fine when the field is optional.
  noneLabel?: string
}

const NONE = "none"
const itemClassName =
  "group/mood h-auto flex-col gap-1 p-2 text-muted-foreground data-[state=on]:border-accent-foreground"
const iconClassName =
  "size-5 transition-transform duration-200 group-data-[state=on]/mood:scale-110 motion-reduce:transition-none"

export function MoodPicker({
  value,
  onChange,
  isDisabled,
  noneLabel,
  className,
  ...props
}: MoodPickerProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      // Radix reports "nothing selected" as an empty string — picking the active mood again clears it.
      value={value ?? (noneLabel ? NONE : "")}
      onValueChange={(next) => onChange(MOODS.find((mood) => mood === next) ?? null)}
      disabled={isDisabled}
      className={cn("grid w-full", noneLabel ? "grid-cols-5" : "grid-cols-4", className)}
      {...props}
    >
      {noneLabel ? (
        <ToggleGroupItem
          value={NONE}
          className={itemClassName}
        >
          <Ban
            aria-hidden
            className={iconClassName}
          />
          {noneLabel}
        </ToggleGroupItem>
      ) : null}
      {MOODS.map((mood) => {
        const { icon: Icon, label } = MOOD_OPTIONS[mood]
        return (
          <ToggleGroupItem
            key={mood}
            value={mood}
            className={itemClassName}
          >
            <Icon
              aria-hidden
              className={iconClassName}
            />
            {label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
