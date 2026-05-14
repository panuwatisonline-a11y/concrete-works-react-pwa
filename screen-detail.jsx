// Order detail — mobile full-scroll + PC split-column.

const TIMELINE = [
  { t:'06:42', label:'Order placed',       sub:'by m.alvarez@ironwork.co',            done:true  },
  { t:'06:44', label:'Dispatch confirmed', sub:'Plant 3 · Bayshore',                   done:true  },
  { t:'07:12', label:'Mix loaded',         sub:'Truck 14 · 22.0 CY · 4000 PSI · fiber', done:true  },
  { t:'07:31', label:'En route',           sub:'Departing 7.4 mi · ETA 9 min',          done:true, active:true },
  { t:'—',     label:'Arrived on site',    sub:'Foreman Ray sign-in',                    done:false },
  { t:'—',     label:'Pour begins',        sub:'Pump primed · slab pour',                done:false },
  { t:'—',     label:'Wash-out',           sub:'On-site wash station',                   done:false },
  { t:'—',     label:'Ticket signed',      sub:'Delivered to QuickBooks',                done:false },
];

// Shared timeline renderer
function TimelineList({ compact = false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: compact ? 12 : 0 }}>
      {TIMELINE.map((ev, i) => {
        const last = i === TIMELINE.length - 1;
        const dotColor = ev.active ? POUR.enroute : (ev.done ? POUR.complete : POUR.ink3);
        return (
          <div key={i} style={{ display:'flex', gap:12, position:'relative',
            paddingBottom: compact ? 0 : (last ? 0 : 16) }}>
            {!last && !compact && (
              <div style={{
                position:'absolute', left:8, top:20, bottom:0, width:1.5,
                background: ev.done && TIMELINE[i+1].done ? POUR.complete : POUR.line,
              }}/>
            )}
            {/* Dot */}
            <div style={{ flex:'0 0 18px', paddingTop:2 }}>
              <div style={{
                width:18, height:18, borderRadius:99,
                border:`2px solid ${dotColor}`,
                background: ev.done ? dotColor : '#fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: ev.active ? `0 0 0 3px rgba(217,119,6,0.15)` : 'none',
                color:'#fff',
              }}>
                {ev.done && !ev.active && <Icon name="check" size={9} stroke={3}/>}
                {ev.active && <div style={{ width:6, height:6, borderRadius:99, background:'#fff' }}/>}
              </div>
            </div>
            {/* Text */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}>
                <span style={{
                  fontSize: compact ? 13 : 13.5,
                  fontWeight: ev.active ? 600 : (ev.done ? 500 : 400),
                  color: ev.done || ev.active ? POUR.ink0 : POUR.ink2,
                }}>{ev.label}</span>
                <span className="pour-mono" style={{
                  fontSize:11.5, flexShrink:0,
                  color: ev.active ? POUR.enroute : POUR.ink3,
                  fontWeight: ev.active ? 600 : 400,
                }}>{ev.t}</span>
              </div>
              <div style={{ fontSize:11.5, color:POUR.ink2, marginTop:1, lineHeight:1.4 }}>{ev.sub}</div>
              {ev.active && (
                <div style={{
                  marginTop:8, padding:'8px 10px', borderRadius:8, fontSize:11.5,
                  background:`color-mix(in oklab, ${POUR.enroute} 8%, transparent)`,
                  border:`1px solid color-mix(in oklab, ${POUR.enroute} 22%, transparent)`,
                  color:POUR.ink1, display:'flex', gap:8, alignItems:'center',
                }}>
                  <Icon name="info" size={13}/>
                  Heads up — temp dropping to 48°F. Crew confirmed blankets staged.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mobile screen ────────────────────────────────────────
function DetailScreen() {
  return (
    <div className="pour-screen">
      <TopBar
        left={<IconButton icon="back"/>}
        right={<IconButton icon="share"/>}
        title="PR-4082"
        subtitle="Foundry Lofts · Block C"
      />

      <div className="pour-scroll">
        {/* Live hero */}
        <div style={{
          margin:'4px 16px 14px', padding:'16px', borderRadius:18,
          background:'#fff', border:`1px solid color-mix(in oklab, ${POUR.enroute} 30%, ${POUR.line})`,
          position:'relative', overflow:'hidden',
          boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <svg style={{ position:'absolute', inset:0, opacity:0.35, pointerEvents:'none' }} width="100%" height="100%">
            <defs>
              <pattern id="dhatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="3" stroke={POUR.enroute} strokeWidth="0.8" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dhatch)"/>
          </svg>

          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <StatusBadge status="enroute" size="md"/>
              <div style={{ marginTop:10, display:'flex', alignItems:'baseline', gap:6 }}>
                <span className="pour-mono" style={{ fontSize:34, fontWeight:700, color:POUR.ink0, letterSpacing:'-0.02em' }}>9</span>
                <span style={{ fontSize:14, color:POUR.ink1 }}>min ETA · arriving <span className="pour-mono" style={{ color:POUR.ink0 }}>09:47</span></span>
              </div>
              <div style={{ marginTop:4, fontSize:12, color:POUR.ink2 }}>
                Truck 14 · last ping <span className="pour-mono">38 s</span> ago
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:POUR.complete }}>
                <span style={{ width:6, height:6, borderRadius:99, background:POUR.complete,
                  animation:'pourpulse 1.6s ease-in-out infinite' }}/>
                Live
              </div>
              <div style={{
                width:52, height:52, borderRadius:12, background:POUR.bg2,
                border:`1px solid ${POUR.line}`, display:'flex', alignItems:'center',
                justifyContent:'center', color:POUR.enroute,
              }}>
                <Icon name="truck" size={24}/>
              </div>
            </div>
          </div>

          {/* Route bar */}
          <div style={{ position:'relative', marginTop:14 }}>
            <div style={{ height:5, background:POUR.bg2, borderRadius:99, position:'relative', border:`1px solid ${POUR.line}` }}>
              <div style={{
                position:'absolute', left:0, top:0, height:'100%', width:'72%', borderRadius:99,
                background:`linear-gradient(90deg, ${POUR.complete}, ${POUR.enroute})`,
              }}/>
              <div style={{
                position:'absolute', top:'50%', left:'72%', width:12, height:12,
                borderRadius:99, background:'#fff', border:`2px solid ${POUR.enroute}`,
                transform:'translate(-50%,-50%)',
              }}/>
            </div>
            <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', fontSize:10.5, color:POUR.ink2 }}>
              <span>Plant 3 · Bayshore</span>
              <span className="pour-mono">7.4 mi · 72%</span>
              <span>Block C</span>
            </div>
          </div>
        </div>

        {/* Driver row */}
        <div style={{ margin:'0 16px 14px', display:'flex', gap:8 }}>
          <div className="pour-card" style={{ flex:1, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:99, background:'linear-gradient(135deg,#c97a4a,#6a3f24)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>DM</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Damon Marek</div>
              <div className="pour-mono" style={{ fontSize:11, color:POUR.ink2, marginTop:1 }}>Driver · Truck 14</div>
            </div>
          </div>
          <button className="pour-btn ghost" style={{ width:46, height:46, flex:'0 0 auto', padding:0 }}><Icon name="phone" size={18}/></button>
          <button className="pour-btn ghost" style={{ width:46, height:46, flex:'0 0 auto', padding:0 }}><Icon name="chat" size={18}/></button>
        </div>

        {/* Spec grid */}
        <SectionHead caps="Order spec"/>
        <div style={{ margin:'0 16px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { label:'Mix',       val:'4000 PSI', sub:'ASTM C94 · fiber' },
            { label:'Volume',    val:'22.0 CY',  sub:'~39.6 tons'       },
            { label:'Slump',     val:'5"',        sub:'Pump-grade'       },
            { label:'Aggregate', val:'3/4"',      sub:'Crushed limestone'},
          ].map(s => (
            <div key={s.label} className="pour-card" style={{ padding:'12px' }}>
              <div style={{ fontSize:10, color:POUR.ink2, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600 }}>{s.label}</div>
              <div className="pour-mono" style={{ fontSize:18, fontWeight:700, color:POUR.ink0, marginTop:4 }}>{s.val}</div>
              <div style={{ fontSize:11, color:POUR.ink2, marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <SectionHead caps="Timeline" action={<span style={{ fontSize:11, color:POUR.ink2 }}><span className="pour-mono">8</span> events</span>}/>
        <div style={{ padding:'0 16px 16px' }}>
          <div className="pour-card" style={{ padding:'14px' }}>
            <TimelineList/>
          </div>
        </div>

        {/* Ticket */}
        <SectionHead caps="Ticket" action={<span className="pour-link" style={{ fontSize:12 }}>Open PDF</span>}/>
        <div style={{ margin:'0 16px 28px' }}>
          <div className="pour-card" style={{ padding:'14px' }}>
            {[['PO','PO-2026-0114'],['Cost center','Block C · Foundation'],['Total · net 30','$4,735.04']].map(([k,v],i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0',
                fontSize:12.5, borderTop: i ? `1px solid ${POUR.line}` : 'none' }}>
                <span style={{ color:POUR.ink2 }}>{k}</span>
                <span className={i===2?'pour-mono':''} style={{ color:POUR.ink0, fontWeight:i===2?600:400 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ padding:'12px 20px 26px', borderTop:`1px solid ${POUR.line}`,
        display:'flex', gap:10, background:'#fff' }}>
        <button className="pour-btn ghost" style={{ width:'auto', padding:'0 18px' }}>
          <Icon name="flag" size={16}/> Flag
        </button>
        <button className="pour-btn" style={{ flex:1 }}>
          Track on map <Icon name="map" size={16}/>
        </button>
      </div>

      <style>{`
        @keyframes pourpulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.5;transform:scale(0.85)}
        }
      `}</style>
    </div>
  );
}

// ─── PC screen ────────────────────────────────────────────
function PCDetailScreen() {
  return (
    <div style={{ display:'flex', height:'100%', fontFamily:POUR.sans }}>
      <PCSidebar active="orders"/>

      {/* Mini order list */}
      <div style={{ width:260, flexShrink:0, borderRight:`1px solid ${POUR.line}`, background:'#fff', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'12px 14px 10px', borderBottom:`1px solid ${POUR.line}`,
          fontSize:12, fontWeight:600, color:POUR.ink0 }}>Today · 4 pours</div>
        <div className="pour-pc-scroll" style={{ flex:1, padding:'8px' }}>
          {ORDERS.slice(0,4).map((o,i) => (
            <div key={o.id} style={{
              padding:'10px 12px', borderRadius:10, marginBottom:3, cursor:'pointer',
              background: i===0 ? `color-mix(in oklab, ${POUR.blue} 8%, #fff)` : 'transparent',
              border:`1px solid ${i===0 ? POUR.blue : 'transparent'}`,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                <span className="pour-mono" style={{ fontSize:11, color:POUR.ink2 }}>{o.id}</span>
                <StatusBadge status={o.status} dot={false}/>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:POUR.ink0, lineHeight:1.2, marginBottom:1 }}>{o.site}</div>
              <div style={{ fontSize:11, color:POUR.ink2 }} className="pour-mono">{o.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="pour-pc-scroll" style={{ flex:1, background:POUR.bg }}>
        {/* Page header */}
        <div style={{ padding:'14px 24px', background:'#fff', borderBottom:`1px solid ${POUR.line}`,
          display:'flex', alignItems:'center', gap:14, position:'sticky', top:0, zIndex:5 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20, fontWeight:700, color:POUR.ink0 }}>PR-4082</span>
              <StatusBadge status="enroute" size="md"/>
            </div>
            <div style={{ fontSize:12, color:POUR.ink2, marginTop:2 }}>Foundry Lofts · Block C · 1414 Iron St</div>
          </div>
          <button className="pour-btn ghost" style={{ width:'auto', padding:'0 14px', height:38, fontSize:13 }}>
            <Icon name="flag" size={14}/> Flag
          </button>
          <button className="pour-btn" style={{ width:'auto', padding:'0 16px', height:38, fontSize:13 }}>
            <Icon name="map" size={14}/> Track on map
          </button>
        </div>

        <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
          {/* Left col */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Live hero card */}
            <div className="pour-card" style={{ padding:'20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, rgba(217,119,6,0.04), transparent)`, pointerEvents:'none' }}/>
              <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <StatusBadge status="enroute" size="md"/>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:12 }}>
                    <span className="pour-mono" style={{ fontSize:40, fontWeight:700, color:POUR.ink0, letterSpacing:'-0.02em' }}>9</span>
                    <span style={{ fontSize:16, color:POUR.ink1 }}>min ETA · arriving <span className="pour-mono" style={{ color:POUR.ink0 }}>09:47</span></span>
                  </div>
                  <div style={{ marginTop:4, fontSize:13, color:POUR.ink2 }}>Truck 14 · last ping <span className="pour-mono">38 s</span> ago</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:POUR.complete }}>
                    <span style={{ width:7, height:7, borderRadius:99, background:POUR.complete }}/>Live tracking
                  </div>
                  <div style={{ width:52, height:52, borderRadius:12, background:POUR.bg2,
                    border:`1px solid ${POUR.line}`, display:'flex', alignItems:'center', justifyContent:'center', color:POUR.enroute }}>
                    <Icon name="truck" size={24}/>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:16 }}>
                <div style={{ height:5, background:POUR.bg2, borderRadius:99, position:'relative', border:`1px solid ${POUR.line}` }}>
                  <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'72%', borderRadius:99,
                    background:`linear-gradient(90deg, ${POUR.complete}, ${POUR.enroute})` }}/>
                  <div style={{ position:'absolute', top:'50%', left:'72%', width:12, height:12, borderRadius:99,
                    background:'#fff', border:`2px solid ${POUR.enroute}`, transform:'translate(-50%,-50%)' }}/>
                </div>
                <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', fontSize:11.5, color:POUR.ink2 }}>
                  <span>Plant 3 · Bayshore</span>
                  <span className="pour-mono">7.4 mi · 72%</span>
                  <span>Block C</span>
                </div>
              </div>
            </div>

            {/* Driver */}
            <div className="pour-card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:99, background:'linear-gradient(135deg,#c97a4a,#6a3f24)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>DM</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:600, color:POUR.ink0 }}>Damon Marek</div>
                <div style={{ fontSize:12, color:POUR.ink2 }}>Driver · Truck 14</div>
              </div>
              <button className="pour-btn ghost" style={{ width:'auto', padding:'0 14px', height:36, fontSize:13 }}><Icon name="phone" size={14}/> Call</button>
              <button className="pour-btn ghost" style={{ width:'auto', padding:'0 14px', height:36, fontSize:13 }}><Icon name="chat" size={14}/> Message</button>
            </div>

            {/* Timeline */}
            <div className="pour-card" style={{ padding:'16px 18px' }}>
              <div style={{ fontSize:14, fontWeight:600, color:POUR.ink0, marginBottom:14 }}>Timeline</div>
              <TimelineList/>
            </div>
          </div>

          {/* Right col */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="pour-card" style={{ padding:'16px' }}>
              <div style={{ fontSize:14, fontWeight:600, color:POUR.ink0, marginBottom:12 }}>Order spec</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'Mix',       val:'4000 PSI', sub:'ASTM C94 · fiber' },
                  { label:'Volume',    val:'22.0 CY',  sub:'~39.6 tons'       },
                  { label:'Slump',     val:'5"',        sub:'Pump-grade'       },
                  { label:'Aggregate', val:'3/4"',      sub:'Crushed limestone'},
                ].map(s => (
                  <div key={s.label} style={{ padding:'10px 12px', borderRadius:8, background:POUR.bg2 }}>
                    <div style={{ fontSize:9.5, color:POUR.ink2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                    <div className="pour-mono" style={{ fontSize:18, fontWeight:700, color:POUR.ink0, marginTop:4 }}>{s.val}</div>
                    <div style={{ fontSize:11, color:POUR.ink2, marginTop:2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pour-card" style={{ padding:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:14, fontWeight:600, color:POUR.ink0 }}>Ticket</div>
                <span className="pour-link" style={{ fontSize:12 }}>Open PDF</span>
              </div>
              {[['PO','PO-2026-0114'],['Cost center','Block C · Foundation'],['Total · net 30','$4,735.04']].map(([k,v],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0',
                  fontSize:13, borderTop: i ? `1px solid ${POUR.line}` : 'none' }}>
                  <span style={{ color:POUR.ink2 }}>{k}</span>
                  <span className={i===2?'pour-mono':''} style={{ color:POUR.ink0, fontWeight:i===2?600:400 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TIMELINE, DetailScreen, PCDetailScreen });
