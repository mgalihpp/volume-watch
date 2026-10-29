import { poolName } from '@/components/PoolList'
import { PoolSheet } from '@/components/PoolSheet'
import { Price } from '@/components/Price'
import { Meter } from '@/components/SpikeMeter'
import { TokenPair } from '@/components/TokenPair'
import type { PoolRow } from '@/hooks/usePoolMonitor'
import { TF_SEC, usdShort, type Candle, type Rule, type Timeframe } from '@/lib/meteora'
import { cn } from '@/lib/utils'

function spanLabel(sec: number) {
  const h = sec / 3600
  return h < 48 ? `${+h.toFixed(1)} jam` : `${Math.round(h / 24)} hari`
}

interface Props {
  addr: string
  rows: Record<string, PoolRow>
  rule: Rule
  candles: Candle[]
  tf: Timeframe
  onPick: (addr: string) => void
}

export function PoolHeader({ addr, rows, rule, candles, tf, onPick }: Props) {
  const row = rows[addr]
  const { pair, bin } = poolName(addr)
  const since = Date.now() / 1000 - 86400
  const first = candles.find((c) => c.timestamp + TF_SEC[tf] > since)
  const span = first ? Date.now() / 1000 - first.timestamp : 0
  const price = row?.price ?? candles[candles.length - 1]?.close
  const chg = first && price ? (price / first.open - 1) * 100 : null
  const ratio = row?.ratio == null ? null : Number.isFinite(row.ratio) ? row.ratio : Infinity
  const vol1m = row?.vol1m ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="flex">
          <PoolSheet rows={rows} rule={rule} picked={addr} onPick={onPick}>
            <TokenPair pair={pair} size="lg" />
            <span className="font-semibold text-foreground">{pair}</span>
            <span className="rounded-md bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">{bin}</span>
          </PoolSheet>
        </span>
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
          <span className="text-4xl leading-none font-semibold tracking-tight md:text-[44px]">{price ? <Price value={price} /> : '–'}</span>
          {chg != null && (
            <span className={cn('text-sm font-medium whitespace-nowrap', chg >= 0 ? 'text-up' : 'text-down')}>
              {chg >= 0 ? '+' : ''}
              {chg.toFixed(2)}%<span className="ml-1.5 font-normal text-muted-foreground">{spanLabel(Math.min(span, 86400))}</span>
            </span>
          )}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-5 gap-y-5 rounded-xl bg-muted/50 p-4 md:grid-cols-3 md:gap-x-10 md:px-5">
        <Stat label="Volume 1 menit" value={vol1m == null ? '–' : usdShort(vol1m)} goal={`batas ${usdShort(rule.minUsd)}`} progress={vol1m == null ? null : vol1m / rule.minUsd} hot={row?.isSpike} />
        <Stat
          label="Dibanding normal"
          value={ratio == null ? '–' : Number.isFinite(ratio) ? `${ratio.toFixed(1)}×` : 'baru aktif'}
          goal={`batas ${rule.mult}×`}
          progress={ratio == null ? null : ratio / rule.mult}
          hot={row?.isSpike}
        />
        <Stat label="TVL" value={row ? usdShort(row.tvl) : '–'} className="hidden md:flex" />
      </dl>
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  goal?: string
  progress?: number | null
  hot?: boolean
  className?: string
}

function Stat({ label, value, goal, progress, hot, className }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-lg leading-none font-semibold tabular-nums">{value}</dd>
      {goal && (
        <>
          <Meter value={progress == null ? null : Math.min(progress, 1)} hot={hot} className="mt-1 bg-foreground/10" />
          <span className="text-[11px] text-muted-foreground tabular-nums">{goal}</span>
        </>
      )}
    </div>
  )
}
