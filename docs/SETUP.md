# คู่มือติดตั้ง · ตั้งค่า · ย้าย · Deploy

คู่มือนี้ครอบคลุมการรัน **Concrete Works** (React PWA + Supabase) ตั้งแต่เครื่องพัฒนา การตั้งค่าบริการภายนอก การย้าย GitHub repo / ฐานข้อมูล และการ deploy ไป Cloudflare Pages / Vercel

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [ความต้องการของระบบ](#2-ความต้องการของระบบ)
3. [ติดตั้งรันบนเครื่อง (local)](#3-ติดตั้งรันบนเครื่อง-local)
4. [รายการตัวแปรและ secrets](#4-รายการตัวแปรและ-secrets)
5. [ตั้งค่า Supabase](#5-ตั้งค่า-supabase)
6. [ตั้งค่า Web Push](#6-ตั้งค่า-web-push)
7. [ตั้งค่าอัปโหลดรูป (Drive / R2)](#7-ตั้งค่าอัปโหลดรูป-drive--r2)
8. [Deploy frontend](#8-deploy-frontend)
9. [GitHub Actions และ secrets](#9-github-actions-และ-secrets)
10. [ย้าย GitHub repository](#10-ย้าย-github-repository)
11. [ย้าย / สร้าง Supabase project ใหม่](#11-ย้าย--สร้าง-supabase-project-ใหม่)
12. [เช็กลิสต์หลังย้าย](#12-เช็กลิสต์หลังย้าย)
13. [แก้ปัญหาที่พบบ่อย](#13-แก้ปัญหาที่พบบ่อย)

---

## 1. ภาพรวมระบบ

| ส่วน | เทคโนโลยี | หมายเหตุ |
|------|-----------|----------|
| Frontend | Vite + React + PWA | ตัวแปร `VITE_*` ถูก bake ตอน build |
| Backend / DB / Auth | Supabase (Postgres, Auth, Realtime, Edge Functions) | RLS เป็นตัวคุมสิทธิ์ |
| Host หลัก | Cloudflare Pages | `wrangler.toml` → project `concrete-works-react-pwa` |
| Host สำรอง | Vercel | `vercel.json` region `sin1` |
| เก็บรูป | Google Drive หรือ Cloudflare R2 | เลือกในแอป: Admin → Upload Settings |
| Push | Web Push (VAPID) + Edge `send-push` / `notify-request-change` | |

**Project ref ปัจจุบัน (hardcode ในบางสคริปต์):** `whvjuhldzzyqvzaievqc`  
เมื่อย้าย database ต้องอัปเดตค่านี้ใน `package.json` และสคริปต์ deploy/secrets หรือตั้ง `SUPABASE_PROJECT_REF`

---

## 2. ความต้องการของระบบ

- **Node.js 22** (ตรงกับ CI)
- npm
- บัญชี [Supabase](https://supabase.com)
- (แนะนำ) [Supabase CLI](https://supabase.com/docs/guides/cli) — `npx supabase` ใช้ได้โดยไม่ต้องติดตั้งถาวร
- (deploy) Cloudflare account + API token และ/หรือ Vercel account
- (optional) PowerShell — สคริปต์ตั้ง secrets บางตัวเป็น `.ps1` (มี `.sh` คู่กันบางส่วน)

---

## 3. ติดตั้งรันบนเครื่อง (local)

```bash
git clone <repo-url>
cd concrete-works-react-pwa
npm ci
cp .env.example .env
```

แก้ `.env` ให้ครบอย่างน้อย:

```env
VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WEB_PUSH_PUBLIC_KEY=your-vapid-public-key
```

รัน:

```bash
npm run dev
```

เปิด `http://localhost:5173`

คำสั่งอื่นที่ใช้บ่อย:

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run build` | เขียน `.env.production` แล้ว build (`scripts/write-env-production.mjs`) |
| `npm run preview` | ดู build ในเครื่อง |
| `npm run lint` | ESLint |
| `npm run deploy:pages` | build + deploy Cloudflare Pages |
| `npm run deploy:vercel` | deploy Vercel production |
| `npm run deploy:all` | Pages + Vercel |
| `npm run deploy:push-stack` | migrations + functions ที่เกี่ยวกับ push |

**หมายเหตุ build:** `npm run build` อ่าน `VITE_*` จาก environment ก่อน ถ้าไม่มีจะ fallback จาก `env/production.env` (อย่า commit ค่า production จริงลง git ถ้าเป็นความลับเพิ่มเติม — anon key เป็น public ตามออกแบบ แต่ควรจัดการ repo ตามนโยบายทีม)

---

## 4. รายการตัวแปรและ secrets

### 4.1 Frontend (public ตอน build) — ใส่ใน `.env` / GitHub Secrets / host build env

| ชื่อ | ใช้ทำอะไร |
|------|-----------|
| `VITE_SUPABASE_URL` | URL โปรเจกต์ Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key (ปลอดภัยภายใต้ RLS) |
| `VITE_WEB_PUSH_PUBLIC_KEY` | VAPID public key สำหรับสมัคร push |

ตัวอย่าง: `.env.example`, `env/production.env.example`

### 4.2 Supabase Edge Function secrets (ไม่ใส่ใน `.env` ของ Vite)

ตั้งด้วย Dashboard → Edge Functions → Secrets หรือ `npx supabase secrets set --project-ref <REF> ...`

#### ร่วม / พื้นฐาน

| ชื่อ | ใช้กับ |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | อ่าน `platform_settings` ใน upload function (มักมีในโปรเจกต์อยู่แล้ว) |

#### Web Push (`send-push`, `notify-request-change`)

| ชื่อ | หมายเหตุ |
|------|----------|
| `WEB_PUSH_VAPID_PUBLIC_KEY` | ต้องคู่กับ `VITE_WEB_PUSH_PUBLIC_KEY` |
| `WEB_PUSH_VAPID_PRIVATE_KEY` | เก็บเฉพาะฝั่ง Edge |
| `WEB_PUSH_VAPID_SUBJECT` | เช่น `mailto:admin@yourdomain.com` |
| `PUSH_INTERNAL_SECRET` | (optional) เรียก notify จากภายใน |

สคริปต์ช่วย: `npm run secrets:push-vapid` / `npm run secrets:push-vapid:sh`

#### Google Drive (`upload-drive-image`)

| ชื่อ |
|------|
| `GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` |
| `GOOGLE_REFRESH_TOKEN` |
| `GOOGLE_DRIVE_FOLDER_ID_BEFORE` |
| `GOOGLE_DRIVE_FOLDER_ID_AFTER` |
| `GOOGLE_DRIVE_FOLDER_ID_BILL` |
| `GOOGLE_DRIVE_FOLDER_ID` (optional fallback) |

สคริปต์: `npm run secrets:upload-drive-oauth`

#### Cloudflare R2 (`upload-drive-image`)

| ชื่อ | หมายเหตุ |
|------|----------|
| `R2_ACCESS_KEY_ID` | R2 API Token (S3) — ไม่ใช่ `cfat_...` |
| `R2_SECRET_ACCESS_KEY` | |
| `R2_ENDPOINT` | เช่น `https://{account_id}.r2.cloudflarestorage.com/concrete-works` |
| `R2_PUBLIC_URL` | URL สาธารณะของ object |
| หรือ `R2_ACCOUNT_ID` + `R2_BUCKET_NAME` | แทน `R2_ENDPOINT` |

สคริปต์: `npm run secrets:r2-upload`  
CORS: ดู [r2-cors.md](./r2-cors.md)

### 4.3 GitHub Actions secrets (deploy + keepalive)

| ชื่อ | ใช้ใน workflow |
|------|----------------|
| `VITE_SUPABASE_URL` | Cloudflare Pages, Vercel, Supabase keepalive |
| `VITE_SUPABASE_ANON_KEY` | เหมือนด้านบน |
| `VITE_WEB_PUSH_PUBLIC_KEY` | build frontend |
| `CLOUDFLARE_API_TOKEN` | deploy Pages |
| `CLOUDFLARE_ACCOUNT_ID` | deploy Pages |
| `VERCEL_TOKEN` | deploy Vercel (ถ้าว่าง จะข้าม step) |
| `VERCEL_ORG_ID` | |
| `VERCEL_PROJECT_ID` | |

---

## 5. ตั้งค่า Supabase

### 5.1 สร้าง / ใช้โปรเจกต์

1. สร้างโปรเจกต์ใน Supabase Dashboard
2. คัดลอก **Project URL** และ **anon public** key → ใส่ `VITE_*`
3. ติดตั้ง CLI แล้ว login:

```bash
npx supabase login
npx supabase link --project-ref <YOUR_REF>
```

### 5.2 Migrations

ไฟล์อยู่ใน `supabase/migrations/`. ดันขึ้น remote:

```bash
npx supabase db push --linked --yes
```

หรือใช้:

```bash
npm run deploy:push-stack   # push migrations + deploy send-push / notify-request-change
```

Realtime: migration `20260519120000_enable_realtime_publication.sql` (หรือเปิดใน Dashboard → Database → Replication)

### 5.3 Auth (Google OAuth)

แอปใช้ `signInWithOAuth` แล้ว `redirectTo` กลับที่ `window.location.origin/`

ใน Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** โดเมนหลักของแอป (เช่น `https://concrete-works-react-pwa.pages.dev` หรือ custom domain)
- **Redirect URLs:** ใส่ทุก origin ที่ใช้จริง เช่น
  - `http://localhost:5173/**`
  - `https://concrete-works-react-pwa.pages.dev/**`
  - `https://<your-vercel-app>.vercel.app/**`
  - custom domain ถ้ามี

เปิด Google provider แล้วใส่ Client ID/Secret จาก Google Cloud Console

### 5.4 Edge Functions

Deploy:

```bash
# อัปโหลดรูป
npm run deploy:upload-drive-image

# Push
npm run deploy:send-push
npm run deploy:notify-request-change
```

หรือทั้งชุด push:

```bash
SUPABASE_PROJECT_REF=<YOUR_REF> npm run deploy:push-stack
```

ใน `package.json` สคริปต์ deploy ชี้ `--project-ref` คงที่ — ย้ายโปรเจกต์แล้วต้องแก้ หรือเรียก CLI เองพร้อม ref ใหม่

`supabase/config.toml` ตั้ง `verify_jwt = true` สำหรับทั้งสาม functions

### 5.5 Keepalive (กัน pause จาก inactivity)

Workflow: `.github/workflows/supabase-keepalive.yml`  
เรียก RPC `keepalive_ping` (เขียน timestamp จริงใน Postgres) วันละ 2 ครั้ง — ต้องการ secrets `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`  
Migration: `supabase/migrations/20261104084252_keepalive_ping.sql` (ต้อง `db push` หลัง Resume โปรเจกต์)

---

## 6. ตั้งค่า Web Push

1. สร้างคีย์:

```bash
npx web-push generate-vapid-keys
```

2. ใส่ **public** → `VITE_WEB_PUSH_PUBLIC_KEY` (frontend + GitHub Secrets + rebuild)
3. ใส่ **public + private + subject** → Edge secrets (`WEB_PUSH_VAPID_*`)
4. Deploy functions + ตรวจว่า migration push subscriptions / notify events ถูก apply แล้ว
5. ทดสอบบน HTTPS หรือ localhost (ต้อง permission จากเบราว์เซอร์)

---

## 7. ตั้งค่าอัปโหลดรูป (Drive / R2)

1. ตั้ง Edge secrets ตามปลายทางที่ใช้ (Drive และ/หรือ R2)
2. Deploy `upload-drive-image`
3. เข้าแอปด้วยบัญชี **super_admin** → **Admin → Upload Settings** เลือกปลายทาง
4. ถ้าใช้ R2 แบบ presigned PUT จากเบราว์เซอร์ → ตั้ง CORS ตาม [r2-cors.md](./r2-cors.md) ให้ครบทุก origin (local, Pages, Vercel, custom domain)

---

## 8. Deploy frontend

### 8.1 อัตโนมัติ (แนะนำ)

Push ไป `main` จะรัน:

- `.github/workflows/cloudflare-pages.yml`
- `.github/workflows/vercel-production.yml`

Build ใช้ `VITE_*` จาก GitHub Secrets

### 8.2 ด้วยมือ

```bash
# ต้องมี VITE_* ใน env หรือใน env/production.env
npm run deploy:pages
npm run deploy:vercel
# หรือ
npm run deploy:all
```

Cloudflare: ต้อง login wrangler / มีสิทธิ์ใน account  
Pages project name: `concrete-works-react-pwa` (`wrangler.toml`)

Vercel: ต้องมีลิงก์โปรเจกต์ (`VERCEL_*` หรือ `npx vercel` ครั้งแรก)

### 8.3 Preview

```bash
npm run deploy:pages:preview
```

### 8.4 หลังเปลี่ยน env

`VITE_*` ถูกฝังตอน build — **ต้อง Redeploy** หลังเปลี่ยน URL/key/VAPID public  
แอปมีข้อความเตือนเมื่อ build โดยไม่มีค่าครบ

---

## 9. GitHub Actions และ secrets

### Workflows ใน repo

| ไฟล์ | หน้าที่ |
|------|---------|
| `cloudflare-pages.yml` | Deploy Pages เมื่อ push `main` |
| `vercel-production.yml` | Deploy Vercel เมื่อ push `main` |
| `supabase-keepalive.yml` | RPC write ไป Postgres วันละ 2 ครั้ง (กัน Free Plan pause) |
| `actions-keepalive.yml` | Empty commit บน branch `keepalive` ทุกเดือน — กัน GitHub ปิด scheduled Actions หลัง ~60 วันไม่มี activity |

### สิทธิ์ที่ต้องมีเมื่อย้าย repo

- Settings → Secrets and variables → Actions: คัดลอก secrets ทั้งหมดจากตารางในหัวข้อ 4.3
- Cloudflare API token ต้องยังใช้ได้กับ account เดิม (หรือสร้างใหม่)
- Vercel: สร้าง token ใหม่และผูก `ORG_ID` / `PROJECT_ID` ของโปรเจกต์ปลายทาง
- สำหรับ `actions-keepalive`: workflow ใช้ `permissions: contents: write` ของ `GITHUB_TOKEN` — ไม่ต้อง secret พิเศษ แต่ต้องไม่ปิด Actions / ไม่จำกัด token จน push ไม่ได้

---

## 10. ย้าย GitHub repository

1. สร้าง repo ใหม่ (ว่างหรือ import)
2. Push โค้ด:

```bash
git remote set-url origin <NEW_REPO_URL>
git push -u origin main
git push origin keepalive   # ถ้ามี branch keepalive อยู่แล้ว
```

3. คัดลอก **Actions secrets** ทั้งหมดไป repo ใหม่
4. ตรวจว่า Actions เปิดอยู่ และรัน `Deploy Cloudflare Pages` / `Actions keepalive` ด้วย **Run workflow** สักครั้ง
5. อัปเดตลิงก์ในเอกสาร / Google OAuth / R2 CORS ถ้า URL แอปเปลี่ยน
6. (ถ้ามี) ยกเลิก webhook / integration เก่าบน Cloudflare/Vercel ที่ชี้ repo เดิม แล้วเชื่อม repo ใหม่ตามที่ host รองรับ  
   - โปรเจกต์นี้ deploy ผ่าน **GitHub Actions + token** เป็นหลัก ไม่จำเป็นต้องผูก Git integration ของ Pages/Vercel ซ้ำ ถ้ายังใช้ workflow เดิม

**สิ่งที่ไม่ย้ายตาม git อัตโนมัติ:** Supabase project, R2 bucket, Google OAuth client, Vercel/Cloudflare project — ต้องชี้ค่าใหม่ใน secrets และ dashboard

---

## 11. ย้าย / สร้าง Supabase project ใหม่

ใช้เมื่อสร้างโปรเจกต์ Supabase ใหม่ หรือย้ายไป org/region อื่น

### 11.1 สร้างโปรเจกต์ใหม่

1. สร้าง project → ได้ `project-ref`, URL, anon key, service role key
2. Link และดัน schema:

```bash
export SUPABASE_PROJECT_REF=<NEW_REF>
npx supabase login
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase db push --linked --yes
```

3. ตั้ง Auth (Google + Site URL + Redirect URLs) ตามโดเมนแอปปัจจุบัน
4. ตั้ง Edge secrets ทั้งหมดใหม่ (VAPID, Drive/R2, service role ถ้าจำเป็น)
5. Deploy functions:

```bash
npx supabase functions deploy upload-drive-image --project-ref "$SUPABASE_PROJECT_REF"
npx supabase functions deploy send-push --project-ref "$SUPABASE_PROJECT_REF"
npx supabase functions deploy notify-request-change --project-ref "$SUPABASE_PROJECT_REF"
```

6. อัปเดต frontend env + GitHub Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- (VAPID public ถ้าสร้างคีย์ชุดใหม่)

7. **แก้ hardcode project-ref** ใน repo ให้ชี้ ref ใหม่:

- `package.json` → `deploy:upload-drive-image`, `deploy:send-push`, `deploy:notify-request-change`
- สคริปต์ใน `scripts/` ที่ default เป็น ref เก่า (`deploy-push-stack.sh`, `set-*-secrets.*`)

8. Redeploy frontend (push `main` หรือ `npm run deploy:all`)
9. ย้ายข้อมูล (ถ้าต้องการ): ใช้ Supabase backup/restore, `pg_dump`/`psql`, หรือเครื่องมือ migrate ของทีม — **migrations สร้าง schema ไม่ได้คัดลอกข้อมูลผู้ใช้/คำขอให้อัตโนมัติ**
10. ทดสอบ login, อัปโหลดรูป, push, realtime

### 11.2 ย้ายเฉพาะข้อมูล (schema เดิม)

- Export จากโปรเจกต์เก่า → import เข้าใหม่หลัง `db push`
- ระวัง `auth.users` กับตาราง `profiles` ต้องสอดคล้องกัน
- หลังย้าย ตรวจ RLS และ role (`user`, `engineer`, `inspector`, `document`, `admin`, `super_admin`)

### 11.3 สิ่งที่ควรทำคู่กันเมื่อเปลี่ยน URL แอปหรือ DB

| จุดที่ต้องอัปเดต | ทำไม |
|------------------|------|
| Supabase Auth redirect URLs | OAuth กลับไม่ถึงแอป |
| R2 CORS `AllowedOrigins` | Presigned upload โดนบล็อก |
| Google Cloud OAuth authorized origins/redirects | Login Google พัง |
| GitHub Secrets + Redeploy | Frontend ยังชี้ DB เก่า |
| Edge secrets + redeploy functions | Upload/push ยังใช้ค่าเก่า |
| `supabase-keepalive` secrets | Ping ผิดโปรเจกต์ |

---

## 12. เช็กลิสต์หลังย้าย

ใช้หลังย้าย repo และ/หรือ database

- [ ] `npm ci && npm run dev` ล็อกอินได้บน localhost
- [ ] `npx supabase db push` สำเร็จ ไม่มี migration ค้าง
- [ ] Edge functions ทั้ง 3  deploy แล้วและตอบ 2xx (พร้อม JWT)
- [ ] Edge secrets ครบตามปลายทางอัปโหลด + VAPID
- [ ] GitHub Secrets ครบและ workflow Pages/Vercel สีเขียว
- [ ] `Actions keepalive` และ `Supabase keepalive` รันมือได้สำเร็จ
- [ ] Auth redirect / Site URL ตรงโดเมนจริง
- [ ] R2 CORS รวมทุก origin ที่ใช้
- [ ] Admin → Upload Settings เลือกปลายทางถูกต้อง
- [ ] สมัคร Web Push บนมือถือ/เดสก์ท็อปได้
- [ ] `package.json` / สคริปต์ไม่ชี้ `project-ref` เก่า
- [ ] ผู้ใช้ `super_admin` คนแรกพร้อมอนุมัติคนอื่น

---

## 13. แก้ปัญหาที่พบบ่อย

| อาการ | แนวทาง |
|-------|--------|
| หน้าแอปบอกว่าไม่ได้ตั้ง Supabase | ขาด `VITE_*` ตอน build → ใส่ secrets แล้ว **Redeploy** |
| Login Google แล้วเด้งผิดที่ / error redirect | เพิ่ม origin ใน Supabase Redirect URLs และ Google Console |
| อัปโหลดรูป 403 / CORS | ตั้ง R2 CORS ตาม [r2-cors.md](./r2-cors.md) หรือ fallback ผ่าน Edge |
| Push ไม่มา | ตรวจคู่ VAPID public/private, deploy `send-push`, permission เบราว์เซอร์, HTTPS |
| Scheduled Actions หายไป | รัน `Actions keepalive` หรือ commit อะไรก็ได้; ตรวจว่า Actions ไม่ถูก disable |
| Supabase พักบนแผนฟรี | Resume ใน Dashboard ก่อน แล้ว `supabase db push` + รัน `Supabase keepalive`; ตรวจว่า RPC `keepalive_ping` ใช้ได้ |
| Deploy Vercel ข้าม step | ไม่ได้ตั้ง `VERCEL_TOKEN` — ตั้งครบ `VERCEL_*` สามตัว |
| `db push` / functions deploy ชี้โปรเจกต์ผิด | ตรวจ `supabase link` และ `--project-ref` |

---

## อ้างอิงไฟล์ใน repo

| ไฟล์ | เนื้อหา |
|------|---------|
| `.env.example` | ตัวแปร local + หมายเหตุ Edge secrets |
| `env/production.env.example` | ตัวอย่าง `VITE_*` สำหรับ production build |
| `wrangler.toml` | Cloudflare Pages project |
| `vercel.json` | Vercel build / SPA rewrite / PWA headers |
| `docs/r2-cors.md` | CORS สำหรับ R2 presigned upload |
| `supabase/migrations/` | Schema และ RLS |
| `supabase/functions/` | `upload-drive-image`, `send-push`, `notify-request-change` |
| `.github/workflows/` | Deploy + keepalive |
