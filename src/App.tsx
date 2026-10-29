import { useCallback, useMemo, useState } from 'react'
import { PlusIcon, SlidersHorizontalIcon } from 'lucide-react'
import { AlertMenu } from '@/components/AlertMenu'
import { AlertsPage } from '@/components/AlertsPage'
import { ManagePools } from '@/components/ManagePools'
import { PoolHeader } from '@/components/PoolHeader'
import { PoolList, PoolTabs } from '@/components/PoolList'
import { PriceChart, type ChartType } from '@/components/PriceChart'
import { RecentAlerts } from '@/components/RecentAlerts'
import { RuleSheet } from '@/components/RuleSheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useBotData } from '@/hooks/useBotData'
import { useCandles } from '@/hooks/useCandles'
import { useDark } from '@/hooks/useDark'
import { useHash } from '@/hooks/useHash'
import { usePoolMonitor } from '@/hooks/usePoolMonitor'
import { useStored } from '@/hooks/useStored'
import { DEFAULT_POOLS, DEFAULT_RULE, POOL_ADDRESSES, TIMEFRAMES, spikeFlags, type Rule, type Timeframe } from '@/lib/meteora'
import { cn } from '@/lib/utils'

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
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex items-center gap-7">
          <a href="#/" className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/40" aria-label="Volume Watch, ke dashboard">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="size-7" />
            <h1 className="text-[15px] font-bold tracking-tight">Volume Watch</h1>
          </a>
          <nav className="hidden items-center gap-5 text-[13px] sm:flex">
            <a href="#/" className={cn('font-semibold', onAlerts ? 'text-muted-foreground hover:text-foreground' : 'text-foreground')}>
              Dashboard
            </a>
            <a href="#/alerts" className={cn('font-semibold', onAlerts ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              Alert
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle dark={dark} setMode={setMode} />
          <AlertMenu alerts={allAlerts} />
          <RuleSheet rule={rule} onSave={setRule} bot={bot ? { onSaved: reloadBot } : undefined} />
        </div>
      </header>

      {onAlerts ? (
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <AlertsPage alerts={allAlerts} botUpdated={bot?.updated} />
        </main>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex shrink-0 items-stretch border-b lg:hidden">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <PoolTabs pools={pools} rows={rows} picked={chart.addr} onPick={pick} />
            </div>
            {onManage && (
              <button type="button" onClick={onManage} aria-label="Kelola pool" className="flex shrink-0 items-center gap-1 border-l px-3.5 text-[13px] font-semibold text-up">
                <PlusIcon className="size-3.5" />
                Pool
              </button>
            )}
          </div>

          <aside className="hidden w-[280px] shrink-0 flex-col overflow-y-auto border-r lg:flex">
            <div className="flex items-center justify-between border-b px-4 py-3.5">
              <span className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Pools</span>
              {onManage && (
                <button type="button" onClick={onManage} className="flex items-center gap-1 text-xs font-semibold text-up hover:underline">
                  <SlidersHorizontalIcon className="size-3" />
                  Kelola
                </button>
              )}
            </div>
            <PoolList pools={pools} rows={rows} rule={rule} picked={chart.addr} onPick={pick} />
          </aside>

          <main className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">
            <PoolHeader addr={chart.addr} pools={pools} rows={rows} rule={rule} candles={candles} tf={chart.tf} />
            <PriceChart {...chart} name={pools[chart.addr].name} timeframes={timeframes} candles={candles} flags={flags} error={error} dark={dark} loadingOlder={loadingOlder} onNeedOlder={needOlder} onChange={setChart} />
            <RecentAlerts alerts={allAlerts} />
          </main>
        </div>
      )}

      {bot && <ManagePools open={manageOpen} onOpenChange={setManageOpen} pools={pools} onChanged={reloadBot} />}
    </div>
  )
}
