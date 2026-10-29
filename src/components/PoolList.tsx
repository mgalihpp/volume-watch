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

/** Sidebar desktop: baris datar dipisah garis, yang dipilih ditandai bar di tepi kiri. */
export function PoolList({ pools, rows, rule, picked, onPick }: Props & { rule: Rule }) {
  return (
    <div role="tablist" aria-label="Pool" className="flex flex-col">
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
              'relative flex min-w-0 flex-col gap-2.5 border-b px-4 py-3.5 text-left outline-none transition-colors focus-visible:bg-muted',
              on ? 'bg-up/[0.06]' : 'hover:bg-muted/60',
            )}
          >
            {on && <span className="absolute inset-y-0 left-0 w-[3px] bg-up" />}
            <span className="flex items-center gap-2.5">
              <TokenPair x={pool.x} y={pool.y} />
              <span className="truncate text-sm font-bold">{pair}</span>
              <span className="text-[11px] font-medium text-muted-foreground">{bin}</span>
              {r?.isSpike && <span className="ml-auto size-2 shrink-0 animate-pulse rounded-full bg-amber-strong" aria-label="Sedang lonjakan" />}
            </span>
            <span className="flex items-baseline justify-between gap-2 tabular-nums">
              <span className="text-[15px] font-semibold">{r ? <Price value={r.price} /> : '–'}</span>
              <span className="truncate text-xs text-muted-foreground">{r?.vol1m == null ? 'menghitung…' : `${usdShort(r.vol1m)}/mnt`}</span>
            </span>
            <Meter value={spikeProgress(r, rule)} hot={r?.isSpike} />
          </button>
        )
      })}
    </div>
  )
}

/** Layar kecil: tab teks dengan garis bawah, bisa digeser. */
export function PoolTabs({ pools, rows, picked, onPick }: Props) {
  return (
    <div role="tablist" aria-label="Pool" className="flex w-max min-w-full">
      {Object.entries(pools).map(([addr, pool]) => {
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
              'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-[13px] whitespace-nowrap outline-none focus-visible:bg-muted',
              on ? 'border-up font-bold text-foreground' : 'border-transparent font-medium text-muted-foreground',
            )}
          >
            {pair}
            <span className="text-[11px] font-normal text-muted-foreground">{bin.replace('bin ', '')}</span>
            {rows[addr]?.isSpike && <span className="size-1.5 rounded-full bg-amber-strong" aria-label="Sedang lonjakan" />}
          </button>
        )
      })}
    </div>
  )
}
