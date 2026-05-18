import { cn } from '@/lib/utils'

/**
 * POUR theme — Figma-style dark dashboard surfaces.
 */
export const BRAND_TAGLINE = 'Quality Management and Innovation Section'

const ink = {
  base: 'text-[color:var(--pour-ink-0)]',
  body: 'text-[color:var(--pour-ink-1)]',
  muted: 'text-pour-muted',
  subtle: 'text-pour-subtle',
} as const

/** Lucide — ขนาดและ stroke เดียวกันทั้งแอป */
export const ICON_STROKE = 1.75

export const icon = {
  xs: 'h-4 w-4 shrink-0',
  sm: 'h-[18px] w-[18px] shrink-0',
  md: 'h-5 w-5 shrink-0',
  lg: 'h-6 w-6 shrink-0',
} as const

/** สเกลตัวอักษร — แนว Figma: เล็กพอดี น้ำหนักเบา อ่านสบาย */
export const type = {
  tagline: cn('font-normal leading-relaxed', ink.subtle, 'text-[10px] sm:text-[11px]'),
  overline: cn('text-[10px] font-medium uppercase tracking-[0.08em]', ink.subtle),
  caption: cn('text-xs font-normal leading-relaxed', ink.muted),
  body: cn('text-[13px] font-normal leading-relaxed', ink.body),
  bodyStrong: cn('text-[13px] font-medium leading-relaxed', ink.base),
  detail: cn('text-[13px] font-normal leading-relaxed', ink.body),
  nav: 'text-[13px] font-medium leading-relaxed',
  navCompact: 'text-xs font-medium leading-relaxed',
  title: cn('text-lg font-semibold leading-snug pour-desktop:text-xl', ink.base, 'tracking-[-0.01em]'),
  hero: cn('text-xl font-semibold leading-snug pour-desktop:text-2xl', ink.base, 'tracking-[-0.02em]'),
  /** หัวตาราง — ไม่ uppercase หนาเกิน */
  tableHead: cn('text-[11px] font-medium leading-snug normal-case tracking-normal', ink.subtle),
} as const

/** CSS motion utilities (see index.css @keyframes pour-*) */
export const anim = {
  page: 'pour-page-enter',
  staggerItem: 'pour-stagger-item',
  cardLift: 'pour-card-lift',
  interactive: 'pour-interactive',
  shell: 'pour-shell-live',
  fadeIn: 'pour-fade-in',
} as const

/** Responsive layout primitives — forms, tables, detail rows */
export const layout = {
  formGrid2: 'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2',
  /** ฟอร์มใน modal — คอลัมน์คู่เมื่อโหมด desktop (แนวนอน + กว้างพอ) */
  formGridDialog: 'grid min-w-0 grid-cols-1 gap-3 pour-desktop:grid-cols-2 pour-desktop:gap-4',
  formField: 'min-w-0 space-y-1.5',
  statGrid2: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-wide:grid-cols-3',
  statGrid3: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-wide:grid-cols-4',
  statGrid5: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-wide:grid-cols-5',
  statGrid6: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-desktop:gap-4 pour-wide:grid-cols-6',
} as const

/** Consistent spacing — use across pages & layout */
export const space = {
  page: 'space-y-6 pb-12 pt-5 pour-desktop:space-y-8 pour-desktop:pb-14 pour-desktop:pt-6 pour-wide:space-y-9',
  pageNarrow: 'space-y-6 pb-12 pt-5 pour-desktop:max-w-4xl pour-desktop:space-y-8 pour-desktop:pb-14 pour-desktop:pt-6',
  section: 'space-y-5 pour-desktop:space-y-6 pour-wide:space-y-7',
  stackSm: 'space-y-3.5',
  insetX: 'px-4 sm:px-5 pour-desktop:px-6 pour-wide:px-8',
  insetY: 'py-5 pour-desktop:py-6 pour-wide:py-7',
  cardPad: 'px-5 py-4 pour-desktop:px-6 pour-desktop:py-5 pour-wide:px-7',
  cardPadHeader: 'px-5 py-3.5 pour-desktop:px-6 pour-wide:px-7',
  cardPadTight: 'px-5 py-3.5 pour-desktop:px-6 pour-wide:px-7',
} as const

