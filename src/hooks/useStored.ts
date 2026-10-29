import { useCallback, useState } from 'react'

/** useState yang disimpan di localStorage. Kalau storage diblokir, tetap jalan tanpa menyimpan. */
export function useStored<T extends object>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem(key) ?? '{}') }
    } catch {
      return fallback
    }
  })
  const update = useCallback(
    (patch: Partial<T>) => {
      setValue((prev) => {
        const next = { ...prev, ...patch }
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* storage tidak tersedia */
        }
        return next
      })
    },
    [key],
  )
  return [value, update] as const
}
