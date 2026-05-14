import { cn } from '@/lib/utils'

/**
 * POUR industrial dispatch theme (Geist, cool gray shell, blue primary).
 * Matches design tokens in screens-shared.jsx.
 */
export const BRAND_TAGLINE = 'Quality Management and Innovation Section'

export const theme = {
  shell: 'bg-[#f5f6f8]',
  shellDesktopAccent:
    'md:bg-[radial-gradient(900px_560px_at_100%_0%,rgba(37,99,235,0.07)_0%,transparent_55%),radial-gradient(700px_480px_at_0%_100%,rgba(200,206,216,0.12)_0%,transparent_50%)]',
  brandWordmark:
    'bg-gradient-to-r from-[#111827] via-[#374151] to-[#1d4ed8] bg-clip-text font-extrabold uppercase tracking-tight text-transparent',
  headerBar:
    'border-b border-[#e2e6ec] bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md',
  navPillActive:
    'bg-[rgba(37,99,235,0.10)] text-[#2563eb] ring-1 ring-[rgba(37,99,235,0.22)]',
  navPillInactive: 'text-[#374151] hover:bg-[#f0f2f5] hover:text-[#111827]',
  primaryNavStrip: 'border-b border-[#e2e6ec] bg-white',
  mainColumnDesktop:
    'md:overflow-hidden md:rounded-2xl md:border md:border-[#e2e6ec] md:bg-white md:shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:backdrop-blur-sm',
  sidebarSurface:
    'rounded-r-2xl border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
  iconTileBrand:
    'bg-[#2563eb] text-white shadow-md shadow-[rgba(37,99,235,0.35)] [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_6px)]',
  iconButtonChrome:
    'inline-flex items-center justify-center rounded-[10px] border border-[#e2e6ec] bg-white text-[#374151] shadow-sm shadow-black/[0.04] transition hover:border-[#2563eb]/35 hover:bg-[rgba(37,99,235,0.06)] hover:text-[#2563eb] active:scale-95',
  breadcrumbStrip: 'border-b border-[#e2e6ec] bg-white/95 backdrop-blur-sm',
} as const

/** App-wide layout chrome */
export const app = {
  shell: cn('flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 text-[#111827]', theme.shell),
  pageAdmin:
    'mx-auto w-full min-w-0 max-w-none space-y-5 pb-10 pt-2 text-[#111827] md:space-y-6 md:pb-8 md:pt-1',
  tableWrap:
    'overflow-x-auto rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
  /** Hide table on small screens when paired with mobileCardStack */
  tableWrapDesktop:
    'hidden overflow-x-auto rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:block',
  /** Card list for tabular data on small screens (pair with tableWrapDesktop) */
  mobileCardStack: 'space-y-2 md:hidden',
  table: 'w-full text-sm',
  tableHead:
    'border-b border-[#e2e6ec] bg-[#f0f2f5]/90 text-left text-xs font-semibold text-[#6b7280] [&_th]:px-3 [&_th]:py-2.5',
  tableBody:
    'divide-y divide-[#e2e6ec]/80 [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_td:has(:focus-visible)]:relative [&_td:has(:focus-visible)]:z-[1] [&_td:has(:focus-visible)]:bg-[rgba(37,99,235,0.05)] [&_td:has(:focus-visible)]:shadow-[inset_0_0_0_2px_rgba(37,99,235,0.42)]',
  /** Per-row hover (avoid hover:bg on tbody — it greys the whole table). */
  tableRowHover: '[&_tr]:transition-colors [&_tr:hover]:bg-[#f5f6f8]/90',
  mutedText: 'text-[#6b7280]',
} as const

/** Shared visual language for /requests/* flows */
export const rq = {
  page:
    'mx-auto w-full min-w-0 max-w-none space-y-4 pb-8 pt-2 text-[#111827] md:space-y-5 md:pb-6 md:pt-3',
  pageNarrow:
    'mx-auto w-full min-w-0 max-w-3xl space-y-4 pb-8 pt-2 text-[#111827] md:max-w-4xl md:space-y-5 md:pb-6 md:pt-3',
  card: 'rounded-[14px] border border-[#e2e6ec] bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
  cardMuted:
    'rounded-[14px] border border-[#e2e6ec]/90 bg-[#f0f2f5]/80 text-[#111827] shadow-sm shadow-black/[0.03]',
  cardHeader: 'border-b border-[#e2e6ec]/80 bg-[#f5f6f8]/50 px-4 py-3 md:px-5',
  cardTitle: 'text-sm font-bold tracking-tight text-[#111827]',
  cardContent: 'px-4 py-4 md:px-5 md:py-5',
  cardContentTight: 'px-4 py-3 md:px-5 md:py-4',
  heroTitle: 'text-lg font-bold tracking-tight text-[#111827] md:text-xl',
  sub: 'text-xs text-[#6b7280] md:text-sm',
  label: 'text-xs font-medium text-[#6b7280]',
  value: 'text-sm font-medium text-[#111827]',
  spinner: 'h-8 w-8 animate-spin rounded-full border-2 border-[#e2e6ec] border-t-[#2563eb]',
  stepActive: 'bg-[#2563eb] text-white shadow-sm shadow-[rgba(37,99,235,0.35)]',
  stepIdle: 'border border-[#e2e6ec] bg-white text-[#9ca3af]',
  stepLineDone: 'bg-[#2563eb]',
  stepLineTodo: 'bg-[#e2e6ec]',
  link: 'font-medium text-[#2563eb] underline-offset-2 hover:text-[#1d4ed8] hover:underline',
  timelineDot: 'mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2563eb] ring-2 ring-[rgba(37,99,235,0.15)]',
  /** Compact mobile row (few fields): admin tables → cards */
  dataRowCard:
    'rounded-xl border border-[#e2e6ec] bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] outline-none transition-[box-shadow,background-color] focus-within:bg-[rgba(37,99,235,0.03)] focus-within:shadow-[inset_0_0_0_2px_rgba(37,99,235,0.38),0_1px_2px_rgba(0,0,0,0.04)]',
  dataRowFields: 'space-y-1',
  dataRowLabel: 'text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]',
  dataRowValue: 'text-[13px] font-medium leading-tight text-[#111827]',
  dataRowActions: 'mt-2 flex justify-end gap-0.5 border-t border-[#e2e6ec]/60 pt-1.5',
  dataRowEmpty: 'rounded-xl border border-[#e2e6ec] bg-white px-3 py-6 text-center text-xs text-[#6b7280] shadow-[0_1px_2px_rgba(0,0,0,0.035)]',
} as const
