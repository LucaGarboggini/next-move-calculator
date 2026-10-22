import { Card, CardContent, Skeleton } from '@/ui'

/** Placeholder for a panel whose code is still loading; keeps the layout from jumping. */
export function PanelFallback() {
  return (
    <Card aria-busy="true">
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  )
}
