import { useState } from 'react'
import { LoaderCircleIcon, SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { saveBotRule } from '@/hooks/useBotData'
import { useStored } from '@/hooks/useStored'
import type { Rule } from '@/lib/meteora'

const FIELDS: { key: keyof Rule; label: string; unit: string; min: number; step: number }[] = [
  { key: 'mult', label: 'Lonjakan', unit: 'x', min: 1, step: 0.5 },
  { key: 'baseline', label: 'Baseline', unit: 'menit', min: 1, step: 1 },
  { key: 'minUsd', label: 'Minimal volume', unit: 'USD', min: 0, step: 100 },
  { key: 'interval', label: 'Cek tiap', unit: 'detik', min: 10, step: 5 },
]

const toDraft = (r: Rule) => ({ mult: String(r.mult), baseline: String(r.baseline), minUsd: String(r.minUsd), interval: String(r.interval) })

const inputCls =
  'h-9 rounded-lg text-right font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

interface Props {
  rule: Rule
  onSave: (rule: Rule) => void
  /** Ada berarti aturan disimpan ke bot Telegram di VPS (butuh PIN), bukan hanya di browser ini. */
  bot?: { onSaved: () => void }
}

export function RuleSheet({ rule, onSave, bot }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<keyof Rule, string>>(() => toDraft(rule))
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'denied'))
  const [{ pin }, setPin] = useStored('bot-pin', { pin: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const valid = FIELDS.every((f) => {
    const v = parseFloat(draft[f.key])
    return Number.isFinite(v) && v >= f.min
  }) && (!bot || pin.trim() !== '')

  const save = async () => {
    const next = { mult: parseFloat(draft.mult), baseline: Math.round(parseFloat(draft.baseline)), minUsd: parseFloat(draft.minUsd), interval: Math.round(parseFloat(draft.interval)) }
    if (!bot) {
      onSave(next)
      return setOpen(false)
    }
    setSaving(true)
    setError('')
    try {
      await saveBotRule(next, pin.trim())
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
      <SheetTrigger render={<Button variant="outline" aria-label="Aturan alert" />}>
        <SlidersHorizontalIcon />
        <span className="hidden sm:inline">Aturan alert</span>
      </SheetTrigger>
      <SheetContent className="gap-7 p-7 sm:max-w-[420px]">
        <SheetHeader className="p-0">
          <SheetTitle className="text-lg font-semibold">Aturan alert</SheetTitle>
          <SheetDescription>
            {bot
              ? 'Berlaku untuk website dan bot Telegram. Alert dikirim saat volume 1 menit melewati semua batas ini.'
              : 'Alert dikirim saat volume 1 menit melewati semua batas ini.'}
          </SheetDescription>
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
                  className={`${inputCls} pr-14`}
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

        <div className="mt-auto flex flex-col gap-3">
          {bot && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="rule-pin" className="text-sm font-medium">PIN bot</Label>
                <p className="text-xs text-muted-foreground">Diingat di browser ini</p>
              </div>
              <Input
                id="rule-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin({ pin: e.target.value })}
                aria-invalid={!!error}
                className="h-9 w-[150px] rounded-lg text-right font-medium tracking-widest"
              />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} disabled={!valid || saving} className="h-10 w-full">
            {saving && <LoaderCircleIcon className="animate-spin" />}
            {bot ? 'Simpan ke bot' : 'Simpan'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
