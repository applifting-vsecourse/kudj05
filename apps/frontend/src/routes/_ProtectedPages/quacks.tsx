import { useRef } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { QuackFeed } from "@/features/quack/components/QuackFeed"
import { QuackForm } from "@/features/quack/components/QuackForm"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  component: QuacksPage,
})

function QuacksPage() {
  const { user } = useSession()
  const formRef = useRef<HTMLDivElement>(null)

  const focusForm = () => formRef.current?.querySelector("textarea")?.focus()

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <div ref={formRef}>
          <QuackForm
            className="mb-8"
            defaultMood={user?.defaultMood}
          />
        </div>

        <QuackFeed
          currentUserId={user?.id}
          canDeleteAny={user?.role === "admin" || user?.role === "moderator"}
          onWriteFirst={focusForm}
        />
      </section>
    </>
  )
}
