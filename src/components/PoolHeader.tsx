import { Price } from '@/components/Price'
import { Meter } from '@/components/SpikeMeter'
import { TokenPair } from '@/components/TokenPair'
import type { PoolRow } from '@/hooks/usePoolMonitor'
import { TF_SEC, splitName, usdShort, type Candle, type PoolInfo, type Rule, type Timeframe } from '@/lib/meteora'
import { cn } from '@/lib/utils'

function spanLabel(sec: number) {
  const h = sec / 3600
  return h < 48 ? `${+h.toFixed(1)} jam` : `${Math.round(h / 24)} hari`
}

interface Props {
  addr: string
  pools: Record<string, PoolInfo>
  rows: Record<string, PoolRow>
  rule: Rule
  candles: Candle[]
  tf: Timeframe
}

export function PoolHeader({ addr, pools, rows, rule, candles, tf }: Props) {
  const row = rows[addr]
  const pool = pools[addr]
  const { pair, bin } = splitName(pool.name)
  const since = Date.now() / 1000 - 86400
  const first = candles.find((c) => c.timestamp + TF_SEC[tf] > since)
  const span = first ? Date.now() / 1000 - first.timestamp : 0
  const price = row?.price ?? candles[candles.length - 1]?.close
  const chg = first && price ? (price / first.open - 1) * 100 : null
  const ratio = row?.ratio == null ? null : Number.isFinite(row.ratio) ? row.ratio : Infinity
  const vol1m = row?.vol1m ?? null

  return (
    <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:gap-5 sm:p-7">
      <div className="flex flex-col gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <TokenPair x={pool.x} y={pool.y} size="lg" />
          <span className="truncate text-xl font-bold sm:text-[26px]">{pair}</span>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{bin}</span>
          {row?.isSpike && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-strong/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-strong uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-strong" />
              Lonjakan
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2 tabular-nums">
          <span className="text-4xl leading-none font-bold tracking-tighter sm:text-[52px]">{price ? <Price value={price} /> : '–'}</span>
          {chg != null && (
            <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap', chg >= 0 ? 'bg-up/10 text-up' : 'bg-down/10 text-down')}>
              {chg >= 0 ? '+' : ''}
              {chg.toFixed(2)}%<span className="font-normal opacity-70">{spanLabel(Math.min(span, 86400))}</span>
            </span>
          )}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Stat label="Volume 1 menit" value={vol1m == null ? '–' : usdShort(vol1m)} goal={`batas ${usdShort(rule.minUsd)}`} progress={vol1m == null ? null : vol1m / rule.minUsd} hot={row?.isSpike} />
        <Stat
          label="Dibanding normal"
          value={ratio == null ? '–' : Number.isFinite(ratio) ? `${ratio.toFixed(1)}×` : 'dari nol'}
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
    <div className={cn('flex min-w-0 flex-col gap-2.5 rounded-2xl bg-muted p-3.5 sm:p-[18px]', className)}>
      <dt className="truncate text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{label}</dt>
      <dd className={cn('truncate text-xl leading-none font-bold tabular-nums sm:text-2xl', hot && 'text-amber-strong')}>{value}</dd>
      {goal && (
        <>
          <Meter value={progress == null ? null : Math.min(progress, 1)} hot={hot} className="bg-foreground/10" />
          <span className="text-[11px] text-muted-foreground tabular-nums">{goal}</span>
        </>
      )}
    </div>
  )
}
