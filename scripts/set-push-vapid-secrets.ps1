# ตั้ง VAPID secrets สำหรับ send-push / notify-request-change
# ใช้: .\scripts\set-push-vapid-secrets.ps1 -PublicKey "BNx..." -PrivateKey "abc..." -Subject "mailto:admin@yourdomain.com"

param(
  [Parameter(Mandatory = $true)][string]$PublicKey,
  [Parameter(Mandatory = $true)][string]$PrivateKey,
  [Parameter(Mandatory = $true)][string]$Subject,
  [string]$ProjectRef = "whvjuhldzzyqvzaievqc"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot ".tmp-push-secrets.env"

$lines = @(
  "WEB_PUSH_VAPID_PUBLIC_KEY=$PublicKey",
  "WEB_PUSH_VAPID_PRIVATE_KEY=$PrivateKey",
  "WEB_PUSH_VAPID_SUBJECT=$Subject"
)

$lines -join "`n" | Set-Content -Path $envFile -Encoding utf8

Write-Host "ตั้ง push secrets ..."
npx supabase secrets set --env-file $envFile --project-ref $ProjectRef
Remove-Item -Force $envFile -ErrorAction SilentlyContinue
Write-Host "เสร็จ — ใส่ public key ใน .env: VITE_WEB_PUSH_PUBLIC_KEY=$PublicKey"
