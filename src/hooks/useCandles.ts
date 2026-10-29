import { useCallback, useEffect, useRef, useState } from 'react'
import { TF_SEC, fetchCandles, type Candle, type Timeframe } from '@/lib/meteora'

const merge = (a: Candle[], b: Candle[]) => {
  const byTime = new Map(a.map((c) => [c.timestamp, c]))
  for (const c of b) byTime.set(c.timestamp, c)
  return [...byTime.values()].sort((x, y) => x.timestamp - y.timestamp)
}

/** Candle terbaru diperbarui tiap 30 detik; loadOlder() menambah riwayat ke kiri saat chart digeser. */
export function useCandles(addr: string, tf: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [error, setError] = useState('')
  const [loadingOlder, setLoadingOlder] = useState(false)
  const busy = useRef(false)
  const exhausted = useRef(false)
  const key = useRef('')

  useEffect(() => {
    let cancelled = false
    key.current = `${addr}:${tf}`
    exhausted.current = false
    setCandles([])
    const load = () =>
      fetchCandles(addr, tf)
        .then((c) => !cancelled && (setCandles((prev) => merge(prev, c)), setError('')))
        .catch((e: Error) => !cancelled && setError(`Chart gagal dimuat (${e.message}). Dicoba lagi dalam 30 detik.`))
    void load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [addr, tf])

  const loadOlder = useCallback(
    (oldest: number | undefined) => {
      if (busy.current || exhausted.current || oldest == null) return
      busy.current = true
      setLoadingOlder(true)
      const k = key.current
      fetchCandles(addr, tf, oldest - TF_SEC[tf])
        .then((c) => {
          if (key.current !== k) return
          if (!c.length) exhausted.current = true
          setCandles((prev) => merge(c, prev))
        })
        .catch(() => {})
        .finally(() => {
          busy.current = false
          setLoadingOlder(false)
        })
    },
    [addr, tf],
  )

  return { candles, error, loadOlder, loadingOlder }
}
