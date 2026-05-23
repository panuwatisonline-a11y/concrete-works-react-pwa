/**
 * Materialize `.env.production` before Vite build.
 * Priority: process.env (host dashboard / GitHub Secrets) → env/production.env (Cloudflare Pages fallback).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_WEB_PUSH_PUBLIC_KEY']
const FALLBACK_FILE = resolve('env/production.env')

function parseEnvLines(text) {
  const out = {}
  for (const line of text.split('\n')) {
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
    out[key] = value
  }
  return out
}

function loadFallbackFile() {
  if (!existsSync(FALLBACK_FILE)) return {}
  return parseEnvLines(readFileSync(FALLBACK_FILE, 'utf8'))
}

const fallback = loadFallbackFile()
const lines = []

for (const key of KEYS) {
  const value = (process.env[key] ?? fallback[key] ?? '').trim()
  if (value) lines.push(`${key}=${value}`)
}

if (lines.length > 0) {
  writeFileSync('.env.production', `${lines.join('\n')}\n`)
  console.log(`[build] wrote .env.production (${lines.length}/${KEYS.length} vars)`)
} else {
  console.warn('[build] no VITE_* vars from process.env or env/production.env')
}
