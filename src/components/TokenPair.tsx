import { useState } from 'react'
import { cn } from '@/lib/utils'

// Logo dari metadata token Jupiter
const ICONS: Record<string, string> = {
  DOGE: 'https://arweave.net/ygw21WEL7f1phnN2lLWqv4LERCdMFuVd8AflgWo1sfE',
  PEPE: 'https://arweave.net/FyNde0I6M7gOYB6Ui_wnCFPraX4AQIaEcr6rB9gWPAQ',
  SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
}

function Token({ symbol, className }: { symbol: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = ICONS[symbol]
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[0.45em] font-semibold ring-2 ring-card', className)}>
      {src && !failed ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : symbol[0]}
    </span>
  )
}

/** "PEPE-SOL" jadi dua ikon yang saling tumpuk. */
export function TokenPair({ pair, size = 'sm' }: { pair: string; size?: 'sm' | 'lg' }) {
  const [base, quote] = pair.split('-')
  const s = size === 'lg' ? 'size-7 text-[28px]' : 'size-5 text-[20px]'
  return (
    <span className="flex shrink-0 items-center" aria-hidden>
      <Token symbol={base} className={s} />
      <Token symbol={quote} className={cn(s, size === 'lg' ? '-ml-2.5' : '-ml-1.5')} />
    </span>
  )
}
