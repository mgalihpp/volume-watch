import { useCallback, useEffect, useState } from 'react'
import type { AlertEntry, PoolRow } from '@/hooks/usePoolMonitor'
import { DEFAULT_POOLS, type PoolInfo, type Rule } from '@/lib/meteora'

interface RawBotAlert {
  t: number
  pool: string
  vol: number
  ratio: number | null
}

interface RawBotPool {
  perMin: number
  base: number
  ratio: number | null
  spike: boolean
  price: number
  tvl: number
  chg: number
}

export interface BotData {
  rule: Rule
  alerts: AlertEntry[]
  updated: number
  /** Angka live bot per pool (volume 1 menit), sama persis dengan yang memicu Telegram */
  rows: Record<string, PoolRow>
  pools: Record<string, PoolInfo>
}

function alertTime(t: number) {
  const d = new Date(t * 1000)
  const sameDay = d.toDateString() === new Date().toDateString()
  return d.toLocaleString('id-ID', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Data dari bot Telegram di VPS (data/alerts.json). null kalau website dibuka tanpa bot, misalnya di GitHub Pages. */
export function useBotData() {
  const [data, setData] = useState<BotData | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetch('./data/alerts.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { rule: Rule; alerts: RawBotAlert[]; updated: number; pools?: Record<string, RawBotPool>; poolsInfo?: Record<string, PoolInfo> } | null) => {
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
          const rows: Record<string, PoolRow> = {}
          for (const [addr, p] of Object.entries(j.pools ?? {})) {
            // ratio null dari bot artinya baseline 0: tak terhingga kalau ada volume, 0 kalau tidak
            rows[addr] = { vol1m: p.perMin, ratio: p.ratio ?? (p.perMin > 0 ? Infinity : 0), base: p.base, chg: p.chg, price: p.price, vol30: 0, tvl: p.tvl, isSpike: p.spike, series: [] }
          }
          const pools = j.poolsInfo && Object.keys(j.poolsInfo).length ? j.poolsInfo : DEFAULT_POOLS
          setData({ rule: j.rule, alerts, updated: j.updated, rows, pools })
        })
        .catch(() => {})
    void load()
    const id = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { bot: data, reload }
}

async function postBot(path: string, body: unknown): Promise<void> {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (r.ok) return
  const j = (await r.json().catch(() => null)) as { error?: string } | null
  throw new Error(j?.error ?? `Gagal (HTTP ${r.status})`)
}

/** Simpan aturan ke bot VPS; bot langsung memakainya tanpa restart. */
export const saveBotRule = (rule: Rule) => postBot('./api/rule', rule)
/** address boleh berupa link Meteora, bot mengambil alamatnya. */
export const addBotPool = (address: string) => postBot('./api/pools/add', { address })
export const removeBotPool = (address: string) => postBot('./api/pools/remove', { address })
