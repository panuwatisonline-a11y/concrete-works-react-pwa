# Concrete Works (React PWA)

ระบบจัดการคำขอคอนกรีตและคุณภาพ (CST) สำหรับหน้างานและสำนักงาน — React + Vite + Supabase + PWA

Deploy อัตโนมัติไป **Cloudflare Pages** และ **Vercel** เมื่อ push `main`

## เริ่มเร็ว

```bash
npm ci
cp .env.example .env
# ใส่ VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_WEB_PUSH_PUBLIC_KEY
npm run dev
```

## คู่มือติดตั้งและย้ายระบบ

เอกสารครบวงจร (ติดตั้ง, secrets, Supabase, Push, Drive/R2, deploy, ย้าย repo / database):

**[docs/SETUP.md](./docs/SETUP.md)**

เอกสารอื่น:

- [docs/r2-cors.md](./docs/r2-cors.md) — CORS สำหรับ Cloudflare R2
- [PRODUCT.md](./PRODUCT.md) — บริบทผลิตภัณฑ์
- [DESIGN.md](./DESIGN.md) — ทิศทางดีไซน์

## สคริปต์หลัก

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | พัฒนา local |
| `npm run build` | Production build |
| `npm run deploy:pages` | Deploy Cloudflare Pages |
| `npm run deploy:vercel` | Deploy Vercel |
| `npm run deploy:all` | Pages + Vercel |
| `npm run deploy:push-stack` | Migrations + push Edge Functions |
