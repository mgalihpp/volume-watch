# Volume Watch

Dashboard untuk memantau lonjakan volume pool Meteora DLMM (DOGE-SOL dan PEPE-SOL) langsung dari browser.

- Chart candlestick atau line dengan bar volume, timeframe 5m sampai 24h.
- Pita kuning di chart menandai candle yang akan memicu alert dengan aturan kamu.
- Alert lonjakan volume dengan bunyi dan notifikasi browser.
- Data dari API publik Meteora, tanpa server dan tanpa API key.

Dibangun dengan Vite, React, TypeScript, Tailwind CSS, dan shadcn/ui.

## Jalankan lokal

```bash
npm install
npm run dev
```

## Ubah pool

Edit daftar `POOLS` dan `QUERIES` di `src/lib/meteora.ts`.

## Deploy

Setiap push ke `main` dibangun dan di-deploy ke GitHub Pages lewat `.github/workflows/deploy.yml`.
