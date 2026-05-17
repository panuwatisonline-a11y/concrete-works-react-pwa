import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'
import { CST_AGE_COLUMN_LABELS } from '@/components/cst/CstAgeColumnCell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SELECT_CONTENT_ELEVATED_Z,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchCompressionMachines } from '@/lib/cstData'
import { localPrintCstBlankReport, normalizeCstTestAges } from '@/lib/cstPrint'
import { ICON_STROKE, layout } from '@/lib/requestUi'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { CST_TEST_AGES, type CstTestAge, type RequestWithRelations } from '@/types/app.types'
import { cn } from '@/lib/utils'

const BLANK_MACHINE_STORAGE_KEY = 'cst-blank-print-machine-id'
const BLANK_MACHINE_NONE = '__none__'

type CstBlankPrintButtonProps = {
  request: RequestWithRelations
  className?: string
}

/** ปุ่มพิมพ์แบบฟอร์ม CST ว่าง — เลือกเครื่องกด + หลายอายุ แล้วเปิดแท็บพิมพ์ต่อกันหลายหน้า */
export function CstBlankPrintButton({ request, className }: CstBlankPrintButtonProps) {
  const compressionMachines = useMasterDataStore((s) => s.compressionMachines)
  const setMasterPartial = useMasterDataStore((s) => s.setAll)

  const [open, setOpen] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [selected, setSelected] = useState<Set<CstTestAge>>(new Set())
  const [machineId, setMachineId] = useState('')

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      return
    }
    const saved = sessionStorage.getItem(BLANK_MACHINE_STORAGE_KEY)
    if (saved && compressionMachines.some((m) => String(m.id) === saved)) {
      setMachineId(saved)
    }
  }, [open, compressionMachines])

  useEffect(() => {
    if (!open || compressionMachines.length > 0) return
    void fetchCompressionMachines()
      .then((rows) => setMasterPartial({ compressionMachines: rows }))
      .catch(() => toast.error('โหลดรายการเครื่องอัดไม่สำเร็จ'))
  }, [open, compressionMachines.length, setMasterPartial])

  function toggleAge(age: CstTestAge) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(age)) next.delete(age)
      else next.add(age)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(CST_TEST_AGES))
  }

  function handlePrint() {
    const ages = normalizeCstTestAges(selected)
    if (!ages.length) {
      toast.error('เลือกอายุตัวอย่างอย่างน้อย 1 รายการ')
      return
    }
    const mid = Number(machineId)
    const machineIdOpt =
      machineId && Number.isFinite(mid) && mid > 0 ? mid : undefined
    setPrinting(true)
    try {
      if (machineIdOpt != null) {
        sessionStorage.setItem(BLANK_MACHINE_STORAGE_KEY, String(machineIdOpt))
      } else {
        sessionStorage.removeItem(BLANK_MACHINE_STORAGE_KEY)
      }
      localPrintCstBlankReport(request, ages, machineIdOpt)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เปิดแบบฟอร์มว่างไม่สำเร็จ')
    } finally {
      setPrinting(false)
    }
  }

  const count = selected.size
  const canPrint = count > 0

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('h-6 w-6 min-h-6 min-w-6 shrink-0 p-0', className)}
        title="พิมพ์แบบฟอร์มว่างสำหรับแล็บ"
        aria-label="พิมพ์แบบฟอร์ม CST ว่าง"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <Printer className="h-3.5 w-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="text-base">พิมพ์แบบฟอร์มว่าง</DialogTitle>
            <DialogDescription className="text-sm text-pour-muted">
              เลือกอายุตัวอย่าง (แต่ละอายุหนึ่งหน้า) — เครื่องอัดเลือกได้ถ้ารู้แล้ว หรือเว้นว่างเมื่อพิมพ์ล่วงหน้า
            </DialogDescription>
          </DialogHeader>

          <div className={layout.formField}>
            <Label>เครื่องอัด (ไม่บังคับ)</Label>
            {compressionMachines.length === 0 ? (
              <p className="text-xs text-pour-muted">ยังไม่มีเครื่องในระบบ — พิมพ์ได้โดยเว้นช่องเครื่องว่าง</p>
            ) : (
              <Select
                value={machineId || BLANK_MACHINE_NONE}
                onValueChange={(v) => setMachineId(v === BLANK_MACHINE_NONE ? '' : v)}
                disabled={printing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ไม่ระบุ" />
                </SelectTrigger>
                <SelectContent className={cn(SELECT_CONTENT_ELEVATED_Z, 'max-h-48')}>
                  <SelectItem value={BLANK_MACHINE_NONE}>ไม่ระบุ — เว้นว่าง</SelectItem>
                  {compressionMachines.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.machine?.trim() || `เครื่อง #${m.id}`}
                      {m.k_display ? ` · ${m.k_display}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-pour-muted">
              {count > 0 ? `เลือกแล้ว ${count} อายุ` : 'ยังไม่ได้เลือกอายุ'}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={printing}
              onClick={selectAll}
            >
              เลือกทั้งหมด
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CST_TEST_AGES.map((age) => {
              const on = selected.has(age)
              return (
                <Button
                  key={age}
                  type="button"
                  variant={on ? 'default' : 'outline'}
                  className={cn(
                    'h-10 justify-center font-semibold tabular-nums',
                    on && 'ring-2 ring-[color:var(--pour-accent-ring)] ring-offset-1',
                  )}
                  disabled={printing}
                  aria-pressed={on}
                  onClick={() => toggleAge(age)}
                >
                  {CST_AGE_COLUMN_LABELS[age]}
                </Button>
              )
            })}
          </div>

          <Button type="button" className="w-full" disabled={printing || !canPrint} onClick={handlePrint}>
            {printing ? 'กำลังเปิด…' : count > 0 ? `พิมพ์ ${count} หน้า` : 'พิมพ์'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
