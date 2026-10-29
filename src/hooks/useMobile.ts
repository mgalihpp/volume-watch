import { useSyncExternalStore } from 'react'

const query = '(max-width: 639px)'
const subscribe = (cb: () => void) => {
  const mq = matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** Layar ponsel: sheet muncul dari bawah, bukan dari kanan. */
export const useMobile = () => useSyncExternalStore(subscribe, () => matchMedia(query).matches)
