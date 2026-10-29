import { useState, type CSSProperties } from 'react'
import type { TokenInfo } from '@/lib/meteora'
import { cn } from '@/lib/utils'

// Cadangan kalau bot belum punya ikon token (logo dari metadata token Jupiter)
const ICONS: Record<string, string> = {
  DOGE: 'https://arweave.net/ygw21WEL7f1phnN2lLWqv4LERCdMFuVd8AflgWo1sfE',
  PEPE: 'https://arweave.net/FyNde0I6M7gOYB6Ui_wnCFPraX4AQIaEcr6rB9gWPAQ',
  SOL: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
}

function Token({ token, className, style }: { token: TokenInfo; className?: string; style: CSSProperties }) {
  const [failed, setFailed] = useState(false)
  const src = token.icon || ICONS[token.symbol]
  return (
    <span style={style} className={cn('absolute top-0 flex items-center justify-center overflow-hidden rounded-full bg-muted font-semibold ring-2 ring-[var(--card)]', className)}>
      {src && !failed ? <img src={src} alt="" className="size-full max-w-none object-cover" onError={() => setFailed(true)} /> : token.symbol[0]}
    </span>
  )
}

/** Dua ikon token yang saling tumpuk, token utama di depan. Lebarnya tetap supaya tidak pernah menimpa teks di sebelahnya. */
export function TokenPair({ x, y, size = 'sm' }: { x: TokenInfo; y: TokenInfo; size?: 'sm' | 'lg' }) {
  const d = size === 'lg' ? 28 : 20
  const overlap = size === 'lg' ? 10 : 6
  const box = { width: d, height: d, fontSize: d * 0.45 }
  return (
    <span className="relative block shrink-0" style={{ width: d * 2 - overlap, height: d }} aria-hidden>
      <Token token={y} style={{ ...box, left: d - overlap }} />
      <Token token={x} style={{ ...box, left: 0 }} className="z-10" />
    </span>
  )
}
