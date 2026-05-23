/**
 * Fail the build early when VITE_* vars are missing (common on Cloudflare Pages
 * if variables are Runtime-only or not scoped to Production).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

function loadEnvFiles() {
  const merged = { ...process.env }
  for (const name of ['.env.production.local', '.env.production', '.env.local', '.env']) {
    const filePath = resolve(process.cwd(), name)
    if (!existsSync(filePath)) continue
    for (const line of readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in merged) || merged[key] === '') merged[key] = value
    }
  }
  return merged
}

const env = loadEnvFiles()
const missing = REQUIRED.filter((key) => !env[key]?.trim())

if (missing.length > 0) {
  console.error('\n[build] Missing required environment variables:')
  for (const key of missing) console.error(`  - ${key}`)
  console.error(`
Fix options:
  1) GitHub Actions (recommended): repo Settings → Secrets → add VITE_* and CLOUDFLARE_* (see .github/workflows/cloudflare-pages.yml)
  2) Cloudflare Dashboard: Settings → Environment variables — names must be exact, available at BUILD time, Production scope
  3) Local: copy .env.example to .env

Visible VITE_* keys during this build: ${
    Object.keys(env)
      .filter((k) => k.startsWith('VITE_'))
      .join(', ') || '(none)'
  }
`)
  process.exit(1)
}

if (!env.VITE_SUPABASE_URL.trim().startsWith('http')) {
  console.error('[build] VITE_SUPABASE_URL must start with http(s)://')
  process.exit(1)
}

console.log('[build] VITE_* env OK (Supabase URL present)')
