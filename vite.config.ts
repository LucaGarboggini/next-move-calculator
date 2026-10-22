import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Cross-origin isolation enables SharedArrayBuffer (multi-threaded Stockfish).
const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// `LAN_HTTPS=1 npm run preview` serves a self-signed certificate. Browsers only honour COOP/COEP
// (and offer Cache Storage) in a secure context, and a LAN address over plain HTTP is not one.
const lanHttps = process.env.LAN_HTTPS === '1'

// Reachable from other devices on the network; the bundle is static and holds no secrets.
const network = { host: true, allowedHosts: true as const, headers: crossOriginIsolation }

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(lanHttps ? [basicSsl()] : [])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks: app releases do not invalidate the cached libraries (ADR 0011).
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'vendor-chess', test: /node_modules[\\/](chessground|chessops)[\\/]/ },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
            },
            { name: 'vendor-i18n', test: /node_modules[\\/](i18next|react-i18next)[\\/]/ },
          ],
        },
      },
    },
  },
  server: network,
  preview: network,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
    passWithNoTests: false,
  },
})
