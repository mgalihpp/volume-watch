import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { AlertEntry } from '@/hooks/usePoolMonitor'
import { useStored } from '@/hooks/useStored'
import { usdShort } from '@/lib/meteora'

interface Props {
  alerts: AlertEntry[]
  /** Waktu cek terakhir bot VPS (detik); ada berarti riwayat datang dari bot, bukan dari tab ini. */
  botUpdated?: number
}

/** Tombol lonceng di header; angka di badge = alert yang belum dilihat. */
export function AlertMenu({ alerts, botUpdated }: Props) {
  const [{ seen }, setSeen] = useStored('alerts-seen', { seen: 0 })
  const unseen = alerts.filter((a) => a.id > seen).length
  const botAlive = botUpdated != null && Date.now() / 1000 - botUpdated < 300

  return (
    <Sheet onOpenChange={(o) => o && alerts[0] && setSeen({ seen: alerts[0].id })}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="relative" aria-label={`Riwayat alert${unseen ? `, ${unseen} baru` : ''}`} />}>
        <BellIcon />
        {unseen > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-strong px-1 text-[10px] font-semibold text-white tabular-nums">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="gap-5 p-6 sm:max-w-[380px]">
        <SheetHeader className="p-0">
          <SheetTitle className="text-lg font-semibold">Riwayat alert</SheetTitle>
          <SheetDescription>
            {botUpdated == null ? (
              'Lonjakan volume sejak halaman ini dibuka.'
            ) : (
              <span className="flex items-center gap-2">
                <span className={botAlive ? 'size-1.5 rounded-full bg-up' : 'size-1.5 rounded-full bg-down'} />
                {botAlive ? 'Dari bot VPS, tetap tercatat saat website ditutup.' : 'Bot VPS tidak merespons. Riwayat mungkin tertinggal.'}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
            <BellIcon className="size-5" />
            <span className="text-[13px] leading-snug">Belum ada lonjakan. Alert muncul di sini saat bar pool penuh.</span>
          </div>
        ) : (
          <ul className="-mx-3 flex flex-col overflow-y-auto">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-3">
                <span className={a.id > seen ? 'mt-1.5 size-2 shrink-0 rounded-full bg-amber-strong' : 'mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/30'} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center justify-between gap-3 text-sm font-medium">
                    {a.pool}
                    <span className="text-xs font-normal text-muted-foreground tabular-nums">{a.time}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {usdShort(a.vol)} per menit, {a.ratio}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
