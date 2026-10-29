import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { POOLS, POOL_ADDRESSES, fmtPrice, usd } from '@/lib/meteora'
import { cn } from '@/lib/utils'
import type { PoolRow } from '@/hooks/usePoolMonitor'

function Spark({ series }: { series: number[] }) {
  if (series.length < 2) return <svg className="ml-auto h-[30px] w-[110px]" aria-hidden />
  const max = Math.max(...series, 1)
  const pts = series.map((v, i) => `${((i / (series.length - 1)) * 110).toFixed(1)},${(28 - (v / max) * 26).toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 110 30" preserveAspectRatio="none" className="ml-auto h-[30px] w-[110px]" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--trace)" strokeWidth="1.6" />
    </svg>
  )
}

const head = 'h-auto px-3 pb-2 text-right text-[13px] font-medium text-muted-foreground'

export function PoolTable({ rows, picked, onPick }: { rows: Record<string, PoolRow>; picked: string; onPick: (addr: string) => void }) {
  return (
    <Table className="tabular-nums">
      <TableHeader className="[&_tr]:border-b-2 [&_tr]:border-foreground">
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(head, 'pl-0 text-left')}>Pool</TableHead>
          <TableHead className={head}>1 menit terakhir</TableHead>
          <TableHead className={head}>Dari normal</TableHead>
          <TableHead className={head}>Harga (SOL)</TableHead>
          <TableHead className={head}>Harga 1m</TableHead>
          <TableHead className={cn(head, 'hidden md:table-cell')}>Volume 30m</TableHead>
          <TableHead className={cn(head, 'hidden md:table-cell')}>TVL</TableHead>
          <TableHead className={cn(head, 'hidden pr-0 md:table-cell')}>Tren</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {POOL_ADDRESSES.map((addr) => {
          const r = rows[addr]
          const ratio = r?.ratio == null ? '-' : Number.isFinite(r.ratio) ? `${r.ratio.toFixed(1)} kali` : 'tak terhingga'
          return (
            <TableRow key={addr} className="border-border hover:bg-transparent">
              <TableCell className="pl-0 align-top">
                <button
                  type="button"
                  onClick={() => onPick(addr)}
                  aria-pressed={picked === addr}
                  className={cn('text-left font-bold underline underline-offset-4 decoration-border hover:decoration-foreground', picked === addr && 'decoration-trace decoration-[3px]')}
                >
                  {POOLS[addr]}
                </button>
                {r?.isSpike && <Badge className="ml-2 rounded-none bg-mark px-1.5 text-foreground">Lonjakan</Badge>}
                <a href={`https://app.meteora.ag/dlmm/${addr}`} target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground">
                  Buka di Meteora
                </a>
              </TableCell>
              <TableCell className="text-right">{r?.vol1m == null ? '-' : usd(r.vol1m)}</TableCell>
              <TableCell className="text-right">
                <span className={cn('px-1.5 py-px', r?.isSpike && 'bg-mark font-bold')}>{ratio}</span>
              </TableCell>
              <TableCell className="text-right">{r ? fmtPrice(r.price) : '-'}</TableCell>
              <TableCell className={cn('text-right', r && r.chg > 0 && 'text-up', r && r.chg < 0 && 'text-down')}>
                {r ? `${r.chg >= 0 ? '+' : ''}${r.chg.toFixed(2)}%` : '-'}
              </TableCell>
              <TableCell className="hidden text-right md:table-cell">{r ? usd(r.vol30) : '-'}</TableCell>
              <TableCell className="hidden text-right md:table-cell">{r ? usd(r.tvl) : '-'}</TableCell>
              <TableCell className="hidden pr-0 md:table-cell">
                <Spark series={r?.series ?? []} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