/** Reusable glass surface classes (see index.css .pour-glass*) */
export const glass = {
  surface: 'pour-glass',
  surfaceStrong: 'pour-glass-strong',
  surfaceMuted: 'pour-glass-muted',
  border: 'border-[color:var(--glass-border)]',
  borderSubtle: 'border-[color:var(--glass-border-subtle)]',
  borderEdge: 'border-[color:var(--glass-edge)]',
  input:
    'border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] text-[color:var(--pour-ink-0)] placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:bg-[var(--glass-bg-strong)] focus-visible:shadow-[0_0_0_3px_var(--pour-accent-ring)]',
} as const

export const theme = {
  shell: 'pour-shell',
  shellDesktopAccent: '',
  brandWordmark:
    'bg-gradient-to-r from-[color:var(--pour-ink-0)] via-[#4da89e] to-[color:var(--pour-brand)] bg-clip-text font-extrabold uppercase tracking-tight text-transparent',
  headerBar: 'bg-[color:var(--pour-bg)] border-b border-[color:var(--pour-line)]',
  navPillActive:
    'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)] ring-1 ring-[color:var(--pour-line)]',
  navPillInactive:
    cn(
      ink.body,
      'border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] hover:border-[color:var(--glass-edge)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
    ),
  navPillMobile: type.navCompact,
  navLink: cn('flex items-center gap-2.5 rounded-lg px-3 py-2', type.nav),
  navSectionLabel: cn('px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em]', ink.subtle),
  primaryNavStrip: 'bg-[color:var(--pour-bg)] border-b border-[color:var(--pour-line)]',
  mainColumnDesktop: cn(
    'pour-desktop:flex pour-desktop:min-h-0 pour-desktop:flex-1 pour-desktop:flex-col pour-desktop:overflow-hidden',
    'pour-desktop:bg-[color:var(--pour-bg)]',
  ),
  sidebarSurface:
    'bg-[color:var(--pour-sidebar)] pour-desktop:border-r pour-desktop:border-[color:var(--pour-line)]',
  sidebarBrandPanel: cn(
    'outline-none transition-[border-color,background-color] duration-150',
    'rounded-lg px-2 py-2',
    'hover:bg-[color:var(--pour-nav-hover-bg)]',
    'focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent-ring)]',
  ),
  sidebarBrandPanelActive: 'bg-[color:var(--pour-nav-active-bg)]',
  sidebarBrandTitle:
    'block truncate leading-tight text-[color:var(--pour-ink-0)] font-semibold tracking-tight',
  sidebarBrandTagline: cn('mt-0.5 block text-[color:var(--pour-ink-3)]', type.tagline),
  sidebarBrandLogoWrap:
    'flex shrink-0 items-center justify-center rounded-lg bg-[color:var(--glass-bg)] p-1 ring-1 ring-[color:var(--glass-border-subtle)]',
  sidebarBrandLogo: 'h-full w-full object-contain object-center',
  iconTileBrand: 'pour-brand-icon-tile',
  iconButtonChrome: cn(
    glass.surfaceStrong,
    anim.interactive,
    'inline-flex items-center justify-center rounded-lg font-medium',
    cn(ink.body, 'hover:border-[color:var(--glass-edge)] hover:bg-[color:var(--glass-bg-strong)] hover:text-[color:var(--pour-ink-0)]'),
  ),
  sidebarSearch:
    'h-9 w-full rounded-lg border border-[color:var(--pour-line)] bg-[color:var(--pour-bg-2)] px-3 text-sm text-[color:var(--pour-ink-0)] placeholder:text-[color:var(--pour-ink-3)] focus:border-[color:var(--pour-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--pour-accent-ring)]',
  headerBarMobile: 'px-3 py-2',
  primaryNavStripPad: 'px-3 py-2.5',
  drawerPanel: cn(glass.surfaceStrong, 'border-[color:var(--glass-border-subtle)]'),
  drawerHeader: cn(glass.surfaceStrong, 'border-b border-[color:var(--glass-border-subtle)]'),
  /** เนื้อหารายการใน main */
  mobileListBody: 'space-y-3 px-4 pb-4 pt-2 pour-desktop:hidden',
  /** จำกัดความกว้างเนื้อหาเมื่อ pour-wide (328 ≈ 82rem) */
  contentMaxWide: 'pour-wide:max-w-328',
  /** ตารางกว้าง — ~20% กว่า contentMaxWide (394 ≈ 98.5rem) */
  contentMaxTable: 'pour-wide:max-w-394',
  /** แคบ — 50% ของ contentMaxWide (164 ≈ 41rem) */
  contentMaxNarrow: 'pour-wide:max-w-164',
  /** โปรไฟล์ — 80% ของ contentMaxWide (262 ≈ 65.5rem) */
  contentMaxProfile: 'pour-wide:max-w-262',
} as const

