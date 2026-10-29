import { priceParts } from '@/lib/meteora'

export function Price({ value }: { value: number }) {
  const { head, zeros, digits } = priceParts(value)
  if (!zeros) return <>{head}</>
  return (
    <span aria-label={value.toFixed(zeros + 4)}>
      {head}
      <sub className="mx-px text-[0.62em] font-medium opacity-60">{zeros}</sub>
      {digits}
    </span>
  )
}
