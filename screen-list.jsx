// Orders list — mobile card list + PC table view.

const ORDERS = [
  {
    id:'PR-4082', site:'Foundry Lofts · Block C',
    addr:'1414 Iron St', dateLabel:'Today', time:'07:30 AM',
    mix:'4000 PSI', qty:22, slump:5, status:'enroute',
    truck:'Truck 14 · ETA 9 min', live:true,
  },
  {
    id:'PR-4081', site:'Harbor & 11th · Tower A',
    addr:'1101 Harbor Blvd', dateLabel:'Today', time:'09:15 AM',
    mix:'5000 PSI · fiber', qty:38, slump:4, status:'scheduled',
    truck:'Crew assigned',
  },
  {
    id:'PR-4080', site:'Vine Industrial · Slab 3',
    addr:'88 Vine Way', dateLabel:'Today', time:'11:00 AM',
    mix:'3000 PSI', qty:14, slump:5, status:'scheduled',
    truck:'Awaiting confirm',
  },
  {
    id:'PR-4079', site:'Riverbend Bridge · Pier 4',
    addr:'Hwy 41 MM 18', dateLabel:'Today', time:'01:45 PM',
    mix:'6000 PSI · rapid', qty:9, slump:3, status:'pending',
    truck:'PO pending approval',
  },
  {
    id:'PR-4078', site:'Maple Heights · Foundation 7',
    addr:'2200 Maple Ave', dateLabel:'Tomorrow', time:'06:00 AM',
    mix:'4000 PSI', qty:28, slump:5, status:'scheduled',
    truck:'2 trucks reserved',
  },
];

