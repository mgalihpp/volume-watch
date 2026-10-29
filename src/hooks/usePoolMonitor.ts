import { useEffect, useRef, useState } from 'react'
import { POOLS, POOL_ADDRESSES, fetchPools, median, usd, type Rule } from '@/lib/meteora'

export interface PoolRow {
  vol1m: number | null
  ratio: number | null
  base: number
  chg: number
  price: number
  vol30: number
  tvl: number
  isSpike: boolean
  series: number[]
}

export interface AlertEntry {
  id: number
  time: string
  pool: string
  text: string
}

interface Track {
  prevCum: number | null
  prevPrice: number
  prevT: number
  hist: number[]
  series: number[]
  lastAlert: number
}

const COOLDOWN_MS = 5 * 60 * 1000

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.07
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    /* audio diblokir sampai ada interaksi */
  }
}

export function usePoolMonitor(rule: Rule) {
  const [rows, setRows] = useState<Record<string, PoolRow>>({})
  const [status, setStatus] = useState<{ ok: boolean; text: string }>({ ok: false, text: 'Memuat data pool...' })
  const [alerts, setAlerts] = useState<AlertEntry[]>([])

  const ruleRef = useRef(rule)
  ruleRef.current = rule
  const tracks = useRef<Record<string, Track>>({})
  const alertId = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function tick() {
      let snaps
      try {
        snaps = await fetchPools()
      } catch (e) {
        if (!cancelled) setStatus({ ok: false, text: `Tidak bisa mengambil data Meteora (${(e as Error).message}). Mencoba lagi pada cek berikutnya.` })
        return
      }
      if (cancelled) return
      setStatus({ ok: true, text: `Memantau ${POOL_ADDRESSES.length} pool Meteora DLMM. Diperbarui ${new Date().toLocaleTimeString('id-ID')}.` })

      const r = ruleRef.current
      const now = Date.now()
      const nextRows: Record<string, PoolRow> = {}
      const fresh: AlertEntry[] = []

      for (const s of snaps) {
        const t = (tracks.current[s.address] ??= { prevCum: null, prevPrice: 0, prevT: 0, hist: [], series: [], lastAlert: 0 })

        if (t.prevCum === null) {
          Object.assign(t, { prevCum: s.cumVolume, prevPrice: s.price, prevT: now })
          t.hist.push(...Array<number>(5).fill(s.vol30 / 30))
          nextRows[s.address] = { vol1m: null, ratio: null, base: median(t.hist), chg: 0, price: s.price, vol30: s.vol30, tvl: s.tvl, isSpike: false, series: [] }
          continue
        }

        const mins = Math.max((now - t.prevT) / 60000, 0.1) // jeda antar cek tidak persis 1 menit
        const vol1m = Math.max(s.cumVolume - t.prevCum, 0) / mins
        const chg = t.prevPrice ? (s.price / t.prevPrice - 1) * 100 : 0
        const base = median(t.hist)
        const ratio = base > 0 ? vol1m / base : Infinity
        const isSpike = vol1m >= r.minUsd && ratio >= r.mult

        t.series = [...t.series, vol1m].slice(-40)
        t.hist = [...t.hist, vol1m].slice(-r.baseline)
        Object.assign(t, { prevCum: s.cumVolume, prevPrice: s.price, prevT: now })
        nextRows[s.address] = { vol1m, ratio, base, chg, price: s.price, vol30: s.vol30, tvl: s.tvl, isSpike, series: t.series }

        if (isSpike && now - t.lastAlert >= COOLDOWN_MS) {
          t.lastAlert = now
          const arah = chg > 0 ? 'naik' : chg < 0 ? 'turun' : 'datar'
          const kali = Number.isFinite(ratio) ? `${ratio.toFixed(1)} kali` : 'jauh di atas'
          fresh.push({
            id: ++alertId.current,
            time: new Date().toLocaleTimeString('id-ID'),
            pool: POOLS[s.address],
            text: `${usd(vol1m)} dalam 1 menit, ${kali} normal. Harga ${arah} ${Math.abs(chg).toFixed(2)}%.`,
          })
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Lonjakan volume ${POOLS[s.address]}`, { body: `${usd(vol1m)} dalam 1 menit` })
          }
        }
      }

      setRows((prev) => ({ ...prev, ...nextRows }))
      if (fresh.length) {
        beep()
        setAlerts((prev) => [...fresh.reverse(), ...prev])
      }
    }

    void tick()
    const id = setInterval(tick, rule.interval * 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [rule.interval])

  return { rows, status, alerts }
}
