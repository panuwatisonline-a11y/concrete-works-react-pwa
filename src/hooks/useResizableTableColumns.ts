import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ThHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'
import {
  clampWidth,
  loadResizableTableWidths,
  saveResizableTableWidths,
  type ResizableTableColumnConfig,
} from '@/lib/resizableTableColumns'

interface ResizeSession {
  columnId: string
  startX: number
  startWidth: number
}

export function useResizableTableColumns(
  tableId: string,
  columns: ResizableTableColumnConfig[],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false && Boolean(tableId) && columns.length > 0
  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const [widths, setWidths] = useState<Record<string, number>>(() =>
    enabled ? loadResizableTableWidths(tableId, columns) : {},
  )

  useEffect(() => {
    if (!enabled) return
    setWidths(loadResizableTableWidths(tableId, columnsRef.current))
  }, [enabled, tableId])

  const persist = useCallback(
    (next: Record<string, number>) => {
      saveResizableTableWidths(tableId, next)
    },
    [tableId],
  )

  const beginResize = useCallback((columnId: string, clientX: number) => {
    if (!enabled) return
    const col = columnsRef.current.find((c) => c.id === columnId)
    if (!col || col.resizable === false) return

    const session: ResizeSession = {
      columnId,
      startX: clientX,
      startWidth: widths[columnId] ?? col.defaultWidth,
    }

    document.body.classList.add('pour-table-is-resizing')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e: globalThis.MouseEvent) => {
      const delta = e.clientX - session.startX
      const nextW = clampWidth(session.startWidth + delta, col)
      setWidths((prev) => ({ ...prev, [columnId]: nextW }))
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('pour-table-is-resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidths((prev) => {
        persist(prev)
        return prev
      })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [enabled, widths, persist])

  const resetWidths = useCallback(() => {
    if (!enabled) return
    const next = Object.fromEntries(columnsRef.current.map((c) => [c.id, c.defaultWidth]))
    setWidths(next)
    persist(next)
  }, [enabled, persist])

  const colGroup = useMemo(() => {
    if (!enabled) return null
    return createElement(
      'colgroup',
      null,
      columns.map((c) =>
        createElement('col', {
          key: c.id,
          style: { width: widths[c.id] ?? c.defaultWidth },
        }),
      ),
    )
  }, [columns, enabled, widths])

  const getWidth = useCallback((columnId: string) => widths[columnId], [widths])

  const renderHeadCell = useCallback(
    (
      columnId: string,
      label: ReactNode,
      options?: { className?: string; thProps?: ThHTMLAttributes<HTMLTableCellElement> },
    ) => {
      if (!enabled) {
        return createElement(
          'th',
          {
            ...options?.thProps,
            key: columnId,
            className: cn(options?.className, options?.thProps?.className),
          },
          label,
        )
      }

      const col = columns.find((c) => c.id === columnId)
      const w = widths[columnId] ?? col?.defaultWidth ?? 120
      const resizable = col?.resizable !== false

      return createElement(
        'th',
        {
          ...options?.thProps,
          key: columnId,
          style: { ...options?.thProps?.style, width: w },
          className: cn('relative select-none', options?.className, options?.thProps?.className),
        },
        label,
        resizable
          ? createElement('button', {
              type: 'button',
              key: 'resize',
              'aria-label': `ปรับความกว้างคอลัมน์`,
              className: 'pour-table-col-resize-handle',
              onMouseDown: (e: { preventDefault: () => void; stopPropagation: () => void; clientX: number }) => {
                e.preventDefault()
                e.stopPropagation()
                beginResize(columnId, e.clientX)
              },
              onDoubleClick: (e: { preventDefault: () => void; stopPropagation: () => void }) => {
                e.preventDefault()
                e.stopPropagation()
                if (!col) return
                setWidths((prev) => {
                  const next = { ...prev, [columnId]: col.defaultWidth }
                  persist(next)
                  return next
                })
              },
            })
          : null,
      )
    },
    [beginResize, columns, enabled, persist, widths],
  )

  return {
    widths,
    colGroup,
    getWidth,
    renderHeadCell,
    resetWidths,
    beginResize,
  }
}
