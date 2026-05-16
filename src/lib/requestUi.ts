import { cn } from '@/lib/utils'

/**
 * POUR theme — white / gray / black liquid glass.
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

/** สเกลตัวอักษร — จับคู่กับ icon.sm (18px) เป็นหลัก */
export const type = {
  tagline: cn('font-medium leading-snug tracking-wide', ink.subtle, 'text-[10px] sm:text-[11px]'),
  overline: cn('text-[11px] font-semibold uppercase tracking-wide', ink.subtle),
  caption: cn('text-xs font-medium', ink.muted),
  body: cn('text-sm font-medium', ink.body),
  bodyStrong: cn('text-sm font-semibold', ink.base),
  detail: cn('text-[13px] font-medium leading-snug pour-desktop:text-sm', ink.body),
  nav: 'text-sm font-semibold leading-snug',
  navCompact: 'text-xs font-semibold leading-snug',
  title: cn('text-xl font-bold leading-tight pour-desktop:text-2xl pour-wide:text-3xl', ink.base, 'tracking-[-0.02em]'),
  hero: cn('text-2xl font-bold leading-tight pour-desktop:text-3xl pour-wide:text-4xl', ink.base, 'tracking-[-0.03em]'),
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
  formGridDialog: 'grid min-w-0 grid-cols-1 gap-3 pour-desktop:grid-cols-2',
  formField: 'min-w-0 space-y-1.5',
  statGrid2: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-wide:grid-cols-3',
  statGrid3: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-wide:grid-cols-4',
  statGrid5: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-wide:grid-cols-5',
  statGrid6: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-desktop:gap-4 pour-wide:grid-cols-6',
} as const

/** Consistent spacing — use across pages & layout */
export const space = {
  page: 'space-y-5 pb-10 pt-4 pour-desktop:space-y-6 pour-desktop:pb-12 pour-desktop:pt-5 pour-wide:space-y-7 pour-wide:pt-6',
  pageNarrow: 'space-y-5 pb-10 pt-4 pour-desktop:max-w-4xl pour-desktop:space-y-6 pour-desktop:pb-12 pour-desktop:pt-5 pour-wide:space-y-7',
  section: 'space-y-4 pour-desktop:space-y-5 pour-wide:space-y-6',
  stackSm: 'space-y-3',
  insetX: 'px-4 sm:px-5 pour-desktop:px-6 pour-wide:px-8',
  insetY: 'py-4 pour-desktop:py-5 pour-wide:py-6',
  cardPad: 'px-5 py-5 pour-desktop:px-6 pour-desktop:py-6 pour-wide:px-8 pour-wide:py-7',
  cardPadHeader: 'px-5 py-4 pour-desktop:px-6 pour-wide:px-8',
  cardPadTight: 'px-5 py-4 pour-desktop:px-6 pour-wide:px-8',
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
    'border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] text-[color:var(--pour-ink-0)] backdrop-blur-xl placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:bg-white/75 focus-visible:shadow-[0_0_0_3px_var(--pour-accent-ring)]',
} as const

