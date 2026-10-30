import { useEffect, useState } from 'react'
import { fetchPoolDetail, type PoolDetail } from '@/lib/meteora'

/** Info statis dan harian pool (fee, bin step, volume 24 jam); cukup diperbarui tiap menit. */
export function usePoolDetail(addr: string) {
  const [detail, setDetail] = useState<{ addr: string; data: PoolDetail } | null>(null)
  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchPoolDetail(addr)
        .then((data) => !cancelled && setDetail({ addr, data }))
        .catch(() => {})
    void load()
    const id = setInterval(load, 60000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [addr])
  return detail?.addr === addr ? detail.data : null
}
