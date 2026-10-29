import { useState, type ReactNode } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { PoolList } from '@/components/PoolList'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PoolRow } from '@/hooks/usePoolMonitor'
import type { Rule } from '@/lib/meteora'

interface Props {
  rows: Record<string, PoolRow>
  rule: Rule
  picked: string
  onPick: (addr: string) => void
  children: ReactNode
}

/** Di layar kecil judul pool jadi tombol yang membuka bottom sheet berisi daftar pool. */
export function PoolSheet({ rows, rule, picked, onPick, children }: Props) {
  const [open, setOpen] = useState(false)
  const anySpike = Object.values(rows).some((r) => r.isSpike)
  return (
    <>
      <span className="hidden items-center gap-2.5 md:flex">{children}</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="-mx-2 -my-1 flex items-center gap-2.5 rounded-lg px-2 py-1 outline-none active:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 md:hidden">
          {children}
          <span className="relative flex size-6 items-center justify-center rounded-full bg-muted">
            <ChevronDownIcon className="size-4 text-foreground" />
            {anySpike && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-strong ring-2 ring-card" />}
          </span>
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-3 rounded-t-2xl px-3 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <span className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
          <SheetTitle className="px-3 text-base font-semibold">Pilih pool</SheetTitle>
          <PoolList
            dense
            rows={rows}
            rule={rule}
            picked={picked}
            onPick={(addr) => {
              onPick(addr)
              setOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
