import { cn } from '@/lib/utils'
import { pourPcUi } from '@/lib/pourPcScale'

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

/** @deprecated ใช้ `<AppIcon size="…" />` แทน — เก็บไว้เฉพาะ className layout */
export const ICON_STROKE = 1.75

export const icon = {
  xs: 'shrink-0',
  sm: 'shrink-0',
  md: 'shrink-0',
  lg: 'shrink-0',
} as const

/** สเกลตัวอักษร — Figma frame 1440 บน desktop (ดู fluid-typography.css) */
export const type = {
  tagline: cn('font-normal leading-relaxed', ink.subtle, 'text-pour-xs'),
  overline: cn('text-pour-2xs font-medium uppercase tracking-[0.08em]', ink.subtle),
  caption: cn('text-pour-sm font-normal leading-relaxed', ink.muted),
  body: cn('text-pour-base font-normal leading-relaxed', ink.body),
  bodyStrong: cn('text-pour-base font-medium leading-relaxed', ink.base),
  detail: cn('text-pour-base font-normal leading-relaxed', ink.body),
  nav: 'text-pour-md font-medium leading-relaxed',
  navCompact: 'text-pour-sm font-medium leading-relaxed',
  title: cn('text-pour-lg font-semibold leading-snug', ink.base, 'tracking-[-0.01em]'),
  hero: cn('text-pour-title font-semibold leading-snug', ink.base, 'tracking-[-0.02em]'),
  /** หัวตาราง — ไม่ uppercase หนาเกิน */
  tableHead: cn('text-pour-xs font-medium leading-snug normal-case tracking-normal', ink.subtle),
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
  formGridDialog:
    'grid min-w-0 grid-cols-1 gap-3 pour-desktop:grid-cols-2 pour-desktop:gap-[var(--pour-pc-form-gap)]',
  formField: 'pour-form-field min-w-0 space-y-1.5',
  statGrid2: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-wide:grid-cols-3',
  statGrid3: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-wide:grid-cols-4',
  statGrid5: 'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-wide:grid-cols-5',
  statGrid6:
    'grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 pour-desktop:grid-cols-3 pour-desktop:gap-[var(--pour-pc-form-gap)] pour-wide:grid-cols-6',
} as const

/** Consistent spacing — use across pages & layout */
export const space = {
  page:
    'space-y-6 pb-12 pt-5 pour-desktop:space-y-[var(--pour-pc-section-gap)] pour-desktop:pb-[var(--pour-pc-page-pb)] pour-desktop:pt-[var(--pour-pc-page-pt)] pour-wide:space-y-[var(--pour-pc-section-gap-wide)]',
  pageNarrow:
    'space-y-6 pb-12 pt-5 pour-desktop:space-y-[var(--pour-pc-section-gap)] pour-desktop:pb-[var(--pour-pc-page-pb)] pour-desktop:pt-[var(--pour-pc-page-pt)] pour-wide:space-y-[var(--pour-pc-section-gap-wide)]',
  section:
    'space-y-5 pour-desktop:space-y-[var(--pour-pc-stack-gap)] pour-wide:space-y-[var(--pour-pc-section-gap-wide)]',
  stackSm: 'space-y-3.5 pour-desktop:space-y-[var(--pour-pc-stack-gap)]',
  insetX: 'px-4 sm:px-5 pour-desktop:px-[var(--pour-pc-inset-x)] pour-wide:px-[var(--pour-pc-inset-x-wide)]',
  insetY: 'py-5 pour-desktop:py-[var(--pour-pc-card-py)] pour-wide:py-[var(--pour-pc-inset-y-wide)]',
  cardPad:
    'px-5 py-4 pour-desktop:px-[var(--pour-pc-card-px)] pour-desktop:py-[var(--pour-pc-card-py)] pour-wide:px-[var(--pour-pc-card-px-wide)]',
  cardPadHeader:
    'px-5 py-3.5 pour-desktop:px-[var(--pour-pc-card-px)] pour-desktop:py-[var(--pour-pc-card-header-py)] pour-wide:px-[var(--pour-pc-card-px-wide)]',
  cardPadTight:
    'px-5 py-3.5 pour-desktop:px-[var(--pour-pc-card-px)] pour-desktop:py-[var(--pour-pc-card-header-py)] pour-wide:px-[var(--pour-pc-card-px-wide)]',
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
    'pour-form-control border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] text-[color:var(--pour-ink-0)] placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none',
  picker:
    'pour-form-picker pour-form-control data-pour-no-press border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] text-[color:var(--pour-ink-0)] focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none data-[state=open]:border-[color:var(--pour-accent)]',
} as const

