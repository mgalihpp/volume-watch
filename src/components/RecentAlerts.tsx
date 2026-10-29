import { useSeenAlerts } from '@/components/AlertMenu'
import type { AlertEntry } from '@/hooks/usePoolMonitor'
import { splitName, usdShort } from '@/lib/meteora'
import { cn } from '@/lib/utils'

/** Panel di bawah chart: 4 alert terbaru sebagai baris datar, lengkapnya di #/alerts. */
export function RecentAlerts({ alerts }: { alerts: AlertEntry[] }) {
  const [{ seen }] = useSeenAlerts()
  return (
    <section className="mt-auto border-t" aria-label="Alert terakhir">
      <div className="flex items-center justify-between border-b px-4 py-3 lg:px-6">
        <h2 className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase lg:text-[13px] lg:font-bold lg:tracking-normal lg:text-foreground lg:normal-case">Alert terakhir</h2>
        <a href="#/alerts" className="text-xs font-semibold text-up hover:underline">
          Lihat semua →
        </a>
      </div>
      {alerts.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-muted-foreground lg:px-6">Belum ada lonjakan. Alert muncul di sini saat bar pool penuh.</p>
      ) : (
        <ul>
          {alerts.slice(0, 4).map((a) => {
            const { pair, bin } = splitName(a.pool)
            return (
              <li key={a.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0 lg:gap-4 lg:px-6">
                <span className={cn('size-[7px] shrink-0 rounded-full', a.id > seen ? 'bg-amber-strong' : 'bg-foreground/20')} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-row lg:items-center lg:gap-4">
                  <span className="truncate text-[13px] font-semibold lg:w-[190px] lg:shrink-0">
                    {pair} <span className="font-normal text-muted-foreground">· {bin}</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground tabular-nums lg:text-[13px] lg:text-foreground">
                    {usdShort(a.vol)} per menit<span className="lg:hidden"> · </span>
                    <span className="font-bold text-amber-strong lg:ml-6">{a.ratio}</span>
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground lg:text-xs">{a.time}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