export const theme = {
  shell: cn('pour-shell', anim.shell),
  shellDesktopAccent: '',
  brandWordmark:
    'bg-gradient-to-r from-[color:var(--pour-ink-0)] via-[#4da89e] to-[color:var(--pour-accent)] bg-clip-text font-extrabold uppercase tracking-tight text-transparent',
  headerBar: 'bg-white border-b border-[color:var(--glass-border)]',
  navPillActive:
    'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)] ring-1 ring-[color:var(--pour-accent-ring)] backdrop-blur-sm shadow-sm shadow-[color:var(--pour-accent)]/10',
  navPillInactive:
    cn(
      ink.body,
      'border border-[color:var(--glass-border-subtle)] bg-white/75 shadow-sm shadow-slate-900/5 backdrop-blur-sm hover:border-[color:var(--glass-edge)] hover:bg-white hover:text-[color:var(--pour-ink-0)]',
    ),
  navPillMobile: type.navCompact,
  navLink: cn('flex items-center gap-3 rounded-xl px-4 py-3', type.nav),
  navSectionLabel: cn('px-2 pb-2', type.overline),
  primaryNavStrip: 'bg-white border-b border-[color:var(--glass-border)]',
  mainColumnDesktop: cn(
    'pour-desktop:flex pour-desktop:min-h-0 pour-desktop:flex-1 pour-desktop:flex-col pour-desktop:overflow-hidden',
    'pour-desktop:bg-[color:var(--pour-cream)]',
  ),
  sidebarSurface: 'bg-white pour-desktop:border-r pour-desktop:border-[color:var(--glass-border)]',
  /** กล่องแบรนด์ sidebar — clean white + accent ring เมื่อ active */
  sidebarBrandPanel: cn(
    'outline-none transition-[border-color,box-shadow,background-color] duration-150',
    'rounded-xl border border-[color:var(--glass-border-subtle)]',
    'bg-white/90 shadow-sm',
    'hover:border-[color:var(--glass-edge)] hover:bg-white hover:shadow-md',
    'focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/40',
  ),
  sidebarBrandPanelActive:
    'border-[color:var(--pour-line)] bg-[color:var(--pour-accent-muted)] shadow-md ring-1 ring-[color:var(--pour-accent-ring)]',
  sidebarBrandTitle:
    'block truncate leading-tight text-[color:var(--pour-ink-0)] font-extrabold uppercase tracking-tight',
  sidebarBrandTagline: cn('mt-0.5 block text-[color:var(--pour-ink-2)]', type.tagline),
  /** พื้นขาวหลังโลโก้ — ไฟล์ PNG มีพื้นดำ ต้องไม่ใช้ blend */
  sidebarBrandLogoWrap:
    'flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-[color:var(--glass-border-subtle)]',
  sidebarBrandLogo: 'h-full w-full object-contain object-center',
  iconTileBrand: 'pour-brand-icon-tile',
  iconButtonChrome: cn(
    glass.surfaceStrong,
    anim.interactive,
    'inline-flex items-center justify-center rounded-[10px] font-medium shadow-sm shadow-slate-900/8',
    cn(ink.body, 'hover:border-[color:var(--glass-edge)] hover:bg-white hover:text-[color:var(--pour-accent)]'),
  ),
  breadcrumbStrip: cn(
    glass.surface,
    'rounded-xl border border-[color:var(--glass-border-subtle)]',
    space.insetX,
    'py-2.5 pour-desktop:py-3',
  ),
  headerBarMobile: 'px-3 py-2',
  primaryNavStripPad: 'px-3 py-2.5',
  drawerPanel: cn(glass.surfaceStrong, 'border-[color:var(--glass-border-subtle)]'),
  drawerHeader: cn(glass.surfaceStrong, 'border-b border-[color:var(--glass-border-subtle)]'),
  /** หัวข้อรายการจอง — อยู่ใน AppHeader ใต้ MobilePrimaryNav (เลื่อนติด nav เสมอ) */
  mobileRequestListHeader: cn(
    glass.surfaceStrong,
    'shrink-0 border-b border-[color:var(--glass-border-subtle)]',
  ),
  mobileRequestListHeaderInner: 'flex items-start gap-2 px-3 pb-3 pt-2',
  /** เนื้อหารายการใน main (ไม่มีหัวข้อซ้ำ) */
  mobileListBody: 'space-y-3 px-4 pb-4 pt-2 pour-desktop:hidden',
} as const

/** App-wide layout chrome */
export const app = {
  /** Full-viewport scroll host for standalone auth pages (html/body/#root use overflow:hidden). */
  shellScroll: cn(
    'flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col overflow-y-auto overscroll-y-contain px-4 py-10 pour-shell',
    ink.base,
  ),
  shellInner: 'flex w-full flex-1 flex-col items-center justify-center py-4',
  pageAdmin:
    cn('mx-auto flex w-full min-w-0 max-w-none flex-col gap-6 pb-10 pt-4 pour-desktop:gap-8 pour-desktop:pb-12 pour-desktop:pt-5', ink.base),
  pageAdminTitle: cn('block w-full shrink-0 pb-1 pt-0 font-bold tracking-tight', ink.base),
  pageAdminSection: cn('block w-full min-w-0', space.section),
  tableWrap: cn('pour-scroll-x min-w-0 max-w-full rounded-xl', glass.surface),
  tableWrapDesktop: cn(
    'hidden pour-scroll-x min-w-0 max-w-full rounded-xl pour-desktop:block',
    glass.surface,
  ),
  mobileCardStack: 'space-y-3 pour-desktop:hidden',
  table: 'w-full min-w-[36rem] text-sm',
  tableHead:
    'border-b-2 border-[color:var(--glass-border-subtle)] bg-white/30 text-left text-xs font-bold uppercase tracking-wide text-[color:var(--pour-ink-2)] backdrop-blur-md [&_th]:px-3 [&_th]:py-3 sm:[&_th]:px-4',
  tableBody:
    'divide-y divide-[color:var(--glass-border)] [&_td]:max-w-[18rem] [&_td]:break-words [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle [&_td]:text-[color:var(--pour-ink-0)] sm:[&_td]:px-4 [&_td:has(:focus-visible)]:relative [&_td:has(:focus-visible)]:z-[1] [&_td:has(:focus-visible)]:bg-[color:var(--pour-accent-muted)] [&_td:has(:focus-visible)]:shadow-[inset_0_0_0_2px_var(--pour-accent-ring)]',
  tableRowHover: '[&_tr]:transition-colors [&_tr:hover]:bg-[var(--pour-bg)]',
  mutedText: ink.muted,
  mobileCardStackCompact: 'space-y-2 pour-desktop:hidden',
} as const

