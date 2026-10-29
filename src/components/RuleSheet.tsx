import { useState } from 'react'
import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import type { Rule } from '@/lib/meteora'

const FIELDS: { key: keyof Rule; label: string; unit: string; min: number; step: number }[] = [
  { key: 'mult', label: 'Lonjakan', unit: 'x', min: 1, step: 0.5 },
  { key: 'baseline', label: 'Baseline', unit: 'menit', min: 5, step: 5 },
  { key: 'minUsd', label: 'Minimal volume', unit: 'USD', min: 0, step: 100 },
  { key: 'interval', label: 'Cek tiap', unit: 'detik', min: 10, step: 5 },
]

const toDraft = (r: Rule) => ({ mult: String(r.mult), baseline: String(r.baseline), minUsd: String(r.minUsd), interval: String(r.interval) })

export function RuleSheet({ rule, onSave }: { rule: Rule; onSave: (rule: Rule) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<keyof Rule, string>>(() => toDraft(rule))
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'denied'))

  const valid = FIELDS.every((f) => {
    const v = parseFloat(draft[f.key])
    return Number.isFinite(v) && v >= f.min
  })

  const save = () => {
    onSave({ mult: parseFloat(draft.mult), baseline: parseFloat(draft.baseline), minUsd: parseFloat(draft.minUsd), interval: parseFloat(draft.interval) })
    setOpen(false)
  }

  const toggleNotif = async (on: boolean) => {
    if (on && 'Notification' in window) setPerm(await Notification.requestPermission())
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(toDraft(rule))
        setOpen(o)
      }}
    >
      <SheetTrigger render={<Button variant="outline" aria-label="Aturan alert" />}>
        <SlidersHorizontalIcon />
        <span className="hidden sm:inline">Aturan alert</span>
      </SheetTrigger>
      <SheetContent className="gap-7 p-7 sm:max-w-[420px]">
        <SheetHeader className="p-0">
          <SheetTitle className="text-lg font-semibold">Aturan alert</SheetTitle>
          <SheetDescription>Alert dikirim saat volume 1 menit melewati semua batas ini.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={`rule-${f.key}`} className="text-sm font-medium">
                {f.label}
              </Label>
              <div className="relative w-[150px]">
                <Input
                  id={`rule-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  step={f.step}
                  value={draft[f.key]}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  aria-invalid={!(parseFloat(draft[f.key]) >= f.min)}
                  className="h-9 rounded-lg pr-14 text-right font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="rule-notif" className="text-sm font-medium">Notifikasi browser</Label>
            <p className="text-xs text-muted-foreground">{perm === 'denied' ? 'Diblokir di pengaturan browser' : 'Bunyi dan pop-up saat ada lonjakan'}</p>
          </div>
          <Switch id="rule-notif" checked={perm === 'granted'} disabled={perm === 'denied'} onCheckedChange={toggleNotif} />
        </div>

        <Button onClick={save} disabled={!valid} className="h-10 w-full">
          Simpan
        </Button>
      </SheetContent>
    </Sheet>
  )
}
