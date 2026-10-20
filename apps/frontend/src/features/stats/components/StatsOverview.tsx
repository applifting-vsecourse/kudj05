import { useQuery } from "@tanstack/react-query"
import { Loader2, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { statsQueryOptions, type Stats } from "@/features/stats/api/statsQueryOptions"

const LABELS: Record<keyof Stats, string> = {
  users: "Users",
  quacks: "Quacks",
  polls: "Polls",
  votes: "Votes",
}

export function StatsOverview() {
  const statsQuery = useQuery(statsQueryOptions())

  if (statsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (statsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load stats.</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{statsQuery.error.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void statsQuery.refetch()}
          >
            <RefreshCw className="size-4" />
            Reload
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {(Object.keys(LABELS) as (keyof Stats)[]).map((key) => (
        <div
          key={key}
          className="flex flex-col gap-1 border-l border-border pl-4"
        >
          <dt className="text-sm text-muted-foreground">{LABELS[key]}</dt>
          <dd className="text-2xl font-semibold tracking-tight tabular-nums">
            {statsQuery.data[key]}
          </dd>
        </div>
      ))}
    </dl>
  )
}
