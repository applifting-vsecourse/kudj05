import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ListChecks, Loader2, Plus, X } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { MoodPicker } from "@/components/MoodPicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { moodSchema, type Mood } from "@/lib/moods"
import { cn } from "@/lib/utils"

import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

// Mirrors the server-side DTO (MaxLength(280)) so the user is told before
// the request is made — the server still validates independently.
const MAX_LENGTH = 280
// Same limits as the server: 2–4 options, each up to 80 characters.
const POLL_MIN_OPTIONS = 2
const POLL_MAX_OPTIONS = 4
const POLL_OPTION_MAX_LENGTH = 80
// Placeholders are examples that answer the example question, never labels.
const OPTION_EXAMPLES = ["Pizza", "Sushi", "Burgers", "Salad"]

const pollOptionsSchema = z
  .array(
    z.object({
      text: z
        .string()
        .trim()
        .min(1, "Fill in this option")
        .max(POLL_OPTION_MAX_LENGTH, `Keep it under ${POLL_OPTION_MAX_LENGTH} characters`),
    }),
  )
  .superRefine((options, ctx) => {
    // Compared the way the server compares them; the later copy gets the message.
    const seen = new Set<string>()
    options.forEach((option, index) => {
      const key = option.text.toLocaleLowerCase()
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: "Options have to differ", path: [index, "text"] })
      }
      seen.add(key)
    })
  })

const schema = z.object({
  // Optional: null means the quack is posted without a mood.
  mood: moodSchema.nullable(),
  text: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
  // An empty list means a plain quack; a poll always has at least two fields on screen.
  pollOptions: pollOptionsSchema,
})

type FormValues = z.infer<typeof schema>

type QuackFormProps = {
  className?: string
  // The user's preferred mood for new quacks; the form starts out (and starts over) with it.
  defaultMood?: Mood | null
}

export function QuackForm({ className, defaultMood = null }: QuackFormProps) {
  const addQuack = useAddQuack()
  const moodLabelId = useId()
  const pollLabelId = useId()
  const emptyForm: FormValues = { text: "", mood: defaultMood, pollOptions: [] }
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  })
  const pollOptions = useFieldArray({ control: form.control, name: "pollOptions" })
  const isPoll = pollOptions.fields.length > 0

  const text = useWatch({ control: form.control, name: "text" })
  const length = text?.length ?? 0

  const handleSubmit = (values: FormValues) => {
    addQuack.mutate(
      {
        text: values.text,
        mood: values.mood ?? undefined,
        poll: isPoll ? { options: values.pollOptions.map((option) => option.text) } : undefined,
      },
      { onSuccess: () => form.reset(emptyForm) },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-3", className)}
      >
        {addQuack.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addQuack.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {/* With a poll the text is its question, so both sit in one frame. The text field keeps
            its place in the tree either way, so adding or removing the poll doesn't remount it. */}
        <div
          role={isPoll ? "group" : undefined}
          aria-labelledby={isPoll ? pollLabelId : undefined}
          className={cn("flex flex-col gap-3", isPoll && "rounded-lg border border-border p-4")}
        >
          {isPoll ? (
            <div className="flex items-center justify-between gap-3">
              <span
                id={pollLabelId}
                className="text-sm font-medium"
              >
                Poll
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={addQuack.isPending}
                onClick={() => pollOptions.replace([])}
              >
                Remove poll
              </Button>
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isPoll ? "Question" : "New quack"}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={isPoll ? 2 : 3}
                    placeholder={isPoll ? "Where do we go for lunch?" : "Quack something..."}
                    disabled={addQuack.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isPoll ? (
            <>
              {pollOptions.fields.map((option, index) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name={`pollOptions.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option {index + 1}</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            placeholder={OPTION_EXAMPLES[index]}
                            disabled={addQuack.isPending}
                            {...field}
                          />
                        </FormControl>
                        {index >= POLL_MIN_OPTIONS ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove option ${index + 1}`}
                            disabled={addQuack.isPending}
                            onClick={() => pollOptions.remove(index)}
                          >
                            <X />
                          </Button>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              {pollOptions.fields.length < POLL_MAX_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  disabled={addQuack.isPending}
                  onClick={() => pollOptions.append({ text: "" })}
                >
                  <Plus aria-hidden />
                  Add option
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={addQuack.isPending}
              onClick={() =>
                // Focuses the first of the two new fields.
                pollOptions.append([{ text: "" }, { text: "" }], { focusIndex: 0 })
              }
            >
              <ListChecks aria-hidden />
              Add poll
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem className="w-full sm:max-w-sm">
                <FormLabel id={moodLabelId}>
                  Mood <span className="font-normal text-muted-foreground">optional</span>
                </FormLabel>
                <FormControl>
                  <MoodPicker
                    aria-labelledby={moodLabelId}
                    value={field.value}
                    onChange={field.onChange}
                    isDisabled={addQuack.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="ml-auto flex items-center gap-3">
            <span
              className={cn(
                "text-sm",
                length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {length}/{MAX_LENGTH}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={addQuack.isPending}
            >
              {addQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Quack
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
