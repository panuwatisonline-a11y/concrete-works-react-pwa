import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { REQUEST_LIST_SEARCH_PLACEHOLDER } from '@/lib/desktopTopBarSearch'
import { modal } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/stores/filterStore'
import { useMasterDataStore } from '@/stores/masterDataStore'

export function RequestFiltersDialog() {
  const { filter, setFilter, resetFilter, requestFiltersOpen, setRequestFiltersOpen } = useFilterStore()
  const { statuses, isLoaded: masterLoaded } = useMasterDataStore()

  const toggleStatus = (sid: number) => {
    const ids = filter.status_ids.includes(sid)
      ? filter.status_ids.filter((x) => x !== sid)
      : [...filter.status_ids, sid]
    setFilter({ status_ids: ids })
  }

  return (
    <Dialog open={requestFiltersOpen} onOpenChange={setRequestFiltersOpen}>
      <DialogContent className={cn(modal.md, 'max-h-[min(90dvh,720px)] overflow-y-auto')}>
        <DialogHeader>
          <DialogTitle>ค้นหาและตัวกรอง</DialogTitle>
        </DialogHeader>

        {!masterLoaded ? (
          <p className="py-8 text-center text-sm text-pour-muted">กำลังโหลดข้อมูลอ้างอิง…</p>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <Input
                type="search"
                autoComplete="off"
                placeholder={REQUEST_LIST_SEARCH_PLACEHOLDER}
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className="h-10 w-full rounded-xl"
              />
              <p className="text-[11px] leading-snug text-pour-subtle">
                ครอบคลุม Client, งานคอนกรีต, โครงสร้าง, ที่ตั้ง, Mixcode, กำลัง/slump, ABC, WBS, หมายเหตุ และเลข structure_no
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pour-subtle">สถานะ</p>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStatus(s.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      filter.status_ids.includes(s.id)
                        ? 'border-[color:var(--pour-accent)] bg-[color:var(--pour-accent)] text-white shadow-sm shadow-[var(--pour-accent-ring)]'
                        : 'border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] text-pour-muted hover:border-[color:var(--glass-edge)]'
                    }`}
                  >
                    {s.status_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[color:var(--pour-surface-border)]/80 pt-4">
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1"
                onClick={() => resetFilter()}
              >
                ล้างตัวกรอง
              </Button>
              <Button type="button" className="min-w-0 flex-1" onClick={() => setRequestFiltersOpen(false)}>
                เสร็จ
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