/** หน้าตารางกว้าง — ใช้ contentMaxTable แทน contentMaxWide เมื่อ pour-wide */
export function isTableContentPath(pathname: string): boolean {
  return (
    pathname.startsWith('/cst') ||
    pathname.startsWith('/requests/booking-summary') ||
    pathname.startsWith('/admin/users')
  )
}

/** หน้า CRUD แคบ — 50% ของ contentMaxWide (เช่น Structure, Client, Jobs) */
export function isNarrowContentPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin/structure') ||
    pathname.startsWith('/admin/client') ||
    pathname.startsWith('/admin/jobs')
  )
}

export function getContentMaxClass(pathname: string): string {
  if (isNarrowContentPath(pathname)) return theme.contentMaxNarrow
  if (isTableContentPath(pathname)) return theme.contentMaxTable
  if (pathname.startsWith('/profile')) return theme.contentMaxProfile
  return theme.contentMaxWide
}

/** App-wide layout chrome */
export const app = {
  /** Full-viewport scroll host for standalone auth pages (html/body/#root use overflow:hidden). */
  shellScroll: cn(
    'flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col overflow-y-auto overscroll-y-contain px-4 py-10 pour-shell',
    ink.base,
  ),
  shellInner: 'flex w-full flex-1 flex-col items-center justify-center py-4',
  pageAdmin:
    cn('mx-auto flex w-full min-w-0 max-w-none flex-col gap-7 pb-12 pt-5 pour-desktop:gap-9 pour-desktop:pb-14 pour-desktop:pt-6', ink.base),
  pageAdminTitle: cn(type.title, 'block w-full shrink-0 pb-2 pt-0'),
  pageAdminSection: cn('block w-full min-w-0', space.section),
  /** ตารางเดี่ยว — มุมมน + กรอบบาง */
  tableWrap: cn('pour-table-shell pour-scroll-x min-w-0 max-w-full', glass.surface),
  tableWrapDesktop: cn(
    'pour-table-shell pour-scroll-x hidden min-w-0 max-w-full pour-desktop:block',
    glass.surface,
  ),
  /** ตารางใน accordion/section — ไม่ซ้อน glass */
  tableWrapNested: 'pour-scroll-x min-w-0 max-w-full',
  mobileCardStack: 'space-y-3.5 pour-desktop:hidden',
  table: 'w-full min-w-[36rem] text-[13px] leading-relaxed',
  tableHead:
    cn(
      type.tableHead,
      'border-b border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)]/80 text-left',
      '[&_th]:px-3 [&_th]:py-2 sm:[&_th]:px-3.5 sm:[&_th]:py-2.5',
      '[&_th:first-child]:pl-4 [&_th:last-child]:pr-4',
    ),
  tableBody:
    cn(
      'divide-y divide-[color:var(--glass-border-subtle)]',
      '[&_td]:max-w-[18rem] [&_td]:break-words [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_td]:font-normal [&_td]:text-[color:var(--pour-ink-1)]',
      'sm:[&_td]:px-3.5 sm:[&_td]:py-2.5',
      '[&_td:first-child]:pl-4 [&_td:last-child]:pr-4',
      '[&_td:has(:focus-visible)]:relative [&_td:has(:focus-visible)]:z-[1] [&_td:has(:focus-visible)]:bg-[color:var(--pour-accent-muted)]/60',
    ),
  tableRowHover: '[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[color:var(--pour-nav-hover-bg)]/50',
  mutedText: ink.muted,
  mobileCardStackCompact: 'space-y-2 pour-desktop:hidden',
} as const

