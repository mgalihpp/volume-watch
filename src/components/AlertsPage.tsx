import { useEffect, useState } from 'react'
import { ArrowLeftIcon, BellIcon } from 'lucide-react'
import { useSeenAlerts } from '@/components/AlertMenu'
import type { AlertEntry } from '@/hooks/usePoolMonitor'
import { splitName, usdShort } from '@/lib/meteora'
import { cn } from '@/lib/utils'

export function AlertRow({ alert: a, fresh }: { alert: AlertEntry; fresh: boolean }) {
  const { pair, bin } = splitName(a.pool)
  return (
    <li className={cn('flex items-center gap-3 rounded-lg px-3 py-3', fresh && 'bg-muted')}>
      <span className={cn('size-2 shrink-0 rounded-full', fresh ? 'bg-amber-strong' : 'bg-foreground/20')} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold">
          {pair} · {bin}
        </span>
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {usdShort(a.vol)} per menit · {a.ratio}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
    </li>
  )
}

/** Halaman #/alerts: semua alert yang diketahui, bisa disaring per pool. */
export function AlertsPage({ alerts, botUpdated }: { alerts: AlertEntry[]; botUpdated?: number }) {
  const [filter, setFilter] = useState('')
  const [{ seen }, setSeen] = useSeenAlerts()
  // titik "baru" mengacu ke kunjungan sebelumnya; ditandai dibaca saat halaman ditutup
  const [seenAtOpen] = useState(seen)
  const newest = alerts[0]?.id
  useEffect(
    () => () => {
      if (newest) setSeen({ seen: newest })
    },
    [newest, setSeen],
  )

  const pools = [...new Set(alerts.map((a) => splitName(a.pool).pair))]
  const list = filter ? alerts.filter((a) => splitName(a.pool).pair === filter) : alerts
  const botAlive = botUpdated != null && Date.now() / 1000 - botUpdated < 300

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <a href="#/" className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-3.5" />
            Dashboard
          </a>
          <h2 className="text-[28px] font-bold tracking-tight md:text-4xl">Semua alert</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {botUpdated != null && <span className={cn('size-1.5 shrink-0 rounded-full', botAlive ? 'bg-up' : 'bg-down')} />}
            {botUpdated == null
              ? 'Lonjakan volume sejak halaman ini dibuka.'
              : botAlive
                ? 'Lonjakan volume yang terdeteksi bot di semua pool, terbaru di atas.'
                : 'Bot VPS tidak merespons. Riwayat mungkin tertinggal.'}
          </p>
        </div>
        {pools.length > 1 && (
          <div role="tablist" aria-label="Pool" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:w-fit md:gap-0.5">
            {['', ...pools].map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={filter === p}
                onClick={() => setFilter(p)}
                className={cn(
                  'shrink-0 rounded-md px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors',
                  filter === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {p || 'Semua'}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center text-muted-foreground">
          <BellIcon className="size-5" />
          <span className="text-[13px]">Belum ada lonjakan. Alert muncul di sini saat bar pool penuh.</span>
        </div>
      ) : (
        <>
          <div className="hidden border-y md:block">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-4 px-2 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              <span>Pool</span>
              <span>Volume 1 menit</span>
              <span>Dibanding normal</span>
              <span>Waktu</span>
            </div>
            {list.map((a) => {
              const { pair, bin } = splitName(a.pool)
              return (
                <div key={a.id} className="grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center gap-4 border-t px-2 py-3.5 text-sm tabular-nums">
                  <span className="flex items-center gap-3 font-semibold">
                    <span className={cn('size-2 rounded-full', a.id > seenAtOpen ? 'bg-amber-strong' : 'bg-foreground/20')} />
                    {pair}
                    <span className="text-[11px] font-medium text-muted-foreground">{bin}</span>
                  </span>
                  <span className="font-semibold">{usdShort(a.vol)}</span>
                  <span className="font-bold text-amber-strong">{a.ratio}</span>
                  <span className="text-[13px] text-muted-foreground">{a.time}</span>
                </div>
              )
            })}
          </div>
          <ul className="-mx-4 flex flex-col border-y md:hidden">
            {list.map((a) => {
              const { pair, bin } = splitName(a.pool)
              return (
                <li key={a.id} className="flex flex-col gap-2 border-b px-4 py-3.5 last:border-b-0">
                  <span className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', a.id > seenAtOpen ? 'bg-amber-strong' : 'bg-foreground/20')} />
                    <span className="text-sm font-bold">{pair}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">{bin}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{a.time}</span>
                  </span>
                  <span className="text-[13px] text-muted-foreground tabular-nums">
                    {usdShort(a.vol)} per menit · {a.ratio}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
