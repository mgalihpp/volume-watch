import { PoolTabs } from '@/components/PoolTabs'
import { PriceChart, type ChartType } from '@/components/PriceChart'
import { RuleSheet } from '@/components/RuleSheet'
import { usePoolMonitor } from '@/hooks/usePoolMonitor'
import { useStored } from '@/hooks/useStored'
import { DEFAULT_RULE, POOL_ADDRESSES, POOLS, TF_SEC, type Rule, type Timeframe } from '@/lib/meteora'
import { cn } from '@/lib/utils'

const DEFAULT_CHART = { addr: POOL_ADDRESSES[2], tf: '1h' as Timeframe, type: 'candle' as ChartType }

export default function App() {
  const [rule, setRule] = useStored<Rule>('rule', DEFAULT_RULE)
  const [saved, setChart] = useStored('chart', DEFAULT_CHART)
  const chart = {
    addr: saved.addr in POOLS ? saved.addr : DEFAULT_CHART.addr,
    tf: saved.tf in TF_SEC ? saved.tf : DEFAULT_CHART.tf,
    type: saved.type === 'line' ? 'line' : 'candle',
  } as const
  const { rows, status, alerts } = usePoolMonitor(rule)

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-8 md:px-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Volume Watch</h1>
          <span title={status.text} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', status.ok ? 'bg-up' : 'bg-down')} />
            {status.ok ? 'Live' : 'Terputus'}
          </span>
        </div>
        <RuleSheet rule={rule} onSave={setRule} />
      </header>

      <PoolTabs rows={rows} picked={chart.addr} onPick={(addr) => setChart({ addr })} />

      <PriceChart {...chart} rule={rule} onChange={setChart} />

      <section aria-labelledby="h-alert" className="flex flex-col">
        <h2 id="h-alert" className="mb-1 text-sm font-semibold">Alert</h2>
        {alerts.length === 0 ? (
          <p className="border-b py-3 text-muted-foreground">Belum ada lonjakan.</p>
        ) : (
          <ul>
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 border-b py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-strong" />
                  <span className="font-medium">{a.pool}</span>
                  <span className="truncate text-muted-foreground">{a.text}</span>
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
