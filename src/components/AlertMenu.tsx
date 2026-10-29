import { useState } from 'react'
import { BellIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { AlertEntry } from '@/hooks/usePoolMonitor'
import { usdShort } from '@/lib/meteora'

/** Tombol lonceng di header; angka di badge = alert yang belum dilihat. */
export function AlertMenu({ alerts }: { alerts: AlertEntry[] }) {
  const [seen, setSeen] = useState(0)
  const unseen = alerts.length ? alerts[0].id - seen : 0
  return (
    <Sheet onOpenChange={(o) => o && setSeen(alerts[0]?.id ?? 0)}>
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
          <SheetDescription>Lonjakan volume sejak halaman ini dibuka.</SheetDescription>
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
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-strong" />
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
