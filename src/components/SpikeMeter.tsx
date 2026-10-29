import type { PoolRow } from '@/hooks/usePoolMonitor'
import type { Rule } from '@/lib/meteora'
import { cn } from '@/lib/utils'

/** Seberapa dekat pool ke alert: 1 berarti kedua batas (kelipatan dan minimal USD) terlewati. */
export function spikeProgress(row: PoolRow | undefined, rule: Rule) {
  if (row?.vol1m == null) return null
  const byRatio = row.ratio == null ? 0 : Number.isFinite(row.ratio) ? row.ratio / rule.mult : 1
  return Math.min(byRatio, row.vol1m / rule.minUsd, 1)
}

export function Meter({ value, hot, className }: { value: number | null; hot?: boolean; className?: string }) {
  return (
    <div className={cn('relative h-1.5 overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('absolute inset-y-0 left-0 rounded-full transition-[width] duration-700', hot ? 'bg-amber-strong' : 'bg-foreground/70')}
        style={{ width: `${Math.max((value ?? 0) * 100, value ? 3 : 0)}%` }}
      />
    </div>
  )
}