// ─── Mobile card ──────────────────────────────────────────
function OrderCard({ o }) {
  const live = o.status === 'enroute' || o.status === 'pouring';
  return (
    <div className="pour-card" style={{
      padding:'14px',
      cursor:'pointer',
      position:'relative',
      ...(live ? { borderColor:'color-mix(in oklab, '+POUR.blue+' 35%, '+POUR.line+')' } : {}),
    }}>
      {live && (
        <span style={{
          position:'absolute', top:-1, left:14, right:14, height:1,
          background:`linear-gradient(90deg, transparent, ${POUR.blue}, transparent)`,
        }}/>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span className="pour-mono" style={{ fontSize:11, color:POUR.ink2, letterSpacing:'0.04em' }}>{o.id}</span>
            <span style={{ width:3, height:3, borderRadius:99, background:POUR.ink3 }}/>
            <span style={{ fontSize:11, color:POUR.ink2 }}>{o.dateLabel} · <span className="pour-mono">{o.time}</span></span>
          </div>
          <div style={{ fontSize:15.5, fontWeight:600, color:POUR.ink0, lineHeight:1.25,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {o.site}
          </div>
          <div style={{ fontSize:12, color:POUR.ink2, marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
            <Icon name="pin" size={11} stroke={1.8}/> {o.addr}
          </div>
        </div>
        <StatusBadge status={o.status}/>
      </div>

      {/* Spec row */}
      <div style={{
        marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0,
        background:POUR.bg2, borderRadius:10, border:`1px solid ${POUR.line}`, padding:'8px 0',
      }}>
        {[['Mix',o.mix],['Volume',`${o.qty} CY`],['Slump',`${o.slump}"`]].map(([lbl,val],i) => (
          <div key={lbl} style={{ padding:'0 12px', borderRight: i<2 ? `1px solid ${POUR.line}` : 'none' }}>
            <div style={{ fontSize:9.5, color:POUR.ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>{lbl}</div>
            <div style={{ fontSize:12, color:POUR.ink0, fontWeight:500, marginTop:2 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:10, display:'flex', alignItems:'center', justifyContent:'space-between',
        fontSize:11.5, color: live ? POUR.blue : POUR.ink2 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="truck" size={13} stroke={1.7}/>
          {o.truck}
        </div>
        <Icon name="chevron" size={14} stroke={1.6}/>
      </div>
    </div>
  );
}

// ─── Mobile screen ────────────────────────────────────────
function OrdersListScreen() {
  const [tab, setTab] = React.useState('today');
  const tabs = [
    { id:'today',    label:'Today',    count:4  },
    { id:'upcoming', label:'Upcoming', count:7  },
    { id:'history',  label:'History',  count:142 },
  ];

  return (
    <div className="pour-screen" style={{ position:'relative' }}>
      {/* App bar */}
      <div style={{ padding:'8px 18px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <PourMark size={26}/>
          <div>
            <div style={{ fontSize:10, color:POUR.ink2, letterSpacing:'0.08em', fontWeight:600, textTransform:'uppercase' }}>IRONWORK CO · DISPATCH</div>
            <div style={{ fontSize:17, fontWeight:600, marginTop:1 }}>Orders</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <IconButton icon="search"/><IconButton icon="bell"/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding:'10px 18px 0', display:'flex', gap:6 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'9px 6px', border:0, borderRadius:10, cursor:'pointer', font:'inherit',
            background: tab===t.id ? POUR.bg3 : 'transparent',
            color: tab===t.id ? POUR.ink0 : POUR.ink2,
            fontSize:13, fontWeight:600,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            {t.label}
            <span className="pour-mono" style={{
              fontSize:10.5, padding:'1px 6px', borderRadius:99,
              background: tab===t.id ? POUR.blue : POUR.bg2,
              color: tab===t.id ? '#fff' : POUR.ink3,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ padding:'14px 18px 4px', display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
        {[{icon:'filter',label:'Filters',solid:true},{label:'All status'},{label:'4000 PSI'},{label:'AM only'}].map((c,i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
            borderRadius:999, whiteSpace:'nowrap', fontSize:12, fontWeight:500, cursor:'pointer',
            background: c.solid ? POUR.bg3 : 'transparent',
            border:`1px solid ${c.solid ? 'transparent' : POUR.line}`,
            color: c.solid ? POUR.ink0 : POUR.ink1,
          }}>
            {c.icon && <Icon name={c.icon} size={12} stroke={1.8}/>}
            {c.label}
            {!c.icon && <Icon name="chevDn" size={11} stroke={1.8}/>}
          </div>
        ))}
      </div>

      {/* Day banner */}
      <div style={{ padding:'14px 18px 6px', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <div className="pour-caps">Wed · May 13 · 4 pours</div>
        <div className="pour-mono" style={{ fontSize:11, color:POUR.ink2 }}>
          <span style={{ color:POUR.ink0 }}>83</span>/120 CY scheduled
        </div>
      </div>

      <div className="pour-scroll" style={{ padding:'4px 18px 110px', display:'flex', flexDirection:'column', gap:10 }}>
        {ORDERS.map(o => <OrderCard key={o.id} o={o}/>)}
      </div>

      {/* FAB */}
      <div className="pour-fab"><Icon name="plus" size={22} stroke={2}/></div>

      <div className="pour-bottomnav">
        <div className="item active"><Icon name="list" size={20}/>Orders</div>
        <div className="item"><Icon name="map" size={20}/>Map</div>
        <div className="item"><Icon name="calendar" size={20}/>Schedule</div>
        <div className="item"><Icon name="user" size={20}/>Account</div>
      </div>
    </div>
  );
}

// ─── PC screen ────────────────────────────────────────────
function PCOrdersListScreen() {
  const [tab, setTab] = React.useState('today');
  const [selected, setSelected] = React.useState('PR-4082');
  const tabs = [{id:'today',label:'Today',count:4},{id:'upcoming',label:'Upcoming',count:7},{id:'history',label:'History',count:142}];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:POUR.sans }}>
      <PCSidebar active="orders"/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{
          padding:'14px 24px', borderBottom:`1px solid ${POUR.line}`, background:'#fff',
          display:'flex', alignItems:'center', gap:16,
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:POUR.ink0, letterSpacing:'-0.02em' }}>Orders</div>
            <div style={{ fontSize:12, color:POUR.ink2, marginTop:1 }}>Wed · May 13 · 4 pours today</div>
          </div>
          {/* Stat pills */}
          {[['83 CY','scheduled today'],['1 active','en route'],['1 pending','awaiting PO']].map(([v,l],i) => (
            <div key={i} style={{
              padding:'8px 16px', borderRadius:10, background:POUR.bg2,
              border:`1px solid ${POUR.line}`, textAlign:'right',
            }}>
              <div className="pour-mono" style={{ fontSize:18, fontWeight:700, color:POUR.ink0 }}>{v}</div>
              <div style={{ fontSize:10.5, color:POUR.ink2 }}>{l}</div>
            </div>
          ))}
          <button className="pour-btn" style={{ width:'auto', padding:'0 18px', height:40, fontSize:14 }}>
            <Icon name="plus" size={15}/> New order
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          padding:'10px 24px', borderBottom:`1px solid ${POUR.line}`, background:'#fff',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <div style={{ display:'flex', background:POUR.bg2, borderRadius:8, padding:3 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                border:0, borderRadius:6, padding:'6px 14px', cursor:'pointer', font:'inherit',
                background: tab===t.id ? '#fff' : 'transparent',
                color: tab===t.id ? POUR.ink0 : POUR.ink2,
                fontWeight: tab===t.id ? 600 : 400, fontSize:13,
                boxShadow: tab===t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display:'flex', alignItems:'center', gap:6, transition:'all .15s',
              }}>
                {t.label}
                <span style={{
                  fontSize:10.5, padding:'1px 5px', borderRadius:4, fontFamily:POUR.mono,
                  background: tab===t.id ? POUR.blue : POUR.bg3,
                  color: tab===t.id ? '#fff' : POUR.ink2,
                }}>{t.count}</span>
              </button>
            ))}
          </div>
          <div style={{ flex:1 }}/>
          <div style={{
            display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
            background:POUR.bg2, borderRadius:8, border:`1px solid ${POUR.line}`, width:220,
          }}>
            <Icon name="search" size={14}/><span style={{ fontSize:13, color:POUR.ink3 }}>Search orders…</span>
          </div>
          <button style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
            border:`1px solid ${POUR.line}`, borderRadius:8, background:'#fff',
            color:POUR.ink1, fontSize:13, cursor:'pointer', font:'inherit',
          }}>
            <Icon name="filter" size={14}/> Filter
          </button>
        </div>

        {/* Orders table */}
        <div className="pour-pc-scroll" style={{ flex:1, padding:'16px 24px', display:'flex', flexDirection:'column', gap:6 }}>
          {/* Column headers */}
          <div style={{
            display:'grid', gridTemplateColumns:'140px 1fr 120px 140px 180px 24px',
            gap:16, padding:'0 14px 8px',
          }}>
            {['Status','Site','Volume','Time','Truck',''].map((h,i) => (
              <div key={i} className="pour-caps" style={{ color:POUR.ink3 }}>{h}</div>
            ))}
          </div>
          {ORDERS.map(o => {
            const on = o.id === selected;
            return (
              <div key={o.id} onClick={() => setSelected(o.id)} className="pour-card" style={{
                padding:'13px 14px', cursor:'pointer',
                display:'grid', gridTemplateColumns:'140px 1fr 120px 140px 180px 24px',
                alignItems:'center', gap:16,
                border:`1px solid ${on ? POUR.blue : POUR.line}`,
                background: on ? `color-mix(in oklab, ${POUR.blue} 6%, #fff)` : '#fff',
                transition:'all .12s',
              }}>
                <StatusBadge status={o.status}/>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:POUR.ink0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.site}</div>
                  <div style={{ fontSize:11.5, color:POUR.ink2, marginTop:1 }}>{o.addr}</div>
                </div>
                <div>
                  <div className="pour-mono" style={{ fontSize:15, fontWeight:700, color:POUR.ink0 }}>{o.qty} CY</div>
                  <div style={{ fontSize:11, color:POUR.ink2 }}>{o.mix}</div>
                </div>
                <div>
                  <div className="pour-mono" style={{ fontSize:13, color:POUR.ink0 }}>{o.time}</div>
                  <div style={{ fontSize:11, color:POUR.ink2 }}>{o.dateLabel}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: o.live ? POUR.enroute : POUR.ink2 }}>
                  <Icon name="truck" size={13}/>{o.truck}
                </div>
                <Icon name="chevron" size={16} stroke={1.5}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ORDERS, OrderCard, OrdersListScreen, PCOrdersListScreen });
