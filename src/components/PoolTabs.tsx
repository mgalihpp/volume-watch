import { POOLS, POOL_ADDRESSES, fmtPrice, usd } from '@/lib/meteora'
import { cn } from '@/lib/utils'
import type { PoolRow } from '@/hooks/usePoolMonitor'

interface Props {
  rows: Record<string, PoolRow>
  picked: string
  onPick: (addr: string) => void
}

export function PoolTabs({ rows, picked, onPick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="Pool">
      {POOL_ADDRESSES.map((addr) => {
        const r = rows[addr]
        const on = picked === addr
        return (
          <button
            key={addr}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onPick(addr)}
            className={cn(
              'flex flex-col gap-2.5 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              on ? 'border-[1.5px] border-foreground bg-card' : 'border-border hover:bg-card/60',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="font-medium">{POOLS[addr]}</span>
              {r?.isSpike && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber px-2 py-0.5 text-[11px] font-medium text-amber-900">
                  <span className="size-[5px] rounded-full bg-amber-strong" />
                  Lonjakan
                </span>
              )}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-[22px] leading-none font-semibold tabular-nums">{r ? fmtPrice(r.price) : '-'}</span>
              <span className={cn('text-[13px] font-medium tabular-nums', r && r.chg > 0.005 ? 'text-up' : r && r.chg < -0.005 ? 'text-down' : 'text-muted-foreground')}>
                {r ? `${r.chg > 0.005 ? '+' : ''}${r.chg.toFixed(2)}%` : ''}
              </span>
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{r?.vol1m == null ? '-' : usd(r.vol1m)} / menit</span>
          </button>
        )
      })}
    </div>
  )
}
