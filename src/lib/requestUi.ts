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
  detail: cn('text-[13px] font-medium leading-snug md:text-sm', ink.body),
  nav: 'text-sm font-semibold leading-snug',
  navCompact: 'text-xs font-semibold leading-snug',
  title: cn('text-base font-bold tracking-tight', ink.base),
  hero: cn('text-lg font-bold tracking-tight md:text-xl', ink.base),
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

/** Consistent spacing — use across pages & layout */
export const space = {
  page: 'space-y-5 pb-10 pt-4 md:space-y-6 md:pb-12 md:pt-5',
  pageNarrow: 'space-y-5 pb-10 pt-4 md:max-w-4xl md:space-y-6 md:pb-12 md:pt-5',
  section: 'space-y-4 md:space-y-5',
  stackSm: 'space-y-3',
  insetX: 'px-4 sm:px-5 md:px-6',
  insetY: 'py-4 md:py-5',
  cardPad: 'px-5 py-5 md:px-6 md:py-6',
  cardPadHeader: 'px-5 py-4 md:px-6',
  cardPadTight: 'px-5 py-4 md:px-6',
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
    'bg-gradient-to-r from-[#000000] via-[#262626] to-[#525252] bg-clip-text font-extrabold uppercase tracking-tight text-transparent',
  headerBar: cn(
    glass.surface,
    'border-b border-[color:var(--glass-border-subtle)]',
  ),
  navPillActive:
    'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)] ring-1 ring-[color:var(--pour-accent-ring)] backdrop-blur-sm',
  navPillInactive:
    cn(ink.body, 'hover:bg-neutral-900/5 hover:text-[color:var(--pour-ink-0)] backdrop-blur-sm'),
  navPillMobile: type.navCompact,
  navLink: cn('flex items-center gap-3 rounded-xl px-4 py-3', type.nav),
  navSectionLabel: cn('px-2 pb-2', type.overline),
  primaryNavStrip: cn(glass.surface, 'border-b border-[color:var(--glass-border-subtle)]'),
  mainColumnDesktop: cn(
    'md:overflow-hidden md:rounded-2xl md:border md:border-[color:var(--glass-border-subtle)]',
    glass.surface,
  ),
  sidebarSurface: cn('rounded-r-2xl', glass.surface),
  iconTileBrand: 'pour-brand-icon-tile',
  iconButtonChrome: cn(
    glass.surface,
    anim.interactive,
    'inline-flex items-center justify-center rounded-[10px] font-medium',
    cn(ink.body, 'hover:border-[color:var(--glass-edge)] hover:bg-white/90 hover:text-[color:var(--pour-ink-0)]'),
  ),
  breadcrumbStrip: cn(
    glass.surface,
    'rounded-xl border border-[color:var(--glass-border-subtle)]',
    space.insetX,
    'py-2.5 md:py-3',
  ),
  headerBarMobile: 'px-3 py-2',
  primaryNavStripPad: 'px-3 py-2.5',
  drawerPanel: cn(glass.surface, 'border-[color:var(--glass-border-subtle)]'),
  drawerHeader: cn(glass.surfaceMuted, 'border-b border-[color:var(--glass-border-subtle)]'),
} as const

/** App-wide layout chrome */
export const app = {
  shell: cn(
    'flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 pour-shell',
    ink.base,
  ),
  pageAdmin:
    cn('mx-auto flex w-full min-w-0 max-w-none flex-col gap-6 pb-10 pt-4 md:gap-8 md:pb-12 md:pt-5', ink.base),
  pageAdminTitle: cn('block w-full shrink-0 pb-1 pt-0 font-bold tracking-tight', ink.base),
  pageAdminSection: cn('block w-full min-w-0', space.section),
  tableWrap: cn('overflow-x-auto rounded-[14px]', glass.surface),
  tableWrapDesktop: cn(
    'hidden overflow-x-auto rounded-[14px] md:block',
    glass.surface,
  ),
  mobileCardStack: 'space-y-3 md:hidden',
  table: 'w-full text-sm',
  tableHead:
    'border-b-2 border-[color:var(--glass-border-subtle)] bg-white/30 text-left text-xs font-bold uppercase tracking-wide text-[color:var(--pour-ink-2)] backdrop-blur-md [&_th]:px-4 [&_th]:py-3',
  tableBody:
    'divide-y divide-[color:var(--glass-border)] [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_td]:text-[color:var(--pour-ink-0)] [&_td:has(:focus-visible)]:relative [&_td:has(:focus-visible)]:z-[1] [&_td:has(:focus-visible)]:bg-[color:var(--pour-accent-muted)] [&_td:has(:focus-visible)]:shadow-[inset_0_0_0_2px_var(--pour-accent-ring)]',
  tableRowHover: '[&_tr]:transition-colors [&_tr:hover]:bg-[var(--pour-bg)]',
  mutedText: ink.muted,
} as const

/** Shared visual language for /requests/* flows */
export const rq = {
  page: cn('mx-auto w-full min-w-0 max-w-none', space.page, ink.base),
  pageNarrow: cn('mx-auto w-full min-w-0 max-w-3xl md:max-w-4xl', space.pageNarrow, ink.base),
  card: cn('rounded-[14px] overflow-hidden', glass.surface, anim.cardLift, ink.base),
  cardMuted: cn('rounded-[14px] overflow-hidden', glass.surfaceMuted, ink.base),
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
  value: 'text-sm font-semibold text-[color:var(--pour-ink-0)]',
  spinner:
    'h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]',
  stepActive: 'bg-[color:var(--pour-accent)] font-semibold text-white shadow-sm shadow-black/15',
  stepIdle: cn('border border-[color:var(--glass-border-subtle)] font-medium', ink.subtle, glass.surface),
  stepLineDone: 'bg-[color:var(--pour-accent)]',
  stepLineTodo: 'bg-[color:var(--glass-border-subtle)]',
  link: 'font-semibold text-[color:var(--pour-accent)] underline-offset-2 hover:text-[color:var(--pour-accent-hover)] hover:underline',
  timelineDot: 'mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--pour-accent)] ring-2 ring-[color:var(--pour-accent-ring)]',
  dataRowCard: cn(
    'rounded-xl p-4 outline-none transition-[box-shadow,background-color] md:p-4',
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
    buttonRow: 'flex flex-wrap items-center gap-2',
    strip:
      'flex flex-col gap-2.5 border-t border-[color:var(--glass-border)] bg-white/20 px-4 py-3 backdrop-blur-md md:flex-row md:flex-wrap md:items-center md:gap-x-2 md:gap-y-2 md:px-5 md:py-3.5',
    sectionLabel: cn(type.overline, 'w-full basis-full text-[color:var(--pour-ink-2)]'),
  },
  dataRowEmpty: cn(
    'rounded-xl px-5 py-10 text-center text-sm font-medium',
    glass.surface,
    ink.muted,
  ),
} as const
