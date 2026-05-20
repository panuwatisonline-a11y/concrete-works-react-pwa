#!/usr/bin/env bash
# Deploy Web Push stack (migrations + edge functions)
# ต้อง: supabase login หรือ SUPABASE_ACCESS_TOKEN
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT_REF="${SUPABASE_PROJECT_REF:-whvjuhldzzyqvzaievqc}"

echo "==> Link project (ถ้ายังไม่ link)"
npx supabase link --project-ref "$PROJECT_REF" || true

echo "==> Push migrations"
npx supabase db push --linked --yes

echo "==> Deploy edge functions"
npx supabase functions deploy send-push --project-ref "$PROJECT_REF"
npx supabase functions deploy notify-request-change --project-ref "$PROJECT_REF"

echo "==> ตั้ง VAPID secrets (ถ้ายังไม่ตั้ง):"
echo "    npx web-push generate-vapid-keys"
echo "    npx supabase secrets set --project-ref $PROJECT_REF \\"
echo "      WEB_PUSH_VAPID_PUBLIC_KEY=... \\"
echo "      WEB_PUSH_VAPID_PRIVATE_KEY=... \\"
echo "      WEB_PUSH_VAPID_SUBJECT=mailto:admin@yourdomain.com"
echo "เสร็จ"
