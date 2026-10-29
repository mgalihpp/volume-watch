import { useState } from 'react'
import { LoaderCircleIcon, SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { saveBotRule } from '@/hooks/useBotData'
import { useMobile } from '@/hooks/useMobile'
import type { Rule } from '@/lib/meteora'

const FIELDS: { key: keyof Rule; label: string; unit: string; min: number; step: number }[] = [
  { key: 'mult', label: 'Lonjakan', unit: 'x', min: 1, step: 0.5 },
  { key: 'baseline', label: 'Baseline', unit: 'menit', min: 1, step: 1 },
  { key: 'minUsd', label: 'Minimal volume', unit: 'USD', min: 0, step: 100 },
  { key: 'interval', label: 'Cek tiap', unit: 'detik', min: 10, step: 5 },
]

const toDraft = (r: Rule) => ({ mult: String(r.mult), baseline: String(r.baseline), minUsd: String(r.minUsd), interval: String(r.interval) })

const inputCls =
  'h-9 rounded-xl text-right font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

interface Props {
  rule: Rule
  onSave: (rule: Rule) => void
  /** Ada berarti aturan disimpan ke bot Telegram di VPS, bukan hanya di browser ini. */
  bot?: { onSaved: () => void }
}

export function RuleSheet({ rule, onSave, bot }: Props) {
  const mobile = useMobile()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<keyof Rule, string>>(() => toDraft(rule))
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'denied'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const valid = FIELDS.every((f) => {
    const v = parseFloat(draft[f.key])
    return Number.isFinite(v) && v >= f.min
  })

  const save = async () => {
    const next = { mult: parseFloat(draft.mult), baseline: Math.round(parseFloat(draft.baseline)), minUsd: parseFloat(draft.minUsd), interval: Math.round(parseFloat(draft.interval)) }
    if (!bot) {
      onSave(next)
      return setOpen(false)
    }
    setSaving(true)
    setError('')
    try {
      await saveBotRule(next)
      bot.onSaved()
      setOpen(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleNotif = async (on: boolean) => {
    if (on && 'Notification' in window) setPerm(await Notification.requestPermission())
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setDraft(toDraft(rule))
          setError('')
        }
        setOpen(o)
      }}
    >
      <SheetTrigger render={<Button size="lg" className="h-10 rounded-full px-3 font-bold sm:px-5" aria-label="Aturan alert" />}>
        <SlidersHorizontalIcon />
        <span className="hidden sm:inline">Aturan alert</span>
      </SheetTrigger>
      <SheetContent side={mobile ? 'bottom' : 'right'} className="max-h-[92dvh] gap-5 overflow-y-auto rounded-t-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-h-none sm:gap-7 sm:rounded-none sm:p-7 sm:max-w-[420px]">
        <SheetHeader className="p-0">
          <SheetTitle className="text-2xl font-bold tracking-tight">Aturan alert</SheetTitle>
          <SheetDescription>
            {bot
              ? 'Berlaku untuk website dan bot Telegram. Volume dihitung per 1 menit dari data Meteora, dibanding median beberapa menit sebelumnya.'
              : 'Alert dikirim saat volume 1 menit melewati semua batas ini.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/50 px-4 py-3">
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
                  className={`${inputCls} ${f.key === 'minUsd' ? 'pr-[4.75rem]' : 'pr-14'}`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{f.key === 'minUsd' ? 'USD/mnt' : f.unit}</span>
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

        <div className="mt-auto flex flex-col gap-3">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} disabled={!valid || saving} className="h-11 w-full rounded-full text-[15px] font-bold">
            {saving && <LoaderCircleIcon className="animate-spin" />}
            {bot ? 'Simpan ke bot' : 'Simpan'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