/** ตารางแบบอัด — admin / CST */
export const tableCompact = {
  table: cn(app.table, 'text-[12px] leading-relaxed'),
  head: cn(app.tableHead, '[&_th]:px-2.5 [&_th]:py-2'),
  body: cn(
    app.tableBody,
    app.tableRowHover,
    '[&_td]:max-w-[14rem] [&_td]:px-2.5 [&_td]:py-2 sm:[&_td]:px-3',
  ),
  emptyCell: 'py-8 text-center text-xs text-[color:var(--pour-ink-3)]',
} as const

/** Modal — กว้างพอดี เนื้อหาโปร่ง */
export const modal = {
  sm: 'w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-md',
  md: 'w-[calc(100vw-1.25rem)] max-w-md sm:max-w-lg pour-desktop:max-w-xl',
  lg: 'w-[calc(100vw-1rem)] max-w-lg sm:max-w-xl pour-desktop:max-w-2xl',
  xl: 'w-[calc(100vw-0.75rem)] max-w-xl sm:max-w-2xl pour-desktop:max-w-3xl',
  shell:
    'flex max-h-[min(90dvh,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 rounded-2xl',
  header: 'min-w-0 shrink-0 space-y-1 px-5 pt-5 pr-11 text-left sm:px-6 sm:pt-6',
  body: 'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6 sm:py-5',
  footer:
    'mx-0 shrink-0 gap-2 border-t border-[color:var(--glass-border-subtle)] px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6 sm:py-4',
  title: cn(type.title, 'text-base font-semibold pour-desktop:text-lg'),
} as const

/** กรอบซ้อนกัน — ลด border/padding ซ้ำ */
export const frame = {
  section:
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)]/90',
  sectionBody:
    'min-w-0 border-t border-[color:var(--glass-border-subtle)] px-4 py-4 pour-desktop:px-5 pour-desktop:py-5',
  sectionTitle: cn(type.bodyStrong, 'text-[13px]'),
  insetPanel: 'rounded-xl bg-[color:var(--pour-bg-2)]/60 ring-1 ring-[color:var(--glass-border-subtle)]',
} as const

