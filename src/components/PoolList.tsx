import { Price } from '@/components/Price'
import { Meter, spikeProgress } from '@/components/SpikeMeter'
import { TokenPair } from '@/components/TokenPair'
import type { PoolRow } from '@/hooks/usePoolMonitor'
import { splitName, usdShort, type PoolInfo, type Rule } from '@/lib/meteora'
import { cn } from '@/lib/utils'

interface Props {
  pools: Record<string, PoolInfo>
  rows: Record<string, PoolRow>
  picked: string
  onPick: (addr: string) => void
}

export function PoolList({ pools, rows, rule, picked, onPick }: Props & { rule: Rule }) {
  return (
    <div role="tablist" aria-label="Pool" className="flex flex-col gap-3">
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
              'flex min-w-0 flex-col gap-3 rounded-[20px] border p-4 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
              on ? 'border-up/50 bg-up/[0.06]' : 'bg-card hover:border-foreground/20',
            )}
          >
            <span className="flex items-center gap-2.5">
              <TokenPair x={pool.x} y={pool.y} />
              <span className="truncate font-bold">{pair}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{bin}</span>
              {r?.isSpike && <span className="ml-auto size-2 shrink-0 animate-pulse rounded-full bg-amber-strong" aria-label="Sedang lonjakan" />}
            </span>
            <span className="flex items-baseline justify-between gap-2 tabular-nums">
              <span className="text-[17px] font-semibold">{r ? <Price value={r.price} /> : '–'}</span>
              <span className="truncate text-xs text-muted-foreground">{r?.vol1m == null ? 'menghitung…' : `${usdShort(r.vol1m)}/mnt`}</span>
            </span>
            <Meter value={spikeProgress(r, rule)} hot={r?.isSpike} />
          </button>
        )
      })}
    </div>
  )
}

/** Versi layar kecil: chip horizontal yang bisa digeser. */
export function PoolChips({ pools, rows, picked, onPick }: Props) {
  return (
    <div role="tablist" aria-label="Pool" className="flex gap-2">
      {Object.entries(pools).map(([addr, pool]) => {
        const on = picked === addr
        return (
          <button
            key={addr}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onPick(addr)}
            className={cn('flex h-9 shrink-0 items-center gap-2 rounded-full border pr-3.5 pl-2 text-[13px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40', on ? 'border-up/50 bg-up/10' : 'bg-card')}
          >
            <TokenPair x={pool.x} y={pool.y} />
            {splitName(pool.name).pair}
            {rows[addr]?.isSpike && <span className="size-1.5 rounded-full bg-amber-strong" aria-label="Sedang lonjakan" />}
          </button>
        )
      })}
    </div>
  )
}
