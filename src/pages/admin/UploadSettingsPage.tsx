import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { APP_HOME } from '@/lib/appHome'
import { useAuthStore } from '@/stores/authStore'
import { canManageUploadSettings } from '@/lib/permissions'
import {
  IMAGE_UPLOAD_PROVIDER_LABEL,
  IMAGE_UPLOAD_PROVIDER_OPTIONS,
  isImageUploadProvider,
  type ImageUploadProvider,
} from '@/lib/imageUploadProvider'
import { app, rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function UploadSettingsPage() {
  const role = useAuthStore((s) => s.role)
  const [provider, setProvider] = useState<ImageUploadProvider>('r2')
  const [savedProvider, setSavedProvider] = useState<ImageUploadProvider>('r2')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('image_upload_provider')
        .eq('id', 1)
        .maybeSingle()

      if (error) {
        console.error('platform_settings load:', error.message)
        toast.error('โหลดการตั้งค่าไม่สำเร็จ')
        return
      }

      const raw = data?.image_upload_provider
      if (isImageUploadProvider(raw)) {
        setProvider(raw)
        setSavedProvider(raw)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (!canManageUploadSettings(role)) {
    return <Navigate to={APP_HOME} replace />
  }

  const dirty = provider !== savedProvider

  async function handleSave() {
    setSaving(true)
    try {
      const { data, error } = await supabase.rpc('set_image_upload_provider', {
        p_provider: provider,
      })
      if (error) {
        console.error('set_image_upload_provider:', error.message)
        toast.error(error.message || 'บันทึกไม่สำเร็จ')
        return
      }
      const next = isImageUploadProvider(data) ? data : provider
      setProvider(next)
      setSavedProvider(next)
      toast.success(`บันทึกแล้ว — อัปโหลดรูปไปที่ ${IMAGE_UPLOAD_PROVIDER_LABEL[next]}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Upload Settings</h1>
      <p className="mt-1 max-w-xl text-sm text-pour-muted">
        เลือกที่เก็บรูปจากแอป (ก่อนเท / หลังเท / บิล) — ใช้ได้ทั้ง Google Drive และ Cloudflare R2
        ตั้งค่า secrets ของปลายทางที่เลือกบน Supabase Edge ก่อนใช้งาน
      </p>

      <div className="mt-6 max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <Label className="text-base font-medium text-zinc-900">ปลายทางอัปโหลดรูป</Label>
        {loading ? (
          <p className="mt-4 text-sm text-pour-muted">กำลังโหลด…</p>
        ) : (
          <fieldset className="mt-4 space-y-3" disabled={saving}>
            <legend className="sr-only">ปลายทางอัปโหลดรูป</legend>
            {IMAGE_UPLOAD_PROVIDER_OPTIONS.map((id) => (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
                  provider === id
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 hover:border-zinc-400',
                )}
              >
                <input
                  type="radio"
                  name="image_upload_provider"
                  value={id}
                  checked={provider === id}
                  onChange={() => setProvider(id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-zinc-900">
                    {IMAGE_UPLOAD_PROVIDER_LABEL[id]}
                  </span>
                  <span className="mt-0.5 block text-sm text-pour-muted">
                    {id === 'google_drive'
                      ? 'OAuth + โฟลเดอร์ Drive (secrets เดิม)'
                      : 'R2_ENDPOINT + R2_PUBLIC_URL + S3 Access Key (R2 API token)'}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" disabled={loading || saving || !dirty} onClick={() => void handleSave()}>
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
          {!loading && (
            <span className="text-sm text-pour-muted">
              ใช้งานอยู่: <strong>{IMAGE_UPLOAD_PROVIDER_LABEL[savedProvider]}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
