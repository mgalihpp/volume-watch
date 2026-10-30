import { Price } from '@/components/Price'
import { Meter } from '@/components/SpikeMeter'
import { TokenPair } from '@/components/TokenPair'
import { usePoolDetail } from '@/hooks/usePoolDetail'
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
  const detail = usePoolDetail(addr)
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
    <div className="flex flex-col border-b lg:flex-row lg:items-center lg:gap-8 lg:px-6 lg:py-4">
      <div className="flex min-w-0 flex-col gap-1.5 px-4 pt-4 pb-3.5 lg:gap-2 lg:p-0">
        <span className="flex min-w-0 items-center gap-2.5">
          <TokenPair x={pool.x} y={pool.y} size="lg" />
          <span className="truncate text-base font-bold lg:text-xl">{pair}</span>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">{bin}</span>
          {row?.isSpike && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-[4px] bg-amber-strong/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-strong uppercase lg:text-[10px]">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-strong" />
              Lonjakan
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
          <span className="text-[34px] leading-none font-bold tracking-tighter lg:text-[32px]">{price ? <Price value={price} /> : '–'}</span>
          {chg != null && (
            <span className={cn('text-[13px] font-semibold whitespace-nowrap', chg >= 0 ? 'text-up' : 'text-down')}>
              {chg >= 0 ? '+' : ''}
              {chg.toFixed(2)}%<span className="ml-1.5 font-normal text-muted-foreground">{spanLabel(Math.min(span, 86400))}</span>
            </span>
          )}
        </span>
      </div>

      <dl className="grid grid-cols-3 divide-x border-t lg:flex lg:divide-x-0 lg:border-t-0">
        <Stat label="Volume 1m" value={vol1m == null ? '–' : usdShort(vol1m)} goal={`batas ${usdShort(rule.minUsd)}`} progress={vol1m == null ? null : vol1m / rule.minUsd} hot={row?.isSpike} />
        <Stat
          label="Vs normal"
          value={ratio == null ? '–' : Number.isFinite(ratio) ? `${ratio.toFixed(1)}×` : 'dari nol'}
          goal={`batas ${rule.mult}×`}
          progress={ratio == null ? null : ratio / rule.mult}
          hot={row?.isSpike}
        />
        <Stat label="TVL" value={row ? usdShort(row.tvl) : detail ? usdShort(detail.tvl) : '–'} />
      </dl>

      <dl className="grid grid-cols-3 divide-x border-t lg:basis-full lg:grid-cols-6 lg:divide-x-0 lg:border-t">
        <Info label="Bin step" value={detail ? `${detail.binStep}` : '–'} />
        <Info label="Fee dasar" value={detail ? `${detail.baseFee}%` : '–'} sub={detail ? `dinamis ${+detail.dynamicFee.toFixed(4)}%` : undefined} />
        <Info label="Volume 24j" value={detail ? usdShort(detail.vol24) : '–'} />
        <Info label="Fee 24j" value={detail ? usdShort(detail.fees24) : '–'} sub={detail ? `${detail.feeTvl24.toFixed(2)}% dari TVL` : undefined} />
        <Info label="APR" value={detail ? `${Math.round(detail.apr * 365)}%` : '–'} sub="fee 24j × 365" />
        <Info
          label="Isi pool"
          value={detail ? `${compact(detail.x.amount)} ${detail.x.symbol}` : '–'}
          sub={detail ? `${compact(detail.y.amount)} ${detail.y.symbol}` : undefined}
        />
      </dl>

      <dl className="grid grid-cols-3 divide-x border-t lg:basis-full lg:grid-cols-6 lg:divide-x-0">
        {(detail?.windows ?? ['30m', '1h', '2h', '4h', '12h', '24h'].map((label) => ({ label, volume: NaN, fees: NaN }))).map((w) => (
          <Info key={w.label} label={`Volume ${w.label}`} value={Number.isNaN(w.volume) ? '–' : usdShort(w.volume)} sub={Number.isNaN(w.fees) ? undefined : `fee ${usdShort(w.fees)}`} />
        ))}
      </dl>
    </div>
  )
}

const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n)

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-2.5 lg:px-6 lg:first:pl-6">
      <dt className="truncate text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase lg:text-[10px]">{label}</dt>
      <dd className="truncate text-[15px] leading-none font-bold tabular-nums lg:text-base">{value}</dd>
      {sub && <span className="truncate text-[10px] text-muted-foreground tabular-nums">{sub}</span>}
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  goal?: string
  progress?: number | null
  hot?: boolean
}

function Stat({ label, value, goal, progress, hot }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-4 py-3 lg:w-[150px] lg:border-l lg:px-6 lg:py-0">
      <dt className="truncate text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase lg:text-[10px]">{label}</dt>
      <dd className={cn('truncate text-[17px] leading-none font-bold tabular-nums lg:text-xl', hot && 'text-amber-strong')}>{value}</dd>
      {goal && (
        <div className="hidden flex-col gap-1 lg:flex">
          <Meter value={progress == null ? null : Math.min(progress, 1)} hot={hot} className="bg-foreground/10" />
          <span className="text-[11px] text-muted-foreground tabular-nums">{goal}</span>
        </div>
      )}
    </div>
  )
}
