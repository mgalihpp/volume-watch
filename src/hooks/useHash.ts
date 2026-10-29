import { useEffect, useState } from 'react'

/** Rute sederhana berbasis #hash, supaya jalan di hosting statis (GitHub Pages) tanpa server. */
export function useHash() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const on = () => {
      setHash(location.hash)
      scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}
