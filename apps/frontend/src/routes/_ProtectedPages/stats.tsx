import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { StatsOverview } from "@/features/stats/components/StatsOverview"

export const Route = createFileRoute("/_ProtectedPages/stats")({
  component: StatsPage,
})

function StatsPage() {
  const { user } = useSession()

  return (
    <>
      <Seo title="Stats" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Stats</h1>

        {/* Only spares a request that would fail; the API answers 403 to everyone but an admin. */}
        {user?.role === "admin" ? (
          <StatsOverview />
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have access to this page.</p>
        )}
      </section>
    </>
  )
}
