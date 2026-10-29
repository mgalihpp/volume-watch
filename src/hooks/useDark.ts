import { useEffect, useState } from 'react'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Ikuti tema sistem dan pasang class .dark di <html> supaya varian dark: shadcn ikut berlaku. */
export function useDark() {
  const [dark, setDark] = useState(() => query().matches)
  useEffect(() => {
    const mq = query()
    const on = () => setDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return dark
}
