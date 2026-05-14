import { useEffect, useId, useRef } from 'react'
import { useDesktopSearchRegistry, unregisterDesktopSearchBar } from '@/stores/desktopSearchRegistry'

export interface DesktopSearchRegistrationOptions {
  placeholder: string
  ariaLabel: string
  showRequestFilterButton: boolean
  search: string
  onSearchChange: (v: string) => void
}

/**
 * Binds the global desktop top search bar to this page's query state.
 * Unregisters on unmount so the next route can take over.
 */
export function useDesktopSearchRegistration(opts: DesktopSearchRegistrationOptions) {
  const reactId = useId()
  const id = `ds-${reactId.replace(/:/g, '')}`
  const searchRef = useRef(opts.search)
  searchRef.current = opts.search
  const onSearchChangeRef = useRef(opts.onSearchChange)
  onSearchChangeRef.current = opts.onSearchChange

  const bumpSearch = useDesktopSearchRegistry((s) => s.bumpSearch)

  useEffect(() => {
    useDesktopSearchRegistry.getState().setActive({
      id,
      placeholder: opts.placeholder,
      ariaLabel: opts.ariaLabel,
      showRequestFilterButton: opts.showRequestFilterButton,
      getSearch: () => searchRef.current,
      setSearch: (v) => {
        onSearchChangeRef.current(v)
        useDesktopSearchRegistry.getState().bumpSearch()
      },
    })
    useDesktopSearchRegistry.getState().bumpSearch()
    return () => unregisterDesktopSearchBar(id)
  }, [id, opts.placeholder, opts.ariaLabel, opts.showRequestFilterButton])

  useEffect(() => {
    bumpSearch()
  }, [opts.search, bumpSearch])
}
