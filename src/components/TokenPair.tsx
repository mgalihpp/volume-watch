import { useState } from 'react'
import type { TokenInfo } from '@/lib/meteora'
import { cn } from '@/lib/utils'

// Cadangan kalau bot belum punya ikon token (logo dari metadata token Jupiter)
const ICONS: Record<string, string> = {
  DOGE: 'https://arweave.net/ygw21WEL7f1phnN2lLWqv4LERCdMFuVd8AflgWo1sfE',
  PEPE: 'https://arweave.net/FyNde0I6M7gOYB6Ui_wnCFPraX4AQIaEcr6rB9gWPAQ',
  SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
}

function Token({ token, className }: { token: TokenInfo; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = token.icon || ICONS[token.symbol]
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[0.45em] font-semibold ring-2 ring-[var(--card)]', className)}>
      {src && !failed ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : token.symbol[0]}
    </span>
  )
}

/** Dua ikon token yang saling tumpuk, token utama di depan. */
export function TokenPair({ x, y, size = 'sm' }: { x: TokenInfo; y: TokenInfo; size?: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 'size-7 text-[28px]' : 'size-5 text-[20px]'
  return (
    <span className="flex shrink-0 items-center" aria-hidden>
      <Token token={x} className={cn(s, 'relative z-10')} />
      <Token token={y} className={cn(s, size === 'lg' ? '-ml-2.5' : '-ml-1.5')} />
    </span>
  )
}
