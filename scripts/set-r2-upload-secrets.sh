#!/usr/bin/env bash
# ตั้ง Supabase Edge secrets สำหรับ R2 (S3 Access Key + Secret จาก R2 API token)
# Usage:
#   ./scripts/set-r2-upload-secrets.sh ACCESS_KEY_ID SECRET_ACCESS_KEY \
#     "https://ACCOUNT.r2.cloudflarestorage.com/BUCKET" "https://pub-....r2.dev"

set -euo pipefail

ACCESS_KEY_ID="${1:?Access Key ID}"
SECRET_ACCESS_KEY="${2:?Secret Access Key}"
ENDPOINT="${3:?R2 endpoint (with bucket)}"
PUBLIC_URL="${4:?Public URL}"
PROJECT_REF="${PROJECT_REF:-whvjuhldzzyqvzaievqc}"

ENDPOINT="${ENDPOINT%/}"
PUBLIC_URL="${PUBLIC_URL%/}"

ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT

cat >"$ENV_FILE" <<EOF
R2_ACCESS_KEY_ID=${ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
R2_ENDPOINT=${ENDPOINT}
R2_PUBLIC_URL=${PUBLIC_URL}
EOF

npx supabase secrets set --env-file "$ENV_FILE" --project-ref "$PROJECT_REF"
echo "Done. Run: npm run deploy:upload-drive-image"
