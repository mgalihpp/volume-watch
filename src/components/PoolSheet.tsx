import { useRef, useState, type ReactNode } from 'react'
import { ChevronDownIcon, Settings2Icon } from 'lucide-react'
import { PoolList } from '@/components/PoolList'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PoolRow } from '@/hooks/usePoolMonitor'
import type { PoolInfo, Rule } from '@/lib/meteora'

interface Props {
  pools: Record<string, PoolInfo>
  rows: Record<string, PoolRow>
  rule: Rule
  picked: string
  onPick: (addr: string) => void
  /** Ada kalau bot VPS tersedia: tombol "Kelola pool" di bawah daftar */
  onManage?: () => void
  children: ReactNode
}

/** Di layar kecil judul pool jadi tombol yang membuka bottom sheet berisi daftar pool. */
export function PoolSheet({ pools, rows, rule, picked, onPick, onManage, children }: Props) {
  const [open, setOpen] = useState(false)
  const manageNext = useRef(false)
  const anySpike = Object.values(rows).some((r) => r.isSpike)
  return (
    <>
      <span className="hidden min-w-0 items-center gap-2.5 md:flex">{children}</span>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        onOpenChangeComplete={(o) => {
          // buka "Kelola pool" setelah sheet ini benar-benar tertutup, kalau tidak klik yang sama ikut menutupnya
          if (!o && manageNext.current) {
            manageNext.current = false
            onManage?.()
          }
        }}
      >
        <SheetTrigger className="-mx-2 -my-1 flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1 outline-none active:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 md:hidden">
          {children}
          <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
            <ChevronDownIcon className="size-4 text-foreground" />
            {anySpike && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-strong ring-2 ring-card" />}
          </span>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh] gap-3 rounded-t-2xl px-3 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <span className="mx-auto h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
          <SheetTitle className="px-3 text-base font-semibold">Pilih pool</SheetTitle>
          <div className="min-h-0 overflow-y-auto">
            <PoolList
              dense
              pools={pools}
              rows={rows}
              rule={rule}
              picked={picked}
              onPick={(addr) => {
                onPick(addr)
                setOpen(false)
              }}
            />
          </div>
          {onManage && (
            <Button
              variant="outline"
              className="mx-3 h-10 shrink-0"
              onClick={() => {
                manageNext.current = true
                setOpen(false)
              }}
            >
              <Settings2Icon />
              Kelola pool
            </Button>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
