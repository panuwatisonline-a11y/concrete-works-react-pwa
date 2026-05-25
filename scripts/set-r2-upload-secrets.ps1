# ตั้ง Supabase Edge secrets สำหรับ upload-drive-image (Cloudflare R2 / S3 API)
# ต้องใช้ R2 API token แบบ S3 (Access Key ID + Secret) ไม่ใช่ Cloudflare API token (cfat_...)
# สร้างที่: Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API token
#
# ใช้:
#   .\scripts\set-r2-upload-secrets.ps1 `
#     -AccessKeyId "..." -SecretAccessKey "..." `
#     -Endpoint "https://ACCOUNT_ID.r2.cloudflarestorage.com/BUCKET" `
#     -PublicUrl "https://pub-....r2.dev"

param(
  [Parameter(Mandatory = $true)]
  [string]$AccessKeyId,

  [Parameter(Mandatory = $true)]
  [string]$SecretAccessKey,

  [Parameter(Mandatory = $true)]
  [string]$Endpoint,

  [Parameter(Mandatory = $true)]
  [string]$PublicUrl,

  [string]$ProjectRef = "whvjuhldzzyqvzaievqc"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot ".tmp-r2-edge-secrets.env"

$endpoint = $Endpoint.Trim().TrimEnd('/')
$publicUrl = $PublicUrl.Trim().TrimEnd('/')
$accessKeyId = $AccessKeyId.Trim()
$secretAccessKey = $SecretAccessKey.Trim()

if (-not $endpoint -or -not $publicUrl) {
  Write-Error "Endpoint และ PublicUrl ต้องไม่ว่าง"
}
if ($accessKeyId.Length -ne 32) {
  Write-Error "Access Key ID ต้องยาว 32 ตัวอักษร (ได้ $($accessKeyId.Length)) — ไม่ใช่ cfat_ API token"
}
if ($accessKeyId.StartsWith('cfat_') -or $secretAccessKey.StartsWith('cfat_')) {
  Write-Error "อย่าใช้ Cloudflare API token (cfat_...) — ใช้ R2 → Manage R2 API Tokens (S3)"
}

@"
R2_ACCESS_KEY_ID=$accessKeyId
R2_SECRET_ACCESS_KEY=$secretAccessKey
R2_ENDPOINT=$endpoint
R2_PUBLIC_URL=$publicUrl
"@ | Set-Content -Path $envFile -Encoding utf8NoBOM

Write-Host "ตั้ง R2 secrets บน Supabase (project $ProjectRef) ..."
npx supabase secrets set --env-file $envFile --project-ref $ProjectRef

Remove-Item -Force $envFile -ErrorAction SilentlyContinue
Write-Host "เสร็จ — รัน npm run deploy:upload-drive-image แล้วเลือก R2 ใน Admin → Upload Settings"
