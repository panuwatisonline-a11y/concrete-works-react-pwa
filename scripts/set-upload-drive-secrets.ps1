# ตั้ง Supabase Edge secrets สำหรับ upload-drive-image (Drive API โดยตรง)
# ใช้: .\scripts\set-upload-drive-secrets.ps1 -ServiceAccountJsonPath "C:\Users\User\Downloads\....json"
# ต้อง login ก่อน: npx supabase login

param(
  [Parameter(Mandatory = $true)]
  [string]$ServiceAccountJsonPath,

  [string]$ParentFolderId = "1u-Srk6yn3mSOOZd0Lpl6gVC45XO60OPY",

  [string]$ProjectRef = "whvjuhldzzyqvzaievqc"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot ".tmp-edge-secrets.env"

if (-not (Test-Path $ServiceAccountJsonPath)) {
  Write-Error "ไม่พบไฟล์: $ServiceAccountJsonPath"
}

Write-Host "ตรวจสอบ JSON key ..."
node -e @"
const fs = require('fs');
const p = process.argv[1];
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
if (!j.client_email || !j.private_key) {
  console.error('ต้องมี client_email และ private_key');
  process.exit(1);
}
const min = JSON.stringify(j);
fs.writeFileSync(process.argv[2], 'GOOGLE_SERVICE_ACCOUNT_JSON=' + min + '\nGOOGLE_DRIVE_PARENT_FOLDER_ID=' + process.argv[3] + '\n');
console.log('OK', j.client_email);
"@ $ServiceAccountJsonPath $envFile $ParentFolderId

Write-Host "ลบ GAS secrets (ถ้ามี) ..."
npx supabase secrets unset GAS_UPLOAD_URL GAS_UPLOAD_SECRET --project-ref $ProjectRef 2>$null

Write-Host "ตั้ง GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_DRIVE_PARENT_FOLDER_ID ..."
npx supabase secrets set --env-file $envFile --project-ref $ProjectRef

Remove-Item -Force $envFile -ErrorAction SilentlyContinue
Write-Host "เสร็จ — ลองอัปโหลดรูปในแอป (ไม่ต้อง deploy ใหม่)"
