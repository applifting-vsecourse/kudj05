import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { MoodPicker } from "@/components/MoodPicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { moodSchema } from "@/lib/moods"
import { cn } from "@/lib/utils"

import type { SessionUser } from "@/features/auth/api/authSessionQueryOptions"
import {
  ProfileUpdateError,
  useUpdateProfile,
  type ProfileUpdate,
} from "@/features/auth/hooks/useUpdateProfile"

// These mirror the server rules (BetterAuth's username plugin and the profile
// hook in the backend) so the user is told before the request is made — the
// server still validates independently.
const USERNAME_MIN = 3
const USERNAME_MAX = 30
const BIO_MAX = 160

const schema = z.object({
  username: z
    .string()
    .min(USERNAME_MIN, `Use at least ${USERNAME_MIN} characters`)
    .max(USERNAME_MAX, `Use at most ${USERNAME_MAX} characters`)
    .regex(/^[a-zA-Z0-9_.]+$/, "Use only letters, numbers, dots and underscores"),
  name: z.string().trim().min(1, "Display name is required"),
  bio: z.string().max(BIO_MAX, `Keep it under ${BIO_MAX} characters`),
  defaultMood: moodSchema.nullable(),
})

type FormValues = z.infer<typeof schema>

// What the server answers with, and the field to show it under.
const SERVER_ERRORS: Record<string, { field: keyof FormValues; message?: string }> = {
  USERNAME_IS_ALREADY_TAKEN: { field: "username", message: "That username is already taken" },
  USERNAME_TOO_SHORT: { field: "username", message: `Use at least ${USERNAME_MIN} characters` },
  USERNAME_TOO_LONG: { field: "username", message: `Use at most ${USERNAME_MAX} characters` },
  INVALID_USERNAME: {
    field: "username",
    message: "Use only letters, numbers, dots and underscores",
  },
  INVALID_NAME: { field: "name" },
  INVALID_BIO: { field: "bio" },
  INVALID_DEFAULT_MOOD: { field: "defaultMood" },
}

const toFormValues = (user: SessionUser): FormValues => ({
  username: user.username,
  name: user.name,
  bio: user.bio,
  defaultMood: user.defaultMood,
})

type SettingsFormProps = { user: SessionUser }

export function SettingsForm({ user }: SettingsFormProps) {
  const updateProfile = useUpdateProfile()
  const moodLabelId = useId()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(user),
  })

  const bio = useWatch({ control: form.control, name: "bio" })
  const { isDirty } = form.formState
  // The one message that has no field of its own.
  const formError =
    updateProfile.error instanceof ProfileUpdateError &&
    updateProfile.error.code &&
    updateProfile.error.code in SERVER_ERRORS
      ? null
      : (updateProfile.error?.message ?? null)

  const handleSubmit = (values: FormValues) => {
    const saved = toFormValues(user)
    const update: ProfileUpdate = {}
    if (values.username !== saved.username) update.username = values.username
    if (values.name !== saved.name) update.name = values.name
    if (values.bio !== saved.bio) update.bio = values.bio.trim() || null
    if (values.defaultMood !== saved.defaultMood) update.defaultMood = values.defaultMood

    if (Object.keys(update).length === 0) {
      toast.info("No changes to save")
      return
    }

    updateProfile.mutate(update, {
      onSuccess: (freshUser) => {
        // Start over from what the server stored (it lower-cases the username).
        if (freshUser) form.reset(toFormValues(freshUser))
        toast.success("Settings saved")
      },
      onError: (error) => {
        const known = error instanceof ProfileUpdateError && error.code && SERVER_ERRORS[error.code]
        // setError leaves what was typed in the field.
        if (known) {
          form.setError(
            known.field,
            { message: known.message ?? error.message },
            { shouldFocus: true },
          )
        }
      },
    })
  }

  const handleDiscard = () => {
    updateProfile.reset()
    form.reset(toFormValues(user))
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-8"
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <section
          aria-labelledby="settings-profile"
          className="flex flex-col gap-6"
        >
          <h2
            id="settings-profile"
            className="text-lg font-semibold tracking-tight"
          >
            Profile
          </h2>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={updateProfile.isPending}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {USERNAME_MIN}–{USERNAME_MAX} characters: letters, numbers, dots and underscores.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    disabled={updateProfile.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Bio <span className="font-normal text-muted-foreground">optional</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    disabled={updateProfile.isPending}
                    {...field}
                  />
                </FormControl>
                <div className="flex items-start justify-between gap-3">
                  <FormMessage />
                  <span
                    className={cn(
                      "ml-auto text-sm",
                      bio.length > BIO_MAX ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {bio.length}/{BIO_MAX}
                  </span>
                </div>
              </FormItem>
            )}
          />
        </section>

        <Separator />

        <section
          aria-labelledby="settings-quacks"
          className="flex flex-col gap-6"
        >
          <h2
            id="settings-quacks"
            className="text-lg font-semibold tracking-tight"
          >
            New quacks
          </h2>

          <FormField
            control={form.control}
            name="defaultMood"
            render={({ field }) => (
              <FormItem>
                <FormLabel id={moodLabelId}>Default mood</FormLabel>
                <FormControl>
                  <MoodPicker
                    aria-labelledby={moodLabelId}
                    value={field.value}
                    onChange={field.onChange}
                    isDisabled={updateProfile.isPending}
                    noneLabel="None"
                  />
                </FormControl>
                <FormDescription>Preselected when you write a new quack.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={updateProfile.isPending || !isDirty}
            onClick={handleDiscard}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
