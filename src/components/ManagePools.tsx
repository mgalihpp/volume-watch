import { useState } from 'react'
import { LoaderCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { TokenPair } from '@/components/TokenPair'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMobile } from '@/hooks/useMobile'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { addBotPool, removeBotPool } from '@/hooks/useBotData'
import { splitName, type PoolInfo } from '@/lib/meteora'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  pools: Record<string, PoolInfo>
  onChanged: () => void
}

/** Tambah/hapus pool yang dipantau bot (dan website). */
export function ManagePools({ open, onOpenChange, pools, onChanged }: Props) {
  const mobile = useMobile()
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState('')
  const count = Object.keys(pools).length

  const run = async (key: string, job: () => Promise<void>) => {
    setBusy(key)
    setError('')
    try {
      await job()
      onChanged()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy('')
      setConfirm('')
    }
  }

  const add = async () => {
    if (await run('add', () => addBotPool(address.trim()))) setAddress('')
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setError('')
        onOpenChange(o)
      }}
    >
      <SheetContent side={mobile ? 'bottom' : 'right'} className="max-h-[92dvh] w-full gap-6 overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-h-none sm:rounded-none sm:max-w-[420px] sm:p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="text-lg font-semibold">Kelola pool</SheetTitle>
          <SheetDescription>Pool Meteora DLMM yang dipantau website dan bot Telegram.</SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
        >
          <Label htmlFor="pool-address" className="text-sm font-medium">
            Tambah pool
          </Label>
          <div className="flex gap-2">
            <Input
              id="pool-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat pool atau link Meteora"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              className="h-9 min-w-0 flex-1 rounded-lg"
            />
            <Button type="submit" disabled={!address.trim() || !!busy} className="h-9">
              {busy === 'add' ? <LoaderCircleIcon className="animate-spin" /> : <PlusIcon />}
              Tambah
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        <ul className="-mx-2 flex flex-col overflow-y-auto">
          {Object.entries(pools).map(([addr, pool]) => {
            const { pair, bin } = splitName(pool.name)
            const asking = confirm === addr
            return (
              <li key={addr} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <TokenPair x={pool.x} y={pool.y} size="lg" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{pair}</span>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">{bin}</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {addr.slice(0, 6)}…{addr.slice(-4)}
                  </span>
                </span>
                <Button
                  variant={asking ? 'destructive' : 'ghost'}
                  size={asking ? 'sm' : 'icon'}
                  disabled={!!busy || count <= 1}
                  onClick={() => (asking ? void run(addr, () => removeBotPool(addr)) : setConfirm(addr))}
                  onBlur={() => asking && setConfirm('')}
                  aria-label={`Hapus ${pool.name}`}
                  className="shrink-0"
                >
                  {busy === addr ? <LoaderCircleIcon className="animate-spin" /> : asking ? 'Hapus?' : <Trash2Icon />}
                </Button>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