export const theme = {
  shell: 'pour-shell',
  shellDesktopAccent: '',
  brandWordmark:
    'bg-gradient-to-r from-[color:var(--pour-ink-0)] via-[#4da89e] to-[color:var(--pour-brand)] bg-clip-text font-extrabold uppercase tracking-tight text-transparent',
  headerBar: 'bg-[color:var(--pour-bg)] border-b border-[color:var(--pour-line)]',
  navLink: cn('pour-interactive pour-nav-item flex items-center gap-2.5 rounded-lg px-3 py-2', type.nav),
  navSectionLabel: cn('px-3 pb-2 text-pour-2xs font-semibold uppercase tracking-[0.12em]', ink.subtle),
  mainColumnDesktop: cn(
    'bg-[color:var(--pour-bg)]',
    'pour-desktop:flex pour-desktop:min-h-0 pour-desktop:flex-1 pour-desktop:flex-col pour-desktop:overflow-hidden',
  ),
  /** พื้นที่ scroll ใน AppLayout — สีเดียวกับ header ทุกขนาดจอ */
  mainScrollSurface: 'bg-[color:var(--pour-bg)]',
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
  drawerPanel: cn(glass.surfaceStrong, 'border-[color:var(--glass-border-subtle)]'),
  drawerHeader: cn(glass.surfaceStrong, 'border-b border-[color:var(--glass-border-subtle)]'),
  /** เนื้อหารายการใน main */
  mobileListBody:
    'space-y-3 max-[767px]:px-[var(--pour-m-inset-x)] px-4 pb-4 pt-2 pour-desktop:hidden',
  mainScrollPadX: 'max-[767px]:px-[var(--pour-m-inset-x)] px-3 sm:px-4 pour-desktop:px-0',
  /**
   * กรอบเนื้อหาใน main
   * มือถือ: เต็มความกว้าง + mainScrollPadX | desktop: 90% กึ่งกลาง (inset 5% ต่อข้าง)
   */
  contentFrame: 'mx-auto flex min-h-full w-full min-w-0 max-w-full flex-col pour-desktop:w-[90%]',
} as const

/** กรอบเนื้อหาใน AppLayout — เท่าทุกหน้า */
export function getContentMaxClass(_pathname?: string): string {
  return theme.contentFrame
}

