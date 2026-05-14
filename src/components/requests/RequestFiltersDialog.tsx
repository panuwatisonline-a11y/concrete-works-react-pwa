import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { REQUEST_LIST_SEARCH_PLACEHOLDER } from '@/lib/desktopTopBarSearch'
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
      <DialogContent className="max-h-[min(90dvh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">ค้นหาและตัวกรอง</DialogTitle>
        </DialogHeader>

        {!masterLoaded ? (
          <p className="py-8 text-center text-sm text-[#6b7280]">กำลังโหลดข้อมูลอ้างอิง…</p>
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
              <p className="text-[11px] leading-snug text-[#9ca3af]">
                ครอบคลุม Client, งานคอนกรีต, โครงสร้าง, ที่ตั้ง, Mixcode, กำลัง/slump, ABC, WBS, หมายเหตุ และเลข structure_no
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">สถานะ</p>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStatus(s.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      filter.status_ids.includes(s.id)
                        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-sm shadow-[rgba(37,99,235,0.25)]'
                        : 'border-[#e2e6ec] bg-white text-[#6b7280] hover:border-[#c8ced8]'
                    }`}
                  >
                    {s.status_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#e2e6ec]/80 pt-4">
              <Button
                type="button"
                variant="outline"
                className="min-w-[8rem] flex-1"
                onClick={() => resetFilter()}
              >
                ล้างตัวกรอง
              </Button>
              <Button type="button" className="min-w-[8rem] flex-1" onClick={() => setRequestFiltersOpen(false)}>
                เสร็จ
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
