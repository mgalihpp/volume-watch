export const POOLS: Record<string, string> = {
  '4n9rkpKkPUGFquBh6UXqNYbaCNyBcFq9VwNbutwGX5d6': 'DOGE-SOL bin 25',
  '4tdiWAfestHKtTSyaaaS3smVyC994a5xyqH47RXvyupz': 'DOGE-SOL bin 10',
  HDojZeCdUee8nczxsc9MeiMKVF961HqEFeKEvHw74xVR: 'PEPE-SOL bin 20',
  E1XdfKcKbE6uyamZy3fy4T9YBBKotAZp1ky6s1FMoxED: 'PEPE-SOL bin 10',
}
export const POOL_ADDRESSES = Object.keys(POOLS)

export interface TokenInfo {
  symbol: string
  icon?: string
}
export interface PoolInfo {
  name: string
  x: TokenInfo
  y: TokenInfo
}

/** Daftar bawaan; di VPS diganti daftar dari bot (bisa ditambah/hapus lewat website). */
export const DEFAULT_POOLS: Record<string, PoolInfo> = Object.fromEntries(
  Object.entries(POOLS).map(([addr, name]) => {
    const [x, y] = name.split(' bin ')[0].split('-')
    return [addr, { name, x: { symbol: x }, y: { symbol: y } }]
  }),
)

export function splitName(name: string) {
  const [pair, bin] = name.split(' bin ')
  return { pair, bin: bin ? `bin ${bin}` : '' }
}

const QUERIES = ['DOGE-SOL', 'PEPE-SOL']
const API = 'https://dlmm.datapi.meteora.ag'

export const TF_SEC = { '1m': 60, '5m': 300, '30m': 1800, '1h': 3600, '4h': 14400, '12h': 43200, '24h': 86400 } as const
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

export interface PoolDetail {
  binStep: number
  baseFee: number
  dynamicFee: number
  protocolFee: number
  tvl: number
  vol24: number
  fees24: number
  /** fee 24 jam dibagi TVL, sudah dalam persen */
  feeTvl24: number
  /** imbal hasil harian dalam persen (sama dengan feeTvl24) */
  apr: number
  x: { symbol: string; amount: number; price: number }
  y: { symbol: string; amount: number; price: number }
  createdAt: number
}

interface RawToken {
  symbol: string
  price?: number | string | null
}
interface RawDetail {
  token_x: RawToken
  token_y: RawToken
  token_x_amount: number | string
  token_y_amount: number | string
  created_at?: number
  pool_config: { bin_step: number; base_fee_pct: number; protocol_fee_pct: number }
  dynamic_fee_pct?: number | string | null
  tvl: number | string
  apr?: number | string | null
  volume: Record<string, number | string>
  fees: Record<string, number | string>
  fee_tvl_ratio: Record<string, number | string>
}

export async function fetchPoolDetail(address: string): Promise<PoolDetail> {
  const p = await getJSON<RawDetail>(`${API}/pools/${address}`)
  return {
    binStep: p.pool_config.bin_step,
    baseFee: p.pool_config.base_fee_pct,
    dynamicFee: Number(p.dynamic_fee_pct ?? 0),
    protocolFee: p.pool_config.protocol_fee_pct,
    tvl: Number(p.tvl),
    vol24: Number(p.volume['24h']),
    fees24: Number(p.fees['24h']),
    feeTvl24: Number(p.fee_tvl_ratio['24h']),
    apr: Number(p.apr ?? 0),
    x: { symbol: p.token_x.symbol, amount: Number(p.token_x_amount), price: Number(p.token_x.price ?? 0) },
    y: { symbol: p.token_y.symbol, amount: Number(p.token_y_amount), price: Number(p.token_y.price ?? 0) },
    createdAt: p.created_at ?? 0,
  }
}

export async function fetchCandles(address: string, tf: Timeframe, end = Math.floor(Date.now() / 1000), count = 96): Promise<Candle[]> {
  if (tf === '1m') return fetchBotMinutes(address)
  // API menolak rentang 100 candle atau lebih per request
  const start = end - TF_SEC[tf] * count
  const j = await getJSON<{ data?: Candle[] }>(`${API}/pools/${address}/ohlcv?timeframe=${tf}&start_time=${start}&end_time=${end}`)
  return (j.data ?? []).filter((c) => c.open > 0)
}

/** Meteora tidak punya candle 1m; candle 1m dicatat sendiri oleh bot VPS (7 hari terakhir). */
async function fetchBotMinutes(address: string): Promise<Candle[]> {
  const rows = await getJSON<[number, number, number, number, number, number][]>(`./data/minutes-${address}.json`)
  return rows.map(([timestamp, open, high, low, close, volume]) => ({ timestamp, open, high, low, close, volume }))
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

/** Candle yang memicu alert, aturannya sama dengan bot: volume >= mult x median candle sebelumnya dan >= minUsd per menit. */
export function spikeFlags(candles: Candle[], tf: Timeframe, rule: Rule): boolean[] {
  const tfMin = TF_SEC[tf] / 60
  return candles.map((c, i) => {
    if (i < rule.baseline) return false
    const base = median(candles.slice(i - rule.baseline, i).map((x) => x.volume))
    const ratio = base > 0 ? c.volume / base : Infinity
    return c.volume > 0 && ratio >= rule.mult && c.volume / tfMin >= rule.minUsd
  })
}
