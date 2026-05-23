/**
 * Write .env.production from process.env before Vite build (Cloudflare Pages / CI).
 * Some hosts inject dashboard vars into the shell but not into Vite's automatic load order.
 */
import { writeFileSync } from 'node:fs'

const KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_WEB_PUSH_PUBLIC_KEY']

const lines = KEYS.map((key) => {
  const value = process.env[key]?.trim()
  return value ? `${key}=${value}` : null
}).filter(Boolean)

if (lines.length > 0) {
  writeFileSync('.env.production', `${lines.join('\n')}\n`)
  console.log(`[build] wrote .env.production (${lines.length}/${KEYS.length} vars)`)
}