/** Shared visual language for /requests/* flows */
export const rq = {
  page: cn('mx-auto w-full min-w-0 max-w-none', space.page, ink.base),
  pageNarrow: cn('mx-auto w-full min-w-0 max-w-3xl pour-desktop:max-w-4xl', space.pageNarrow, ink.base),
  card: cn('overflow-hidden rounded-2xl', glass.surface, anim.cardLift, ink.base),
  cardMuted: cn('overflow-hidden rounded-2xl', glass.surfaceMuted, ink.base),
  cardHeader: cn(
    'border-b border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)]',
    space.cardPadHeader,
  ),
  cardTitle: cn(type.bodyStrong, 'font-medium tracking-normal'),
  cardContent: space.cardPad,
  cardContentTight: space.cardPadTight,
  heroTitle: type.hero,
  sub: type.caption,
  label: cn(type.caption, 'font-medium'),
  value: 'min-w-0 text-[13px] font-medium break-words leading-relaxed text-[color:var(--pour-ink-0)]',
  detailRow: 'flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2',
  detailLabel: cn('w-full shrink-0 sm:w-28', type.caption, 'font-medium'),
  spinner:
    'h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]',
  stepActive: 'bg-[color:var(--pour-accent)] font-semibold text-white shadow-sm shadow-black/15',
  stepIdle: cn('border border-[color:var(--glass-border-subtle)] font-medium', ink.subtle, glass.surface),
  stepLineDone: 'bg-[color:var(--pour-accent)]',
  stepLineTodo: 'bg-[color:var(--glass-border-subtle)]',
  link: 'font-semibold text-[color:var(--pour-accent)] underline-offset-2 hover:text-[color:var(--pour-accent-hover)] hover:underline',
  timelineDot: 'mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--pour-accent)] ring-2 ring-[color:var(--pour-accent-ring)]',
  dataRowCard: cn(
    'rounded-2xl p-3.5 outline-none transition-[box-shadow,background-color] pour-desktop:p-4',
    glass.surface,
    ink.base,
    'focus-within:bg-[color:var(--glass-bg-strong)] focus-within:shadow-[inset_0_0_0_2px_var(--pour-accent-ring),var(--glass-shadow-sm)]',
  ),
  dataRowFields: 'space-y-2',
  dataRowLabel: cn(type.overline, 'tracking-wider text-[color:var(--pour-ink-2)]'),
  dataRowValue: cn(type.detail, 'font-medium', ink.base),
  dataRowActions:
    'mt-3 flex flex-wrap justify-end gap-2 border-t border-[color:var(--glass-border)] pt-3',
  actions: {
    panelBody: cn(space.cardPadTight, 'flex flex-col gap-3'),
    buttonRow: 'flex min-w-0 flex-wrap items-center gap-2',
    strip:
      'flex flex-col gap-2.5 border-t border-[color:var(--glass-border)] bg-[color:var(--glass-bg-muted)] px-4 py-3 pour-desktop:flex-row pour-desktop:flex-wrap pour-desktop:items-center pour-desktop:gap-x-2 pour-desktop:gap-y-2 pour-desktop:px-5 pour-desktop:py-3.5',
    sectionLabel: cn(type.overline, 'w-full basis-full text-[color:var(--pour-ink-2)]'),
  },
  dataRowEmpty: cn(
    'rounded-xl px-5 py-10 text-center text-sm font-medium',
    glass.surface,
    ink.muted,
  ),
} as const

/** Surfaces & states — ใช้แทน bg-[color:var(--glass-bg)] / hex ซ้ำๆ ทั้งแอป */
export const surface = {
  panel: 'pour-surface-panel',
  chart: cn(
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] shadow-[var(--glass-shadow-sm)]',
  ),
  inset: 'rounded-lg bg-[color:var(--pour-bg-2)] ring-1 ring-[color:var(--glass-border-subtle)]',
  empty: 'pour-empty-state',
  tabActive:
    'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)] shadow-sm ring-1 ring-[color:var(--pour-line)]',
  tabIdle: 'text-pour-muted hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
} as const

/** หน้า auth แยกจาก shell หลัก */
export const auth = {
  shell: cn('flex flex-1 items-center justify-center bg-[color:var(--pour-bg)] px-6 py-10'),
  card: cn(glass.surface, anim.page, 'w-full max-w-[380px] rounded-2xl p-6 sm:p-8'),
  title: cn(type.hero, 'mb-1'),
  subtitle: cn(type.caption, 'mb-8'),
} as const

/** การ์ดมือถือแบบกระชับ — คู่กับ tableCompact ในหน้า admin */
export const adminDataRow = {
  card: cn(rq.dataRowCard, 'text-[13px] leading-relaxed'),
  fields: 'space-y-1.5',
  label: cn(rq.dataRowLabel, 'text-[10px]'),
  value: cn(rq.dataRowValue, 'text-[13px]'),
  actions: cn(rq.dataRowActions, 'mt-2.5 gap-1.5 pt-2.5'),
} as const
