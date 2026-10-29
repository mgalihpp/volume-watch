import { useCallback, useMemo, useState } from 'react'
import { PlusIcon, SlidersHorizontalIcon } from 'lucide-react'
import { AlertMenu } from '@/components/AlertMenu'
import { AlertsPage } from '@/components/AlertsPage'
import { ManagePools } from '@/components/ManagePools'
import { PoolHeader } from '@/components/PoolHeader'
import { PoolChips, PoolList } from '@/components/PoolList'
import { PriceChart, type ChartType } from '@/components/PriceChart'
import { RuleSheet } from '@/components/RuleSheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useBotData } from '@/hooks/useBotData'
import { useCandles } from '@/hooks/useCandles'
import { useDark } from '@/hooks/useDark'
import { useHash } from '@/hooks/useHash'
import { usePoolMonitor } from '@/hooks/usePoolMonitor'
import { useStored } from '@/hooks/useStored'
import { DEFAULT_POOLS, DEFAULT_RULE, POOL_ADDRESSES, TIMEFRAMES, spikeFlags, type Rule, type Timeframe } from '@/lib/meteora'

const DEFAULT_CHART = { addr: POOL_ADDRESSES[2], tf: '1h' as Timeframe, type: 'candle' as ChartType }

export default function App() {
  const { dark, setMode } = useDark()
  const hash = useHash()
  const [localRule, setRule] = useStored<Rule>('rule', DEFAULT_RULE)
  const { bot, reload: reloadBot } = useBotData()
  const rule = bot?.rule ?? localRule // di VPS aturan mengikuti bot Telegram
  const [saved, setChart] = useStored('chart', DEFAULT_CHART)
  // 1m hanya ada kalau bot VPS mencatat candle-nya
  const timeframes = bot ? TIMEFRAMES : TIMEFRAMES.filter((t) => t !== '1m')
  const pools = bot?.pools ?? DEFAULT_POOLS
  const [manageOpen, setManageOpen] = useState(false)
  const onManage = bot ? () => setManageOpen(true) : undefined
  const chart = {
    addr: saved.addr in pools ? saved.addr : saved.addr in DEFAULT_POOLS && !bot ? saved.addr : Object.keys(pools)[0],
    tf: timeframes.includes(saved.tf) ? saved.tf : DEFAULT_CHART.tf,
    type: saved.type === 'line' ? 'line' : 'candle',
  } as const
  const { rows: localRows, alerts } = usePoolMonitor(rule)
  const rows = bot && Object.keys(bot.rows).length ? bot.rows : localRows
  const allAlerts = bot ? bot.alerts : alerts
  const onAlerts = hash === '#/alerts'
  const { candles, error, loadOlder, loadingOlder } = useCandles(chart.addr, chart.tf)
  const flags = useMemo(() => spikeFlags(candles, chart.tf, rule), [candles, chart.tf, rule])
  const oldest = candles[0]?.timestamp
  const needOlder = useCallback(() => loadOlder(oldest), [loadOlder, oldest])
  const pick = (addr: string) => setChart({ addr })

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 py-5 md:gap-7 md:px-8 md:py-7">
      <header className="flex items-center justify-between gap-3">
        <a href="#/" className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/40" aria-label="Volume Watch, ke dashboard">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="size-9" />
          <h1 className="text-lg font-bold tracking-tight">Volume Watch</h1>
          <span className="hidden rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase lg:inline">Solana · Meteora DLMM</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} setMode={setMode} />
          <AlertMenu alerts={allAlerts} />
          <RuleSheet rule={rule} onSave={setRule} bot={bot ? { onSaved: reloadBot } : undefined} />
        </div>
      </header>

      {onAlerts ? (
        <AlertsPage alerts={allAlerts} botUpdated={bot?.updated} />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
            <PoolChips pools={pools} rows={rows} picked={chart.addr} onPick={pick} />
            {onManage && (
              <Button variant="outline" onClick={onManage} className="h-9 shrink-0 rounded-full px-3.5" aria-label="Kelola pool">
                <PlusIcon />
                Pool
              </Button>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
            <aside className="hidden min-w-0 flex-col gap-3 md:flex lg:sticky lg:top-7 lg:self-start">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Pools</span>
                {onManage && (
                  <button type="button" onClick={onManage} className="flex items-center gap-1 text-xs font-semibold text-up hover:underline">
                    <SlidersHorizontalIcon className="size-3" />
                    Kelola
                  </button>
                )}
              </div>
              <PoolList pools={pools} rows={rows} rule={rule} picked={chart.addr} onPick={pick} />
            </aside>

            <main className="flex min-w-0 flex-col gap-5">
              <PoolHeader addr={chart.addr} pools={pools} rows={rows} rule={rule} candles={candles} tf={chart.tf} />
              <section className="rounded-3xl border bg-card p-4 sm:p-6">
                <PriceChart {...chart} name={pools[chart.addr].name} timeframes={timeframes} candles={candles} flags={flags} error={error} dark={dark} loadingOlder={loadingOlder} onNeedOlder={needOlder} onChange={setChart} />
              </section>
            </main>
          </div>
        </>
      )}

      {bot && <ManagePools open={manageOpen} onOpenChange={setManageOpen} pools={pools} onChanged={reloadBot} />}
    </div>
  )
}
