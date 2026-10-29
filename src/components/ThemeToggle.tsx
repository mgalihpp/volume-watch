import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ThemeMode } from '@/hooks/useDark'

export function ThemeToggle({ dark, setMode }: { dark: boolean; setMode: (m: ThemeMode) => void }) {
  return (
    <Button variant="ghost" size="icon-lg" className="rounded-lg text-muted-foreground" onClick={() => setMode(dark ? 'light' : 'dark')} aria-label={dark ? 'Pakai tema terang' : 'Pakai tema gelap'} title={dark ? 'Tema terang' : 'Tema gelap'}>
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
