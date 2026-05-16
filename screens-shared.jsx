// Shared design tokens, primitives, icons — POUR concrete-order PWA.
// Light / clean industrial theme. Tabular figures via LINE Seed + tnum where needed.

const POUR = {
  bg:        '#f5f6f8',
  bg1:       '#ffffff',
  bg2:       '#f0f2f5',
  bg3:       '#e8ebf0',
  bg4:       '#dde1e8',
  line:      '#e2e6ec',
  line2:     '#c8ced8',
  ink0:      '#111827',
  ink1:      '#374151',
  ink2:      '#6b7280',
  ink3:      '#9ca3af',
  blue:      '#2563eb',
  blueDeep:  '#1d4ed8',
  blueGlow:  'rgba(37,99,235,0.10)',
  blueRing:  'rgba(37,99,235,0.25)',
  pending:   '#6b7280',
  scheduled: '#2563eb',
  enroute:   '#d97706',
  pouring:   '#0891b2',
  complete:  '#16a34a',
  cancelled: '#dc2626',
  sans: '"LINE Seed Sans", ui-sans-serif, system-ui, sans-serif',
  mono: '"LINE Seed Sans", ui-sans-serif, system-ui, sans-serif',
};

if (typeof document !== 'undefined' && !document.getElementById('pour-base')) {
  const seed = document.createElement('link');
  seed.rel = 'stylesheet';
  seed.href = '/fonts/line-seed-sans.css';
  document.head.appendChild(seed);

  const s = document.createElement('style');
  s.id = 'pour-base';
  s.textContent = `
    .pour-screen {
      font-family: ${POUR.sans}; color: ${POUR.ink0}; background: ${POUR.bg};
      width:100%; height:100%; overflow:hidden; display:flex; flex-direction:column;
      letter-spacing:-0.005em; -webkit-font-smoothing:antialiased;
      padding-top:54px;
    }
    .pour-screen *,.pour-screen *::before,.pour-screen *::after{box-sizing:border-box}
    .pour-scroll{flex:1;overflow-y:auto;overflow-x:hidden}
    .pour-scroll::-webkit-scrollbar{display:none}
    .pour-mono{font-family:${POUR.mono};font-variant-numeric:tabular-nums;font-feature-settings:"tnum","ss01"}
    .pour-caps{text-transform:uppercase;letter-spacing:0.07em;font-size:11px;font-weight:600;color:${POUR.ink2}}
    .pour-link{color:${POUR.blue};text-decoration:none;font-weight:500}
    .pour-input{
      width:100%;background:${POUR.bg2};border:1.5px solid ${POUR.line};
      color:${POUR.ink0};border-radius:12px;padding:13px 14px;
      font:inherit;font-size:15px;transition:border-color .15s,background .15s,box-shadow .15s;
    }
    .pour-input:focus{outline:none;border-color:${POUR.blue};background:#fff;box-shadow:0 0 0 3px ${POUR.blueGlow}}
    .pour-input::placeholder{color:${POUR.ink3}}
    .pour-btn{
      display:flex;align-items:center;justify-content:center;gap:8px;
      width:100%;height:50px;border-radius:12px;border:0;
      background:${POUR.blue};color:#fff;font:inherit;font-size:15px;font-weight:600;
      cursor:pointer;transition:background .15s,transform .05s;
      box-shadow:0 1px 2px rgba(37,99,235,0.25),0 4px 12px rgba(37,99,235,0.18);
    }
    .pour-btn:hover{background:${POUR.blueDeep}}
    .pour-btn:active{transform:translateY(1px)}
    .pour-btn.ghost{
      background:#fff;color:${POUR.ink0};box-shadow:none;
      border:1.5px solid ${POUR.line};
    }
    .pour-btn.ghost:hover{background:${POUR.bg2};border-color:${POUR.line2}}
    .pour-card{background:#fff;border:1px solid ${POUR.line};border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
    .pour-hatched{
      background-image:repeating-linear-gradient(135deg,
        rgba(37,99,235,0.025) 0 1px,transparent 1px 8px);
    }
    .pour-bottomnav{
      display:flex;align-items:center;justify-content:space-around;
      padding:10px 18px 26px;border-top:1px solid ${POUR.line};background:#fff;
    }
    .pour-bottomnav .item{
      display:flex;flex-direction:column;align-items:center;gap:3px;
      color:${POUR.ink3};font-size:10.5px;font-weight:500;padding:6px 10px;cursor:pointer;
    }
    .pour-bottomnav .item.active{color:${POUR.blue}}
    .pour-bottomnav .item.active svg{color:${POUR.blue}}
    .pour-fab{
      position:absolute;right:18px;bottom:88px;
      width:54px;height:54px;border-radius:16px;
      background:${POUR.blue};color:#fff;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 16px rgba(37,99,235,0.35),0 1px 3px rgba(37,99,235,0.25);
      cursor:pointer;
    }
    .pour-divider{height:1px;background:${POUR.line}}
    .pour-pc-screen{
      font-family:${POUR.sans};color:${POUR.ink0};background:${POUR.bg};
      width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;
      letter-spacing:-0.005em;-webkit-font-smoothing:antialiased;
    }
    .pour-pc-screen *,.pour-pc-screen *::before,.pour-pc-screen *::after{box-sizing:border-box}
    .pour-pc-scroll{flex:1;overflow-y:auto;overflow-x:hidden}
    .pour-pc-scroll::-webkit-scrollbar{width:6px}
    .pour-pc-scroll::-webkit-scrollbar-thumb{background:${POUR.line2};border-radius:3px}
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────
function StatusBadge({ status, dot = true, size = 'sm' }) {
  const map = {
    pending:   { label:'Pending',   c: POUR.pending   },
    scheduled: { label:'Scheduled', c: POUR.scheduled },
    enroute:   { label:'En route',  c: POUR.enroute   },
    pouring:   { label:'Pouring',   c: POUR.pouring   },
    complete:  { label:'Complete',  c: POUR.complete  },
    cancelled: { label:'Cancelled', c: POUR.cancelled },
  };
  const m = map[status] || map.pending;
  const tall = size === 'md';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: tall ? '5px 10px' : '3px 9px 3px 8px',
      borderRadius:999,
      background:`color-mix(in oklab, ${m.c} 12%, transparent)`,
      border:`1px solid color-mix(in oklab, ${m.c} 28%, transparent)`,
      color:m.c, fontSize: tall ? 12 : 11, fontWeight:600,
      letterSpacing:'0.02em', whiteSpace:'nowrap',
    }}>
      {dot && <span style={{ width:6, height:6, borderRadius:99, background:m.c, flexShrink:0 }}/>}
      {m.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// PourMark — brand icon
// ─────────────────────────────────────────────────────────
function PourMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display:'block' }}>
      <defs>
        <pattern id="pmHatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
        </pattern>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={POUR.blue}/>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#pmHatch)"/>
      <path d="M11 9H17.5Q22.5 9 22.5 14.2Q22.5 19.4 17.5 19.4H14.2V23H11ZM14.2 16.4H17.2Q19.3 16.4 19.3 14.2Q19.3 12 17.2 12H14.2Z" fill="#fff"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Icon library — single-stroke 24×24, currentColor
// ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, stroke = 1.7 }) => {
  const paths = {
    back:    <path d="M15 5l-7 7 7 7"/>,
    close:   <><path d="M6 6l12 12"/><path d="M18 6l-12 12"/></>,
    plus:    <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    search:  <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
    filter:  <><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></>,
    chevron: <path d="M9 6l6 6-6 6"/>,
    chevDn:  <path d="M6 9l6 6 6-6"/>,
    home:    <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z"/>,
    list:    <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></>,
    truck:   <><rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
    user:    <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-4 4.5-5 7-5s5.5 1 7 5"/></>,
    bell:    <><path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5z"/><path d="M10 21h4"/></>,
    map:     <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></>,
    phone:   <path d="M5 4h3l2 5-2 1.5a11 11 0 005.5 5.5L15 14l5 2v3a2 2 0 01-2 2A15 15 0 013 7a2 2 0 012-2z"/>,
    chat:    <path d="M4 5h16v11H8l-4 4z"/>,
    pin:     <><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock:   <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
    calendar:<><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/></>,
    check:   <path d="M5 12.5L10 17l9-10"/>,
    minus:   <path d="M5 12h14"/>,
    drop:    <path d="M12 3.5c4 5 6 8 6 11a6 6 0 11-12 0c0-3 2-6 6-11z"/>,
    layers:  <><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></>,
    arrow:   <><path d="M5 12h14"/><path d="M14 5l7 7-7 7"/></>,
    share:   <><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 11l7-4"/><path d="M8.5 13l7 4"/></>,
    flag:    <><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></>,
    edit:    <><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></>,
    dots:    <><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></>,
    info:    <><circle cx="12" cy="12" r="8.5"/><path d="M12 11v6"/><circle cx="12" cy="8" r=".8" fill="currentColor"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.2-8.8-1.4 1.4M6.6 17.4l-1.4 1.4m0-12.8 1.4 1.4m10.8 10.8 1.4 1.4"/></>,
    logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ display:'block', flex:'0 0 auto' }}>
      {paths[name]}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────
// Mobile primitives
// ─────────────────────────────────────────────────────────
function TopBar({ title, left, right, subtitle }) {
  return (
    <div style={{
      padding:'4px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between',
      borderBottom:'1px solid transparent', minHeight:52,
    }}>
      <div style={{ width:36, display:'flex', justifyContent:'flex-start' }}>{left}</div>
      <div style={{ textAlign:'center', flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:600, color:POUR.ink0, lineHeight:1.1 }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:POUR.ink2, marginTop:2 }}>{subtitle}</div>}
      </div>
      <div style={{ width:36, display:'flex', justifyContent:'flex-end', gap:6 }}>{right}</div>
    </div>
  );
}

function IconButton({ icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:36, height:36, borderRadius:10, background:'transparent',
      border:`1px solid ${POUR.line}`, color:POUR.ink1,
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', padding:0,
    }}>
      <Icon name={icon} size={18}/>
    </button>
  );
}

function SectionHead({ caps, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'18px 18px 8px' }}>
      <div className="pour-caps">{caps}</div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PC Frame — browser chrome wrapper
// ─────────────────────────────────────────────────────────
function PCFrame({ children }) {
  return (
    <div style={{
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      background:POUR.bg, fontFamily:POUR.sans, WebkitFontSmoothing:'antialiased',
    }}>
      {/* Browser chrome */}
      <div style={{
        height:38, background:POUR.bg2, borderBottom:`1px solid ${POUR.line}`,
        display:'flex', alignItems:'center', padding:'0 14px', gap:10, flexShrink:0,
      }}>
        <div style={{ display:'flex', gap:6 }}>
          {['#ff5f57','#ffbd2e','#28c840'].map((c,i) => (
            <div key={i} style={{ width:11, height:11, borderRadius:99, background:c }}/>
          ))}
        </div>
        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <div style={{
            height:24, width:240, background:'#fff', borderRadius:6,
            border:`1px solid ${POUR.line}`, display:'flex', alignItems:'center',
            padding:'0 10px', gap:6,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke={POUR.ink3} strokeWidth="1.2"/>
              <path d="M5 1v4l2 2" stroke={POUR.ink3} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize:11.5, color:POUR.ink2, fontFamily:POUR.mono }}>app.pour.co</span>
          </div>
        </div>
        <div style={{ width:60 }}/>
      </div>
      {/* App content */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PC Sidebar
// ─────────────────────────────────────────────────────────
function PCSidebar({ active = 'orders' }) {
  const items = [
    { id:'orders',   icon:'list',     label:'Orders'   },
    { id:'map',      icon:'map',      label:'Map'      },
    { id:'schedule', icon:'calendar', label:'Schedule' },
  ];
  return (
    <div style={{
      width:220, flexShrink:0, borderRight:`1px solid ${POUR.line}`,
      background:'#fff', display:'flex', flexDirection:'column',
    }}>
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:`1px solid ${POUR.line}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <PourMark size={30}/>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:POUR.ink0, letterSpacing:'-0.01em' }}>POUR</div>
            <div style={{ fontSize:10.5, color:POUR.ink2 }}>Ironwork Co · Dispatch</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ padding:'10px 8px', flex:1 }}>
        <div className="pour-caps" style={{ padding:'6px 10px 8px', color:POUR.ink3 }}>Workspace</div>
        {items.map(item => {
          const on = item.id === active;
          return (
            <div key={item.id} style={{
              display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
              borderRadius:8, marginBottom:1, cursor:'pointer', fontSize:14,
              fontWeight: on ? 600 : 400,
              background: on ? POUR.blueGlow : 'transparent',
              color: on ? POUR.blue : POUR.ink1,
            }}>
              <Icon name={item.icon} size={16}/>
              {item.label}
            </div>
          );
        })}
        <div className="pour-caps" style={{ padding:'18px 10px 8px', color:POUR.ink3 }}>Account</div>
        {[{id:'account',icon:'user',label:'Profile'},{id:'settings',icon:'settings',label:'Settings'}].map(item => (
          <div key={item.id} style={{
            display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
            borderRadius:8, marginBottom:1, cursor:'pointer', fontSize:14,
            fontWeight:400, color:POUR.ink1,
          }}>
            <Icon name={item.icon} size={16}/>
            {item.label}
          </div>
        ))}
      </nav>
      {/* User footer */}
      <div style={{
        padding:'12px 14px', borderTop:`1px solid ${POUR.line}`,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{
          width:30, height:30, borderRadius:99, background:POUR.blue, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:700, color:'#fff',
        }}>MA</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:POUR.ink0 }}>M. Alvarez</div>
          <div style={{ fontSize:11, color:POUR.ink2 }}>Dispatcher</div>
        </div>
        <Icon name="logout" size={14} stroke={1.5}/>
      </div>
    </div>
  );
}

Object.assign(window, {
  POUR, StatusBadge, PourMark, Icon,
  TopBar, IconButton, SectionHead,
  PCFrame, PCSidebar,
});