/** ตารางแบบกระชับ — ใช้ใน admin / CST (คล้าย CstListPage) */
export const tableCompact = {
  table: cn(app.table, 'text-[11px] leading-snug'),
  head: cn(
    app.tableHead,
    '[&_th]:px-1.5 [&_th]:py-1 [&_th]:text-[10px] [&_th]:leading-none sm:[&_th]:px-2',
  ),
  body: cn(
    app.tableBody,
    app.tableRowHover,
    '[&_td]:max-w-[12rem] [&_td]:px-1.5 [&_td]:py-1 [&_td]:text-[11px] [&_td]:leading-snug sm:[&_td]:px-2',
  ),
  emptyCell: 'py-4 text-center text-[11px] text-[#6b7280]',
} as const

/** Shared visual language for /requests/* flows */
export const rq = {
  page: cn('mx-auto w-full min-w-0 max-w-none', space.page, ink.base),
  pageNarrow: cn('mx-auto w-full min-w-0 max-w-3xl pour-desktop:max-w-4xl', space.pageNarrow, ink.base),
  card: cn('rounded-xl overflow-hidden', glass.surface, anim.cardLift, ink.base),
  cardMuted: cn('rounded-xl overflow-hidden', glass.surfaceMuted, ink.base),
  cardHeader: cn(
    'border-b border-[color:var(--glass-border-subtle)] bg-white/25 backdrop-blur-md',
    space.cardPadHeader,
  ),
  cardTitle: cn(type.bodyStrong, 'tracking-tight'),
  cardContent: space.cardPad,
  cardContentTight: space.cardPadTight,
  heroTitle: type.hero,
  sub: type.caption,
  label: cn(type.caption, 'font-semibold'),
  value: 'min-w-0 text-sm font-semibold break-words text-[color:var(--pour-ink-0)]',
  detailRow: 'flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-2',
  detailLabel: cn('w-full shrink-0 sm:w-28', type.caption, 'font-semibold'),
  spinner:
    'h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]',
  stepActive: 'bg-[color:var(--pour-accent)] font-semibold text-white shadow-sm shadow-black/15',
  stepIdle: cn('border border-[color:var(--glass-border-subtle)] font-medium', ink.subtle, glass.surface),
  stepLineDone: 'bg-[color:var(--pour-accent)]',
  stepLineTodo: 'bg-[color:var(--glass-border-subtle)]',
  link: 'font-semibold text-[color:var(--pour-accent)] underline-offset-2 hover:text-[color:var(--pour-accent-hover)] hover:underline',
  timelineDot: 'mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--pour-accent)] ring-2 ring-[color:var(--pour-accent-ring)]',
  dataRowCard: cn(
    'rounded-xl p-4 outline-none transition-[box-shadow,background-color] pour-desktop:p-4',
    glass.surface,
    ink.base,
    'focus-within:bg-white/70 focus-within:shadow-[inset_0_0_0_2px_var(--pour-accent-ring),var(--glass-shadow-sm)]',
  ),
  dataRowFields: 'space-y-2',
  dataRowLabel: cn(type.overline, 'tracking-wider text-[color:var(--pour-ink-2)]'),
  dataRowValue: cn(type.detail, 'font-semibold leading-tight', ink.base),
  dataRowActions:
    'mt-3 flex flex-wrap justify-end gap-2 border-t border-[color:var(--glass-border)] pt-3',
  actions: {
    panelBody: cn(space.cardPadTight, 'flex flex-col gap-3'),
    buttonRow: 'flex min-w-0 flex-wrap items-center gap-2',
    strip:
      'flex flex-col gap-2.5 border-t border-[color:var(--glass-border)] bg-white/20 px-4 py-3 backdrop-blur-md pour-desktop:flex-row pour-desktop:flex-wrap pour-desktop:items-center pour-desktop:gap-x-2 pour-desktop:gap-y-2 pour-desktop:px-5 pour-desktop:py-3.5',
    sectionLabel: cn(type.overline, 'w-full basis-full text-[color:var(--pour-ink-2)]'),
  },
  dataRowEmpty: cn(
    'rounded-xl px-5 py-10 text-center text-sm font-medium',
    glass.surface,
    ink.muted,
  ),
} as const

/** การ์ดมือถือแบบกระชับ — คู่กับ tableCompact ในหน้า admin */
export const adminDataRow = {
  card: cn(rq.dataRowCard, 'p-3 text-xs leading-tight'),
  fields: 'space-y-1',
  label: cn(rq.dataRowLabel, 'text-[10px]'),
  value: cn(rq.dataRowValue, 'text-xs font-medium'),
  actions: cn(rq.dataRowActions, 'mt-2 gap-1.5 pt-2'),
} as const
