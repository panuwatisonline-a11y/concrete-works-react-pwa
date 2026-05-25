# R2 CORS สำหรับอัปโหลดตรงจากเบราว์เซอร์ (presigned PUT)

เมื่อใช้โหมด R2 แบบ presign มือถือ/เบราว์เซอร์จะ `PUT` ไปที่  
`https://<account_id>.r2.cloudflarestorage.com/<bucket>/...`

ต้องตั้ง **CORS policy** บน bucket `concrete-works`:

1. Cloudflare Dashboard → **R2** → bucket **concrete-works** → **Settings** → **CORS policy**
2. วาง JSON (แก้ `AllowedOrigins` ให้ตรงโดเมนแอป):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://concrete-works-react-pwa.pages.dev"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

เพิ่ม origin ของ Vercel / โดเมนจริงถ้ามี

ถ้าไม่ตั้ง CORS แอปจะ fallback อัปโหลดผ่าน Edge (ช้ากว่า) หรือแสดง error 403/เครือข่าย
