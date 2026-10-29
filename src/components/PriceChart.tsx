import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartCandlestickIcon, ChartLineIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { POOLS, TF_SEC, TIMEFRAMES, fetchCandles, fmtPrice, spikeFlags, usd, type Candle, type Rule, type Timeframe } from '@/lib/meteora'

export type ChartType = 'candle' | 'line'

const COLOR = { ink: '#18181b', soft: '#71717a', up: '#16a34a', down: '#dc2626', rule: '#e4e4e7', band: '#fef3c7' }
const FONT = '11px "Geist Variable", system-ui, sans-serif'

const segCls = 'gap-0.5 rounded-lg bg-muted p-[3px]'
const segItemCls =
  'h-8 gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:hover:bg-card'

function fmtTime(t: number, tf: Timeframe) {
  const d = new Date(t * 1000)
  return TF_SEC[tf] >= 86400 ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  addr: string
  tf: Timeframe
  type: ChartType
  rule: Rule
  onChange: (patch: { addr?: string; tf?: Timeframe; type?: ChartType }) => void
}

export function PriceChart({ addr, tf, type, rule, onChange }: Props) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [error, setError] = useState('')
  const [hover, setHover] = useState(-1)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    setCandles([])
    const load = () =>
      fetchCandles(addr, tf)
        .then((c) => !cancelled && (setCandles(c), setError('')))
        .catch((e: Error) => !cancelled && setError(`Chart gagal dimuat (${e.message}).`))
    void load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [addr, tf])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const flags = useMemo(() => spikeFlags(candles, tf, rule), [candles, tf, rule])
  const hits = flags.filter(Boolean).length

  const layout = useMemo(() => {
    const padR = 68, padB = 22, padT = 12, volH = 72, gap = 12
    const pw = size.w - padR
    const ph = size.h - padB - padT - volH - gap
    const slot = candles.length ? pw / candles.length : 0
    return { padR, padB, padT, volH, gap, pw, ph, slot, vTop: padT + ph + gap }
  }, [size, candles.length])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !size.w) return
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(size.w * dpr)
    cv.height = Math.round(size.h * dpr)
    const g = cv.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, size.w, size.h)
    g.font = FONT
    if (!candles.length) {
      g.fillStyle = COLOR.soft
      g.fillText(error || 'Memuat chart...', 14, 24)
      return
    }

    const { padT, volH, pw, ph, slot, vTop } = layout
    const lo = Math.min(...candles.map((c) => c.low))
    const hi = Math.max(...candles.map((c) => c.high))
    const span = hi - lo || hi * 0.01
    const min = lo - span * 0.06
    const max = hi + span * 0.06
    const vmax = Math.max(...candles.map((c) => c.volume), 1)
    const bw = Math.max(Math.min(slot * 0.68, 16), 1.5)
    const X = (i: number) => i * slot + slot / 2
    const Y = (p: number) => padT + ((max - p) / (max - min)) * ph

    flags.forEach((f, i) => {
      if (!f) return
      g.fillStyle = COLOR.band
      g.fillRect(i * slot, 0, slot, vTop + volH + 4)
    })

    g.strokeStyle = COLOR.rule
    g.fillStyle = COLOR.soft
    g.lineWidth = 1
    g.textAlign = 'left'
    for (let i = 0; i <= 4; i++) {
      const p = min + ((max - min) * i) / 4
      const y = Math.round(Y(p)) + 0.5
      g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke()
      g.fillText(fmtPrice(p), pw + 6, y + 4)
    }
    g.textAlign = 'center'
    const step = Math.ceil(candles.length / 8)
    for (let i = 0; i < candles.length; i += step) g.fillText(fmtTime(candles[i].timestamp, tf), Math.min(Math.max(X(i), 24), pw - 24), size.h - 6)

    candles.forEach((c, i) => {
      g.fillStyle = c.close >= c.open ? 'rgba(22,163,74,.33)' : 'rgba(220,38,38,.33)'
      const vh = (c.volume / vmax) * volH
      g.fillRect(X(i) - bw / 2, vTop + volH - vh, bw, vh)
    })

    if (type === 'candle') {
      candles.forEach((c, i) => {
        g.strokeStyle = g.fillStyle = c.close >= c.open ? COLOR.up : COLOR.down
        g.beginPath(); g.moveTo(X(i), Y(c.high)); g.lineTo(X(i), Y(c.low)); g.stroke()
        const y1 = Y(c.open), y2 = Y(c.close)
        g.fillRect(X(i) - bw / 2, Math.min(y1, y2), bw, Math.max(Math.abs(y1 - y2), 1.5))
      })
    } else {
      g.beginPath()
      candles.forEach((c, i) => (i ? g.lineTo(X(i), Y(c.close)) : g.moveTo(X(i), Y(c.close))))
      g.strokeStyle = COLOR.ink; g.lineWidth = 1.75; g.lineJoin = 'round'; g.stroke()
    }

    const last = candles[candles.length - 1]
    const ly = Math.round(Y(last.close)) + 0.5
    g.lineWidth = 1; g.setLineDash([4, 3]); g.strokeStyle = 'rgba(24,24,27,.4)'
    g.beginPath(); g.moveTo(0, ly); g.lineTo(pw, ly); g.stroke(); g.setLineDash([])
    g.fillStyle = COLOR.ink; g.beginPath(); g.roundRect(pw + 2, ly - 9, layout.padR - 4, 18, 4); g.fill()
    g.fillStyle = '#fafafa'; g.textAlign = 'left'; g.fillText(fmtPrice(last.close), pw + 7, ly + 4)

    if (hover >= 0 && hover < candles.length) {
      const hx = Math.round(X(hover)) + 0.5
      g.strokeStyle = COLOR.ink; g.setLineDash([2, 3])
      g.beginPath(); g.moveTo(hx, padT); g.lineTo(hx, vTop + volH); g.stroke(); g.setLineDash([])
    }
  }, [candles, flags, layout, size, type, tf, hover, error])

  const [tip, setTip] = useState({ x: 0, y: 0 })
  const onMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const i = Math.floor(x / (layout.slot || 1))
    if (x > layout.pw || i < 0 || i >= candles.length) return setHover(-1)
    setHover(i)
    setTip({ x: Math.max(Math.min(x + 14, rect.width - 200), 4), y: Math.max(e.clientY - rect.top - 70, 4) })
  }
  const hc = hover >= 0 ? candles[hover] : undefined
  const hchg = hc ? (hc.close / hc.open - 1) * 100 : 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup spacing={0} className={segCls} value={[tf]} onValueChange={(v) => v[0] && onChange({ tf: v[0] as Timeframe })} aria-label="Timeframe">
          {TIMEFRAMES.map((t) => (
            <ToggleGroupItem key={t} value={t} className={segItemCls}>
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup spacing={0} className={segCls} value={[type]} onValueChange={(v) => v[0] && onChange({ type: v[0] as ChartType })} aria-label="Tipe chart">
          <ToggleGroupItem value="candle" className={segItemCls}>
            <ChartCandlestickIcon className="size-3.5" />
            Candle
          </ToggleGroupItem>
          <ToggleGroupItem value="line" className={segItemCls}>
            <ChartLineIcon className="size-3.5" />
            Line
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div ref={boxRef} className="relative h-[300px] md:h-[360px]" onMouseMove={onMove} onMouseLeave={() => setHover(-1)}>
        <canvas ref={canvasRef} role="img" aria-label={`Chart harga dan volume ${POOLS[addr]}`} className="block h-full w-full" />
        {hc && (
          <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-[13px] leading-normal text-background shadow-md" style={{ left: tip.x, top: tip.y }}>
            <b>{new Date(hc.timestamp * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b>
            <br />Open {fmtPrice(hc.open)}, high {fmtPrice(hc.high)}
            <br />Low {fmtPrice(hc.low)}, close {fmtPrice(hc.close)}
            <br />
            <span style={{ color: hchg >= 0 ? '#8fd8b8' : '#f0a08e' }}>{hchg >= 0 ? '+' : ''}{hchg.toFixed(2)}%</span> dengan volume {usd(hc.volume)}
            {flags[hover] && <><br /><span className="text-amber">Memicu alert</span></>}
          </div>
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-3 rounded-[3px] bg-amber" />
        Candle yang memicu alert{error && !candles.length ? `. ${error}` : hits ? ` (${hits})` : ''}
      </p>
    </div>
  )
}
