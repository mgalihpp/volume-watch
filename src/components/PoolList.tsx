import { Price } from '@/components/Price'
import { Meter, spikeProgress } from '@/components/SpikeMeter'
import { TokenPair } from '@/components/TokenPair'
import type { PoolRow } from '@/hooks/usePoolMonitor'
import { splitName, usdShort, type PoolInfo, type Rule } from '@/lib/meteora'
import { cn } from '@/lib/utils'

interface Props {
  pools: Record<string, PoolInfo>
  rows: Record<string, PoolRow>
  rule: Rule
  picked: string
  onPick: (addr: string) => void
  /** Satu baris per pool, dipakai di bottom sheet mobile */
  dense?: boolean
}

export function PoolList({ pools, rows, rule, picked, onPick, dense }: Props) {
  if (dense) return <DenseList pools={pools} rows={rows} rule={rule} picked={picked} onPick={onPick} />
  return (
    <div role="tablist" aria-label="Pool" className="flex flex-col gap-2 md:grid md:grid-cols-4 lg:flex lg:flex-col">
      {Object.entries(pools).map(([addr, pool]) => {
        const r = rows[addr]
        const on = picked === addr
        const { pair, bin } = splitName(pool.name)
        return (
          <button
            key={addr}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onPick(addr)}
            className={cn(
              'flex min-w-0 flex-col gap-2.5 rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 sm:px-4 sm:py-3.5',
              on ? 'border-foreground/15 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'border-border/60 hover:bg-card/70 lg:border-transparent',
            )}
          >
            <span className="flex items-center gap-2">
              <TokenPair x={pool.x} y={pool.y} />
              <span className="truncate font-semibold">{pair}</span>
              {r?.isSpike && <span className="ml-auto size-2 shrink-0 animate-pulse rounded-full bg-amber-strong" aria-label="Sedang lonjakan" />}
            </span>
            <span className="text-[15px] font-medium tabular-nums">{r ? <Price value={r.price} /> : '–'}</span>
            <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
              <span className="rounded-md bg-muted px-1.5 py-px text-[11px] font-medium">{bin}</span>
              <span className="truncate">{r?.vol1m == null ? 'menghitung…' : `${usdShort(r.vol1m)}/mnt`}</span>
            </span>
            <Meter value={spikeProgress(r, rule)} hot={r?.isSpike} />
          </button>
        )
      })}
    </div>
  )
}

function DenseList({ pools, rows, rule, picked, onPick }: Omit<Props, 'dense'>) {
  return (
    <div role="listbox" aria-label="Pool" className="flex flex-col">
      {Object.entries(pools).map(([addr, pool]) => {
        const r = rows[addr]
        const on = picked === addr
        const { pair, bin } = splitName(pool.name)
        return (
          <button
            key={addr}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onPick(addr)}
            className={cn('flex flex-col gap-2.5 rounded-xl px-3 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40', on ? 'bg-muted' : 'active:bg-muted/60')}
          >
            <span className="flex items-center gap-3">
              <TokenPair x={pool.x} y={pool.y} size="lg" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  <span className="truncate">{pair}</span>
                  <span className="shrink-0 rounded-md bg-background px-1.5 py-px text-[11px] font-medium text-muted-foreground">{bin}</span>
                  {r?.isSpike && <span className="size-2 shrink-0 animate-pulse rounded-full bg-amber-strong" aria-label="Sedang lonjakan" />}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{r?.vol1m == null ? 'menghitung volume…' : `${usdShort(r.vol1m)} per menit`}</span>
              </span>
              <span className="shrink-0 text-[15px] font-medium tabular-nums">{r ? <Price value={r.price} /> : '–'}</span>
            </span>
            <Meter value={spikeProgress(r, rule)} hot={r?.isSpike} className="ml-11" />
          </button>
        )
      })}
    </div>
  )
}
