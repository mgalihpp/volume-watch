import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartCandlestickIcon, ChartLineIcon, ChevronsRightIcon, LoaderCircleIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TF_SEC, fmtPrice, usdShort, type Candle, type Timeframe } from '@/lib/meteora'

export type ChartType = 'candle' | 'line'

const FONT = '11px "Inter Variable", system-ui, sans-serif'
const DEFAULT_COUNT = 90
const MIN_COUNT = 20
const MAX_COUNT = 400

const segCls = 'gap-0.5 rounded-full bg-muted p-[3px]'
const segItemCls =
  'h-8 min-w-0 gap-1.5 rounded-full px-2.5 text-xs sm:px-4 sm:text-[13px] font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary'

function fmtTime(t: number, tf: Timeframe, span: number) {
  const d = new Date(t * 1000)
  return TF_SEC[tf] >= 14400 || span > 2 * 86400
    ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function palette() {
  const s = getComputedStyle(document.documentElement)
  const v = (n: string) => s.getPropertyValue(n).trim()
  return { soft: v('--muted-foreground'), up: v('--up'), down: v('--down'), grid: v('--grid'), band: v('--amber'), amberStrong: v('--amber-strong') }
}

interface Props {
  addr: string
  name: string
  tf: Timeframe
  timeframes: Timeframe[]
  type: ChartType
  candles: Candle[]
  flags: boolean[]
  error: string
  dark: boolean
  loadingOlder: boolean
  onNeedOlder: () => void
  onChange: (patch: { tf?: Timeframe; type?: ChartType }) => void
}

export function PriceChart({ addr, name, tf, timeframes, type, candles, flags, error, dark, loadingOlder, onNeedOlder, onChange }: Props) {
  const [hover, setHover] = useState(-1)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // Jendela tampilan: `right` = jumlah candle tersembunyi di kanan (0 berarti mengikuti candle terbaru)
  const [view, setView] = useState({ right: 0, count: DEFAULT_COUNT })
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; right: number; moved: boolean } | null>(null)
  const pointers = useRef(new Map<number, number>())
  const pinch = useRef<{ dist: number; count: number } | null>(null)

  useEffect(() => setView({ right: 0, count: DEFAULT_COUNT }), [addr, tf])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = candles.length
  const count = Math.min(view.count, Math.max(n, 1))
  const right = Math.min(Math.max(view.right, 0), Math.max(n - count, 0))
  const start = Math.max(0, Math.floor(n - right - count))
  const vis = useMemo(() => candles.slice(start, start + count), [candles, start, count])
  const vflags = useMemo(() => flags.slice(start, start + count), [flags, start, count])

  useEffect(() => {
    if (n && start < 15) onNeedOlder()
  }, [n, start, onNeedOlder])

  const layout = useMemo(() => {
    const padR = 72, padB = 22, padT = 8, volH = 56, gap = 10
    const pw = size.w - padR
    const ph = size.h - padB - padT - volH - gap
    const slot = vis.length ? pw / count : 0
    return { padR, padT, volH, pw, ph, slot, vTop: padT + ph + gap }
  }, [size, vis.length, count])

  const setCount = (next: number) =>
    setView((v) => {
      const c = Math.round(Math.min(Math.max(next, MIN_COUNT), Math.min(MAX_COUNT, Math.max(n, MIN_COUNT))))
      return { right: v.right, count: c }
    })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        setView((v) => ({ ...v, right: Math.min(Math.max(v.right - e.deltaX / (layout.slot || 1), 0), Math.max(n - v.count, 0)) }))
        return
      }
      if (!e.ctrlKey && !e.shiftKey && e.deltaMode === 0 && Math.abs(e.deltaY) < 1) return
      e.preventDefault()
      setView((v) => ({ ...v, count: Math.round(Math.min(Math.max(v.count * (e.deltaY > 0 ? 1.12 : 1 / 1.12), MIN_COUNT), Math.min(MAX_COUNT, Math.max(n, MIN_COUNT)))) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [layout.slot, n])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !size.w) return
    const C = palette()
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(size.w * dpr)
    cv.height = Math.round(size.h * dpr)
    const g = cv.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, size.w, size.h)
    g.font = FONT
    if (!vis.length) return

    const { padT, volH, pw, ph, slot, vTop } = layout
    const off = (count - vis.length) * slot // riwayat belum termuat: candle rata kanan
    const lo = Math.min(...vis.map((c) => c.low))
    const hi = Math.max(...vis.map((c) => c.high))
    const span = hi - lo || hi * 0.01
    const min = lo - span * 0.06
    const max = hi + span * 0.06
    const vmax = Math.max(...vis.map((c) => c.volume), 1)
    const bw = Math.max(Math.min(slot * 0.62, 14), 1)
    const X = (i: number) => off + i * slot + slot / 2
    const Y = (p: number) => padT + ((max - p) / (max - min)) * ph

    vflags.forEach((f, i) => {
      if (!f) return
      g.fillStyle = C.band
      g.fillRect(off + i * slot, 0, slot, vTop + volH)
    })

    g.strokeStyle = C.grid
    g.fillStyle = C.soft
    g.lineWidth = 1
    g.textAlign = 'left'
    const lastY = Y(candles[n - 1].close)
    for (let i = 0; i <= 4; i++) {
      const p = min + ((max - min) * i) / 4
      const y = Math.round(Y(p)) + 0.5
      g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke()
      if (Math.abs(y - lastY) > 16) g.fillText(fmtPrice(p), pw + 8, y + 4) // jangan tertimpa label harga terakhir
    }
    g.textAlign = 'center'
    const tspan = vis[vis.length - 1].timestamp - vis[0].timestamp
    const step = Math.ceil(vis.length / Math.max(Math.floor(pw / 90), 2))
    for (let i = 0; i < vis.length; i += step) g.fillText(fmtTime(vis[i].timestamp, tf, tspan), Math.min(Math.max(X(i), 24), pw - 24), size.h - 6)

    vis.forEach((c, i) => {
      g.globalAlpha = vflags[i] ? 0.9 : 0.28
      g.fillStyle = vflags[i] ? C.amberStrong : c.close >= c.open ? C.up : C.down
      const vh = Math.max((c.volume / vmax) * volH, 1)
      g.fillRect(X(i) - bw / 2, vTop + volH - vh, bw, vh)
    })
    g.globalAlpha = 1

    if (type === 'candle') {
      vis.forEach((c, i) => {
        g.strokeStyle = g.fillStyle = c.close >= c.open ? C.up : C.down
        const x = Math.round(X(i)) + 0.5
        g.beginPath(); g.moveTo(x, Y(c.high)); g.lineTo(x, Y(c.low)); g.stroke()
        const y1 = Y(c.open), y2 = Y(c.close)
        g.fillRect(X(i) - bw / 2, Math.min(y1, y2), bw, Math.max(Math.abs(y1 - y2), 1.5))
      })
    } else {
      const col = vis[vis.length - 1].close >= vis[0].open ? C.up : C.down
      g.beginPath()
      vis.forEach((c, i) => (i ? g.lineTo(X(i), Y(c.close)) : g.moveTo(X(i), Y(c.close))))
      g.strokeStyle = col; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke()
      g.lineTo(X(vis.length - 1), padT + ph); g.lineTo(X(0), padT + ph); g.closePath()
      const grad = g.createLinearGradient(0, padT, 0, padT + ph)
      grad.addColorStop(0, col + '33'); grad.addColorStop(1, col + '00')
      g.fillStyle = grad; g.fill()
    }

    const last = candles[n - 1]
    const ly = Math.round(Y(last.close)) + 0.5
    if (ly > padT && ly < padT + ph) {
      const lastCol = last.close >= last.open ? C.up : C.down
      g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeStyle = lastCol
      g.beginPath(); g.moveTo(0, ly); g.lineTo(pw, ly); g.stroke(); g.setLineDash([])
      g.fillStyle = lastCol; g.beginPath(); g.roundRect(pw + 3, ly - 10, layout.padR - 4, 20, 5); g.fill()
      g.fillStyle = dark ? '#07090d' : '#fff'; g.textAlign = 'left'; g.fillText(fmtPrice(last.close), pw + 8, ly + 4)
    }

    if (hover >= 0 && hover < vis.length) {
      const hx = Math.round(X(hover)) + 0.5
      g.strokeStyle = C.soft; g.setLineDash([2, 3])
      g.beginPath(); g.moveTo(hx, padT); g.lineTo(hx, vTop + volH); g.stroke(); g.setLineDash([])
    }
  }, [vis, vflags, candles, n, count, layout, size, type, tf, hover, dark])

  const [tip, setTip] = useState(0)
  const hoverAt = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left
    const i = Math.floor((x - (count - vis.length) * layout.slot) / (layout.slot || 1))
    if (x > layout.pw || i < 0 || i >= vis.length) return setHover(-1)
    setHover(i)
    setTip(x > rect.width / 2 ? Math.max(x - 186, 4) : x + 14)
  }

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, e.clientX)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: Math.abs(a - b) || 1, count }
      drag.current = null
      return
    }
    drag.current = { x: e.clientX, right, moved: false }
  }
  const onMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, e.clientX)
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      setCount((pinch.current.count * pinch.current.dist) / (Math.abs(a - b) || 1))
      return
    }
    const d = drag.current
    if (d) {
      const dx = e.clientX - d.x
      if (Math.abs(dx) > 4) d.moved = true
      if (d.moved) {
        setHover(-1)
        setView((v) => ({ ...v, right: Math.min(Math.max(d.right + dx / (layout.slot || 1), 0), Math.max(n - count, 0)) }))
      }
      return
    }
    if (e.pointerType === 'mouse') hoverAt(e.clientX, rect)
  }
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    const d = drag.current
    drag.current = null
    if (d && !d.moved) hoverAt(e.clientX, e.currentTarget.getBoundingClientRect())
  }

  const hc = hover >= 0 ? vis[hover] : undefined
  const hchg = hc ? (hc.close / hc.open - 1) * 100 : 0
  const hits = vflags.filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup spacing={0} className={segCls} value={[tf]} onValueChange={(v) => v[0] && onChange({ tf: v[0] as Timeframe })} aria-label="Timeframe">
          {timeframes.map((t) => (
            <ToggleGroupItem key={t} value={t} className={segItemCls}>
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-4">
          {hits > 0 && (
            <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className="size-2.5 rounded-[3px] bg-amber ring-1 ring-amber-strong/40" />
              {hits} lonjakan
            </span>
          )}
          <ToggleGroup spacing={0} className={segCls} value={[type]} onValueChange={(v) => v[0] && onChange({ type: v[0] as ChartType })} aria-label="Tipe chart">
            <ToggleGroupItem value="candle" className={segItemCls} aria-label="Candle">
              <ChartCandlestickIcon className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="line" className={segItemCls} aria-label="Line">
              <ChartLineIcon className="size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div
        ref={boxRef}
        className="relative h-[320px] cursor-grab touch-pan-y select-none active:cursor-grabbing md:h-[420px]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={(e) => e.pointerType === 'mouse' && !drag.current && setHover(-1)}
      >
        <canvas ref={canvasRef} role="img" aria-label={`Chart harga dan volume ${name}, geser untuk melihat riwayat`} className="block h-full w-full" />
        {!n && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {error || <span className="h-full w-full animate-pulse rounded-lg bg-muted/60" />}
          </div>
        )}
        {loadingOlder && (
          <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-card/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
            <LoaderCircleIcon className="size-3 animate-spin" />
            Memuat riwayat
          </span>
        )}
        {right > 0.5 && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setView((v) => ({ ...v, right: 0 }))}
            className="absolute right-[80px] bottom-[86px] flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-muted"
          >
            Terbaru
            <ChevronsRightIcon className="size-3.5" />
          </button>
        )}
        {hc && (
          <div
            className="pointer-events-none absolute top-2 z-10 grid min-w-[172px] grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 rounded-lg border bg-popover px-3 py-2.5 text-xs tabular-nums shadow-lg"
            style={{ left: tip }}
          >
            <span className="col-span-2 mb-1 font-medium">
              {new Date(hc.timestamp * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-muted-foreground">Buka</span><span className="text-right">{fmtPrice(hc.open)}</span>
            <span className="text-muted-foreground">Tertinggi</span><span className="text-right">{fmtPrice(hc.high)}</span>
            <span className="text-muted-foreground">Terendah</span><span className="text-right">{fmtPrice(hc.low)}</span>
            <span className="text-muted-foreground">Tutup</span>
            <span className={`text-right ${hchg >= 0 ? 'text-up' : 'text-down'}`}>{fmtPrice(hc.close)}</span>
            <span className="text-muted-foreground">Volume</span><span className="text-right">{usdShort(hc.volume)}</span>
            {vflags[hover] && <span className="col-span-2 mt-1 font-medium text-amber-strong">Memicu alert</span>}
          </div>
        )}
      </div>
    </div>
  )
}
