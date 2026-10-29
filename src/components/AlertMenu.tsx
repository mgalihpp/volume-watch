import { ArrowRightIcon, BellIcon } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { Button } from '@/components/ui/button'
import { AlertRow } from '@/components/AlertsPage'
import type { AlertEntry } from '@/hooks/usePoolMonitor'
import { useStored } from '@/hooks/useStored'

export const useSeenAlerts = () => useStored('alerts-seen', { seen: 0 })

/** Lonceng di header: dropdown 4 alert terbaru, lengkapnya ada di halaman Alert. */
export function AlertMenu({ alerts }: { alerts: AlertEntry[] }) {
  const [{ seen }, setSeen] = useSeenAlerts()
  const unseen = alerts.filter((a) => a.id > seen).length
  const markSeen = () => alerts[0] && setSeen({ seen: alerts[0].id })

  return (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="ghost" size="icon-lg" className="relative rounded-lg text-muted-foreground" aria-label={`Riwayat alert${unseen ? `, ${unseen} baru` : ''}`} />}>
        <BellIcon />
        {unseen > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-strong" />}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className="z-50">
          <Popover.Popup className="w-[min(420px,calc(100vw-2rem))] origin-top-right rounded-xl border bg-popover p-2 text-popover-foreground shadow-2xl outline-none transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <span className="text-[15px] font-bold">Alert</span>
              {unseen > 0 && (
                <button type="button" onClick={markSeen} className="text-xs font-semibold text-up hover:underline">
                  Tandai sudah dibaca
                </button>
              )}
            </div>
            {alerts.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">Belum ada lonjakan. Alert muncul di sini saat bar pool penuh.</p>
            ) : (
              <ul className="flex flex-col">
                {alerts.slice(0, 4).map((a) => (
                  <AlertRow key={a.id} alert={a} fresh={a.id > seen} />
                ))}
              </ul>
            )}
            <Popover.Close
              render={<a href="#/alerts" />}
              onClick={markSeen}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-3 text-[13px] font-bold text-up hover:bg-muted"
            >
              Lihat semua alert
              <ArrowRightIcon className="size-3.5" />
            </Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
