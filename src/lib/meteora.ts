export const POOLS: Record<string, string> = {
  '4n9rkpKkPUGFquBh6UXqNYbaCNyBcFq9VwNbutwGX5d6': 'DOGE-SOL bin 25',
  '4tdiWAfestHKtTSyaaaS3smVyC994a5xyqH47RXvyupz': 'DOGE-SOL bin 10',
  HDojZeCdUee8nczxsc9MeiMKVF961HqEFeKEvHw74xVR: 'PEPE-SOL bin 20',
  E1XdfKcKbE6uyamZy3fy4T9YBBKotAZp1ky6s1FMoxED: 'PEPE-SOL bin 10',
}
export const POOL_ADDRESSES = Object.keys(POOLS)

const QUERIES = ['DOGE-SOL', 'PEPE-SOL']
const API = 'https://dlmm.datapi.meteora.ag'

export const TF_SEC = { '5m': 300, '30m': 1800, '1h': 3600, '4h': 14400, '12h': 43200, '24h': 86400 } as const
export type Timeframe = keyof typeof TF_SEC
export const TIMEFRAMES = Object.keys(TF_SEC) as Timeframe[]

export interface Snapshot {
  address: string
  cumVolume: number
  price: number
  vol30: number
  tvl: number
}

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface RawPool {
  address: string
  current_price?: number | string | null
  tvl: number | string
  volume: Record<string, number | string>
  cumulative_metrics: { volume: number | string }
}

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<T>
}

export async function fetchPools(): Promise<Snapshot[]> {
  const results = await Promise.all(
    QUERIES.map((q) => getJSON<{ data?: RawPool[] }>(`${API}/pools?query=${encodeURIComponent(q)}&page_size=50`)),
  )
  const out: Snapshot[] = []
  for (const res of results) {
    for (const p of res.data ?? []) {
      if (!(p.address in POOLS)) continue
      out.push({
        address: p.address,
        cumVolume: Number(p.cumulative_metrics.volume),
        price: Number(p.current_price ?? 0),
        vol30: Number(p.volume['30m']),
        tvl: Number(p.tvl),
      })
    }
  }
  return out
}

export async function fetchCandles(address: string, tf: Timeframe, end = Math.floor(Date.now() / 1000), count = 96): Promise<Candle[]> {
  // API menolak rentang 100 candle atau lebih per request
  const start = end - TF_SEC[tf] * count
  const j = await getJSON<{ data?: Candle[] }>(`${API}/pools/${address}/ohlcv?timeframe=${tf}&start_time=${start}&end_time=${end}`)
  return (j.data ?? []).filter((c) => c.open > 0)
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const usdShort = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `$${(n / 1e3).toFixed(0)}k` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}k` : `$${Math.round(n)}`

/** Harga kecil ditulis 0.0₇5028 (tujuh nol disingkat), bukan 5.028e-8. */
export function priceParts(p: number): { head: string; zeros: number; digits: string } {
  if (!(p > 0) || p >= 0.0001) return { head: p >= 1 ? p.toFixed(4) : p.toPrecision(4), zeros: 0, digits: '' }
  const zeros = Math.floor(-Math.log10(p))
  const digits = Math.round(p * 10 ** (zeros + 4)).toString().slice(0, 4)
  return { head: '0.0', zeros, digits }
}

const SUB = '₀₁₂₃₄₅₆₇₈₉'
export function fmtPrice(p: number) {
  const { head, zeros, digits } = priceParts(p)
  return zeros ? head + [...String(zeros)].map((d) => SUB[+d]).join('') + digits : head
}

export interface Rule {
  mult: number
  baseline: number
  minUsd: number
  interval: number
}
export const DEFAULT_RULE: Rule = { mult: 3, baseline: 30, minUsd: 5000, interval: 60 }

/** Candle yang akan memicu alert: volumenya >= mult x median candle sebelumnya dan >= minUsd per menit. */
export function spikeFlags(candles: Candle[], tf: Timeframe, rule: Rule): boolean[] {
  const tfMin = TF_SEC[tf] / 60
  return candles.map((c, i) => {
    if (i < 5) return false
    const base = median(candles.slice(Math.max(0, i - rule.baseline), i).map((x) => x.volume))
    return base > 0 && c.volume >= base * rule.mult && c.volume / tfMin >= rule.minUsd
  })
}
