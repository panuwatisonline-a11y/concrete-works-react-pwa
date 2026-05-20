#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT_REF="${SUPABASE_PROJECT_REF:-whvjuhldzzyqvzaievqc}"
ENV_FILE="${1:-.tmp-push-secrets.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ไม่พบ $ENV_FILE — สร้างจาก npx web-push generate-vapid-keys ก่อน"
  exit 1
fi

echo "ตั้ง Edge secrets จาก $ENV_FILE ..."
npx supabase secrets set --env-file "$ENV_FILE" --project-ref "$PROJECT_REF"
echo "เสร็จ — ตรวจใน Dashboard → Edge Functions → Secrets"
