import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { Textarea } from "@/components/ui/textarea"

import { useAddReply } from "@/features/quack/hooks/useAddReply"

// Same limit as a quack, and as the server's CreateReplyDto.
const MAX_LENGTH = 280

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
})

type FormValues = z.infer<typeof schema>

export function ReplyForm({ quackId }: { quackId: string }) {
  const addReply = useAddReply(quackId)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: "" },
  })

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) =>
          addReply.mutate(values.text, { onSuccess: () => form.reset({ text: "" }) }),
        )}
        className="flex flex-col gap-2"
      >
        {addReply.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addReply.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your reply</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Quack back..."
                  disabled={addReply.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="self-end"
          disabled={addReply.isPending}
        >
          {addReply.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Reply
        </Button>
      </form>
    </Form>
  )
}
