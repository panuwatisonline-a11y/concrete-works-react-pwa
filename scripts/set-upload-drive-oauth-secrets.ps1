# ตั้ง OAuth + โฟลเดอร์ Drive แยก Before / After / Bill
# ใช้: .\scripts\set-upload-drive-oauth-secrets.ps1 -ClientId "..." -ClientSecret "..." -RefreshToken "..." `
#        -BeforeFolderId "..." -AfterFolderId "..." -BillFolderId "..."

param(
  [string]$ClientId,
  [string]$ClientSecret,
  [string]$RefreshToken,
  [string]$OAuthJsonPath,
  [string]$BeforeFolderId = "",
  [string]$AfterFolderId = "",
  [string]$BillFolderId = "",
  [string]$FolderId = "",
  [string]$ProjectRef = "whvjuhldzzyqvzaievqc"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot ".tmp-edge-secrets.env"

if ($OAuthJsonPath) {
  if (-not (Test-Path $OAuthJsonPath)) { Write-Error "ไม่พบ: $OAuthJsonPath" }
  $o = Get-Content -Raw $OAuthJsonPath | ConvertFrom-Json
  $ClientId = $o.client_id
  $ClientSecret = $o.client_secret
  $RefreshToken = $o.refresh_token
}

if (-not $ClientId -or -not $ClientSecret -or -not $RefreshToken) {
  Write-Error "ต้องระบุ ClientId, ClientSecret, RefreshToken หรือ -OAuthJsonPath"
}

$lines = @(
  "GOOGLE_CLIENT_ID=$ClientId",
  "GOOGLE_CLIENT_SECRET=$ClientSecret",
  "GOOGLE_REFRESH_TOKEN=$RefreshToken"
)
if ($BeforeFolderId) { $lines += "GOOGLE_DRIVE_FOLDER_ID_BEFORE=$BeforeFolderId" }
if ($AfterFolderId) { $lines += "GOOGLE_DRIVE_FOLDER_ID_AFTER=$AfterFolderId" }
if ($BillFolderId) { $lines += "GOOGLE_DRIVE_FOLDER_ID_BILL=$BillFolderId" }
if ($FolderId) { $lines += "GOOGLE_DRIVE_FOLDER_ID=$FolderId" }

$lines -join "`n" | Set-Content -Path $envFile -Encoding utf8

Write-Host "ตั้ง secrets ..."
npx supabase secrets set --env-file $envFile --project-ref $ProjectRef
Remove-Item -Force $envFile -ErrorAction SilentlyContinue
Write-Host "เสร็จ — รัน: npm run deploy:upload-drive-image (ถ้าแก้โค้ด function)"
