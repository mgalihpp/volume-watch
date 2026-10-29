import { PoolTable } from '@/components/PoolTable'
import { PriceChart, type ChartType } from '@/components/PriceChart'
import { RuleSentence } from '@/components/RuleSentence'
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
    <div className="mx-auto max-w-[1120px] px-4 pt-7 pb-14 md:px-6 md:pt-10 md:pb-[72px]">
      <header>
        <h1 className="mb-2 text-[32px] leading-[1.05] font-bold tracking-tight md:text-[40px]">Volume watch</h1>
        <p className="text-muted-foreground">
          <span className={cn('mr-2 inline-block size-[9px] rounded-full', status.ok ? 'bg-up' : 'bg-down')} />
          {status.text}
        </p>
      </header>

      <RuleSentence rule={rule} onChange={setRule} />

      <section className="mt-12" aria-labelledby="h-chart">
        <h2 id="h-chart" className="mb-3 text-xl font-bold tracking-tight">Harga dan volume</h2>
        <PriceChart {...chart} rule={rule} onChange={setChart} />
      </section>

      <section className="mt-12" aria-labelledby="h-pools">
        <h2 id="h-pools" className="mb-3 text-xl font-bold tracking-tight">Pool</h2>
        <PoolTable rows={rows} picked={chart.addr} onPick={(addr) => setChart({ addr })} />
      </section>

      <section className="mt-12" aria-labelledby="h-log">
        <h2 id="h-log" className="mb-3 text-xl font-bold tracking-tight">Alert</h2>
        <ul className="max-w-[78ch] border-t-2 border-foreground">
          {alerts.length === 0 && (
            <li className="border-b border-border py-2 text-muted-foreground">
              Belum ada lonjakan. Alert muncul di sini dan berbunyi saat sebuah pool melewati aturan di atas.
            </li>
          )}
          {alerts.map((a) => (
            <li key={a.id} className="border-b border-border py-2">
              <span className="inline-block min-w-[6.5em] text-muted-foreground">{a.time}</span>
              <b>{a.pool}</b> {a.text}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-14 max-w-[70ch] text-[13px] text-muted-foreground">
        Data dari API publik Meteora, diambil langsung oleh browser kamu. Halaman harus tetap terbuka supaya alert jalan. Bukan saran investasi.
      </footer>
    </div>
  )
}
