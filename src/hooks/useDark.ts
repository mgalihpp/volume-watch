import { useEffect, useLayoutEffect, useState } from 'react'
import { useStored } from '@/hooks/useStored'

export type ThemeMode = 'system' | 'light' | 'dark'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Tema pilihan pengguna (atau ikut sistem); pasang class .dark di <html> supaya varian dark: shadcn ikut berlaku. */
export function useDark() {
  const [{ mode }, setStored] = useStored<{ mode: ThemeMode }>('theme', { mode: 'system' })
  const [systemDark, setSystemDark] = useState(() => query().matches)
  useEffect(() => {
    const mq = query()
    const on = () => setSystemDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const dark = mode === 'system' ? systemDark : mode === 'dark'
  // layout effect: class harus sudah terpasang sebelum chart membaca warna di effect biasa
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return { dark, mode, setMode: (m: ThemeMode) => setStored({ mode: m }) }
}
