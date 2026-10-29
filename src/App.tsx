import { useCallback, useMemo } from 'react'
import { AlertMenu } from '@/components/AlertMenu'
import { PoolHeader } from '@/components/PoolHeader'
import { PoolList } from '@/components/PoolList'
import { PriceChart, type ChartType } from '@/components/PriceChart'
import { RuleSheet } from '@/components/RuleSheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useBotData } from '@/hooks/useBotData'
import { useCandles } from '@/hooks/useCandles'
import { useDark } from '@/hooks/useDark'
import { usePoolMonitor } from '@/hooks/usePoolMonitor'
import { useStored } from '@/hooks/useStored'
import { DEFAULT_RULE, POOL_ADDRESSES, POOLS, TF_SEC, spikeFlags, type Rule, type Timeframe } from '@/lib/meteora'
import { cn } from '@/lib/utils'

const DEFAULT_CHART = { addr: POOL_ADDRESSES[2], tf: '1h' as Timeframe, type: 'candle' as ChartType }

export default function App() {
  const { dark, setMode } = useDark()
  const [localRule, setRule] = useStored<Rule>('rule', DEFAULT_RULE)
  const { bot, reload: reloadBot } = useBotData()
  const rule = bot?.rule ?? localRule // di VPS aturan mengikuti bot Telegram
  const [saved, setChart] = useStored('chart', DEFAULT_CHART)
  const chart = {
    addr: saved.addr in POOLS ? saved.addr : DEFAULT_CHART.addr,
    tf: saved.tf in TF_SEC ? saved.tf : DEFAULT_CHART.tf,
    type: saved.type === 'line' ? 'line' : 'candle',
  } as const
  const { rows: localRows, status, alerts } = usePoolMonitor(rule)
  const rows = bot && Object.keys(bot.rows).length ? bot.rows : localRows
  const { candles, error, loadOlder, loadingOlder } = useCandles(chart.addr, chart.tf)
  const flags = useMemo(() => spikeFlags(candles, chart.tf, rule), [candles, chart.tf, rule])
  const oldest = candles[0]?.timestamp
  const needOlder = useCallback(() => loadOlder(oldest), [loadOlder, oldest])
  const pick = (addr: string) => setChart({ addr })

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-5 md:px-8 md:py-7">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Logo />
          <h1 className="text-[15px] font-semibold tracking-tight">Volume Watch</h1>
        </div>
        <div className="flex items-center gap-2">
          <span title={status.text} className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <span className={cn('relative flex size-2', status.ok ? 'text-up' : 'text-down')}>
              {status.ok && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-40" />}
              <span className="relative size-2 rounded-full bg-current" />
            </span>
            <span className="hidden md:inline">
              {status.ok ? `Live, cek tiap ${rule.interval} detik` : status.text.startsWith('Memuat') ? 'Menghubungkan…' : 'Terputus'}
            </span>
          </span>
          <ThemeToggle dark={dark} setMode={setMode} />
          <AlertMenu alerts={bot ? bot.alerts : alerts} botUpdated={bot?.updated} />
          <RuleSheet rule={rule} onSave={setRule} bot={bot ? { onSaved: reloadBot } : undefined} />
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden min-w-0 md:block lg:sticky lg:top-7 lg:self-start">
          <PoolList rows={rows} rule={rule} picked={chart.addr} onPick={pick} />
        </aside>

        <main className="flex min-w-0 flex-col gap-6 rounded-2xl border bg-card p-4 sm:p-5 md:p-7">
          <PoolHeader addr={chart.addr} rows={rows} rule={rule} candles={candles} tf={chart.tf} onPick={pick} />
          <PriceChart {...chart} candles={candles} flags={flags} error={error} dark={dark} loadingOlder={loadingOlder} onNeedOlder={needOlder} onChange={setChart} />
        </main>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="7" className="fill-foreground" />
      <path d="M6 15h2v3H6zM10 11h2v7h-2zM14 6h2v12h-2z" className="fill-background" />
      <path d="M18 9h1.5v9H18z" className="fill-amber-strong" />
    </svg>
  )
}
