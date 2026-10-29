import { useEffect, useState } from 'react'
import type { AlertEntry } from '@/hooks/usePoolMonitor'
import type { Rule } from '@/lib/meteora'

interface RawBotAlert {
  t: number
  pool: string
  vol: number
  ratio: number | null
}

export interface BotData {
  rule: Rule
  alerts: AlertEntry[]
  updated: number
}

function alertTime(t: number) {
  const d = new Date(t * 1000)
  const sameDay = d.toDateString() === new Date().toDateString()
  return d.toLocaleString('id-ID', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Data dari bot Telegram di VPS (data/alerts.json). null kalau website dibuka tanpa bot, misalnya di GitHub Pages. */
export function useBotData() {
  const [data, setData] = useState<BotData | null>(null)
  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetch('./data/alerts.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { rule: Rule; alerts: RawBotAlert[]; updated: number } | null) => {
          if (cancelled || !j?.rule) return
          const alerts = j.alerts
            .map((a, i) => ({
              id: a.t * 1000 + (i % 1000),
              time: alertTime(a.t),
              pool: a.pool,
              vol: a.vol,
              ratio: a.ratio == null ? 'jauh di atas normal' : `${a.ratio.toFixed(1)}× normal`,
            }))
            .reverse()
          setData({ rule: j.rule, alerts, updated: j.updated })
        })
        .catch(() => {})
    void load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])
  return data
}