/** App-wide layout chrome */
export const app = {
  /** Full-viewport scroll host for standalone auth pages (html/body/#root use overflow:hidden). */
  shellScroll: cn(
    'flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col overflow-y-auto overscroll-y-contain px-4 py-10 pour-shell',
    'pour-desktop:px-[var(--pour-pc-inset-x)] pour-desktop:py-[var(--pour-pc-main-pb-wide)]',
    ink.base,
  ),
  shellInner: 'flex w-full flex-1 flex-col items-center justify-center py-4',
  pageAdmin:
    cn(
      'mx-auto flex w-full min-w-0 max-w-none flex-col gap-4 pb-10 pt-4',
      'pour-desktop:gap-[calc(var(--pour-pc-page-gap)*0.85)] pour-desktop:pb-[var(--pour-pc-page-pb)] pour-desktop:pt-[var(--pour-pc-page-pt)]',
      ink.base,
    ),
  pageAdminTitle: cn(type.title, 'block w-full shrink-0 pb-1 pt-0'),
  pageAdminSection: cn('block w-full min-w-0', space.section),
  /** ตารางเดี่ยว — มุมมน + กรอบบาง */
  tableWrap: cn(
    'pour-table-shell pour-scroll-x min-w-0 max-w-full',
    glass.surface,
    pourPcUi.tableWrap,
    pourPcUi.tableShellNoScroll,
  ),
  tableWrapDesktop: cn(
    'pour-table-shell pour-scroll-x hidden min-w-0 max-w-full pour-desktop:block',
    glass.surface,
    pourPcUi.tableWrap,
    pourPcUi.tableShellNoScroll,
  ),
  /** ตารางปรับความกว้างคอลัมน์ได้ — เลื่อนแนวนอนเมื่อรวมกว้างเกินกรอบ */
  tableWrapResizable: 'pour-table-resizable-wrap pour-desktop:overflow-x-auto',
  /** ตารางใน accordion/section — ไม่ซ้อน glass */
  tableWrapNested: cn('pour-scroll-x min-w-0 max-w-full', pourPcUi.tableWrap, pourPcUi.tableShellNoScroll),
  mobileCardStack: 'space-y-3.5 pour-desktop:hidden',
  table: cn('w-full min-w-[36rem] text-pour-base leading-relaxed', pourPcUi.table),
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
  table: cn(app.table, 'text-pour-sm leading-relaxed', pourPcUi.table),
  head: cn(app.tableHead, '[&_th]:px-2.5 [&_th]:py-2'),
  body: cn(
    app.tableBody,
    app.tableRowHover,
    '[&_td]:max-w-[14rem] pour-desktop:[&_td]:max-w-none [&_td]:px-2.5 [&_td]:py-2 sm:[&_td]:px-3',
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
  header:
    'min-w-0 shrink-0 space-y-1 px-4 pt-4 pr-10 text-left sm:px-5 sm:pt-4 pour-desktop:px-[var(--pour-pc-modal-px)] pour-desktop:pt-[calc(var(--pour-pc-modal-py)*0.85)]',
  body:
    'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 sm:px-5 sm:py-3 pour-desktop:px-[var(--pour-pc-modal-px)] pour-desktop:py-[calc(var(--pour-pc-modal-py)*0.85)]',
  footer:
    'mx-0 !mt-0 shrink-0 !gap-2 !border-t !border-[color:var(--glass-border-subtle)] !px-4 !py-3 !pt-3 sm:!flex-row sm:!justify-end sm:!px-5 sm:!py-3 pour-desktop:!px-[var(--pour-pc-modal-px)] pour-desktop:!py-[calc(var(--pour-pc-modal-footer-py)*0.85)]',
  title: cn(type.title, 'text-pour-md font-semibold'),
} as const

/** ระยะห่างภายใน modal — ใช้คู่กับ modal.shell */
export const modalForm = {
  stack: 'flex flex-col gap-3',
  field: 'flex flex-col gap-1.5',
  label: cn(type.caption, 'font-medium leading-tight text-pour-muted'),
  value: 'min-w-0 text-sm font-medium leading-snug break-words text-[color:var(--pour-ink-0)]',
} as const

/** กรอบซ้อนกัน — ลด border/padding ซ้ำ */
export const frame = {
  section:
    'overflow-hidden rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)]/65',
  sectionBody:
    'min-w-0 px-4 py-4 pour-desktop:px-[var(--pour-pc-card-px)] pour-desktop:py-[var(--pour-pc-card-py)]',
  sectionTitle: cn(type.bodyStrong, 'text-pour-base'),
  insetPanel: 'rounded-xl bg-[color:var(--pour-bg-2)]/60 ring-1 ring-[color:var(--glass-border-subtle)]',
} as const

/** Shared visual language for /requests/* flows */
export const rq = {
  page: cn('mx-auto w-full min-w-0 max-w-none', space.page, ink.base),
  pageNarrow: cn('mx-auto w-full min-w-0 max-w-none', space.pageNarrow, ink.base),
  /** หน้ารายละเอียดคำขอ — ระยะระหว่างบล็อกแน่นกว่า page ทั่วไป */
  pageDetail: cn(
    'mx-auto w-full min-w-0 max-w-none',
    'space-y-3.5 pb-10 pt-4',
    'pour-desktop:space-y-4 pour-desktop:pb-[var(--pour-pc-page-pb)] pour-desktop:pt-[calc(var(--pour-pc-page-pt)*0.85)]',
    'pour-wide:space-y-5',
    ink.base,
  ),
  detailGrid: 'grid min-w-0 gap-3 pour-desktop:grid-cols-2',
  detailFields: 'space-y-1',
  detailImagesContent: 'space-y-3',
  /** หัวการ์ดหน้ารายละเอียด — มีเส้นล่างบนมือถือด้วย (ไม่ปิด border เหมือน cardHeader ทั่วไป) */
  detailCardHeader: cn(
    'gap-0 border-b border-[color:var(--glass-border-subtle)] bg-transparent',
    'px-5 py-2.5 pour-desktop:px-[var(--pour-pc-card-px)] pour-desktop:py-2.5 pour-wide:px-[var(--pour-pc-card-px-wide)]',
  ),
  detailCardContent: cn(space.cardPadTight, '!pt-2.5'),
  card: cn(
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] shadow-none',
    'max-[767px]:border-transparent max-[767px]:shadow-[var(--glass-shadow-sm)]',
    ink.base,
  ),
  /** การ์ดที่มีฟอร์ม — ไม่ยก/หดตอนโฟกัสหรือแตะ */
  cardForm: cn(
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] shadow-none',
    'max-[767px]:border-transparent max-[767px]:shadow-[var(--glass-shadow-sm)]',
    ink.base,
  ),
  cardMuted: cn(
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] shadow-none',
    'max-[767px]:border-transparent',
    ink.base,
  ),
  cardMutedForm: cn(
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] shadow-none',
    'max-[767px]:border-transparent',
    ink.base,
  ),
  cardHeader: cn(
    'border-b border-[color:var(--glass-border-subtle)] bg-transparent max-[767px]:border-b-0',
    space.cardPadHeader,
  ),
  cardTitle: cn(type.bodyStrong, 'font-medium tracking-normal'),
  cardContent: space.cardPad,
  cardContentTight: space.cardPadTight,
  heroTitle: type.hero,
  sub: type.caption,
  label: cn(type.caption, 'font-medium'),
  value: 'min-w-0 text-pour-base font-medium break-words leading-relaxed text-[color:var(--pour-ink-0)]',
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
    'rounded-2xl p-4 outline-none transition-[box-shadow,background-color] pour-desktop:p-4',
    'border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] shadow-none',
    ink.base,
    'focus-within:bg-[color:var(--glass-bg-strong)] focus-within:shadow-[inset_0_0_0_2px_var(--pour-accent-ring)]',
  ),
  dataRowFields: 'space-y-2',
  dataRowLabel: cn(type.overline, 'tracking-wider text-[color:var(--pour-ink-2)]'),
  dataRowValue: cn(type.detail, 'font-medium', ink.base),
  dataRowActions:
    'mt-3 flex flex-wrap justify-end gap-2 border-t border-[color:var(--glass-border)] pt-3',
  actions: {
    panelBody: cn(space.cardPadTight, 'flex flex-col gap-3'),
    panelBodyDense: cn(space.cardPadTight, 'flex flex-col gap-2 !py-3'),
    buttonRow: 'flex min-w-0 flex-wrap items-center gap-2',
    strip:
      'flex flex-col gap-2.5 border-t border-[color:var(--glass-border)] bg-[color:var(--glass-bg-muted)] px-4 py-3 max-[767px]:border-t-0 max-[767px]:bg-transparent pour-desktop:flex-row pour-desktop:flex-wrap pour-desktop:items-center pour-desktop:gap-x-2 pour-desktop:gap-y-2 pour-desktop:px-5 pour-desktop:py-3.5',
    sectionLabel: cn(type.overline, 'w-full basis-full text-[color:var(--pour-ink-2)]'),
  },
  dataRowEmpty: cn(
    'rounded-xl px-5 py-10 text-center text-sm font-medium',
    glass.surface,
    ink.muted,
  ),
} as const

/** Surfaces & states — ใช้แทน bg-[color:var(--glass-bg)] / hex ซ้ำๆ ทั้งแอป */
export const field = {
  error: 'pour-field-error',
} as const

export const surface = {
  panel: 'pour-surface-panel',
  chart: cn(
    'overflow-hidden rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] shadow-[var(--glass-shadow-sm)]',
  ),
  inset: 'rounded-lg bg-[color:var(--pour-bg-2)] ring-1 ring-[color:var(--glass-border-subtle)]',
  empty: 'pour-empty-state',
  error: 'pour-surface-error px-4 py-8 text-center text-sm',
  postpone: 'pour-postpone-callout',
  notice: 'pour-notice-surface',
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
  card: cn(rq.dataRowCard, 'text-pour-base leading-relaxed'),
  fields: 'space-y-2',
  label: cn(rq.dataRowLabel, 'text-pour-xs'),
  value: cn(rq.dataRowValue, 'text-pour-base'),
  actions: cn(rq.dataRowActions, 'mt-3 gap-2 pt-3'),
} as const
