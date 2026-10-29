import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Rule } from '@/lib/meteora'

function NumField({
  label,
  value,
  min,
  step,
  wide,
  onCommit,
}: {
  label: string
  value: number
  min: number
  step: number
  wide?: boolean
  onCommit: (v: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const commit = () => {
    const v = parseFloat(text)
    if (Number.isFinite(v) && v >= min) onCommit(v)
    else setText(String(value))
  }

  return (
    <Input
      type="number"
      aria-label={label}
      min={min}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cn(
        'mx-1 inline-block h-auto rounded-none border-0 border-b-2 border-foreground bg-transparent px-0.5 py-0 text-center text-[17px] focus-visible:bg-mark focus-visible:ring-0 md:text-[17px]',
        wide ? 'w-[5.4em]' : 'w-[4.2em]',
      )}
    />
  )
}

export function RuleSentence({ rule, onChange }: { rule: Rule; onChange: (patch: Partial<Rule>) => void }) {
  const [notif, setNotif] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'))

  const askNotif = async () => {
    if (!('Notification' in window)) return
    setNotif(await Notification.requestPermission())
  }
  const notifText =
    notif === 'granted' ? 'Notifikasi aktif' : notif === 'denied' ? 'Notifikasi ditolak di browser' : notif === 'unsupported' ? 'Browser ini tidak mendukung notifikasi' : 'Aktifkan notifikasi browser'

  return (
    <p className="mt-7 max-w-[62ch] text-[17px] leading-[2.1]">
      Beri tahu saya kalau volume 1 menit mencapai
      <NumField label="Kelipatan" value={rule.mult} min={1} step={0.5} onCommit={(v) => onChange({ mult: v })} />
      kali median
      <NumField label="Baseline dalam menit" value={rule.baseline} min={5} step={5} onCommit={(v) => onChange({ baseline: v })} />
      menit terakhir dan minimal $
      <NumField label="Minimal volume dalam USD" value={rule.minUsd} min={0} step={100} wide onCommit={(v) => onChange({ minUsd: v })} />
      . Cek tiap
      <NumField label="Interval dalam detik" value={rule.interval} min={10} step={5} onCommit={(v) => onChange({ interval: v })} />
      detik.{' '}
      <button type="button" onClick={askNotif} disabled={notif !== 'default'} className="text-trace underline underline-offset-[3px] disabled:no-underline disabled:opacity-70">
        {notifText}
      </button>
    </p>
  )
}
