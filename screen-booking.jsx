// Booking flow — mobile 3-step + PC 2-column step 1.

function StepHeader({ step, total = 3, title, subtitle }) {
  return (
    <div style={{ paddingBottom:8 }}>
      <TopBar
        left={<IconButton icon={step === 1 ? 'close' : 'back'}/>}
        right={<button style={{ background:'transparent', border:0, color:POUR.ink2, font:'inherit', fontSize:13, cursor:'pointer' }}>Save draft</button>}
        title="New order"
        subtitle={`Step ${step} of ${total}`}
      />
      {/* Progress */}
      <div style={{ padding:'4px 18px 18px', display:'flex', gap:6 }}>
        {Array.from({ length:total }).map((_,i) => (
          <div key={i} style={{
            flex:1, height:3, borderRadius:99,
            background: i < step ? POUR.blue : POUR.bg3,
            transition:'all .2s',
          }}/>
        ))}
      </div>
      <div style={{ padding:'0 20px' }}>
        <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:600, color:POUR.ink0, letterSpacing:'-0.015em' }}>{title}</h2>
        <div style={{ fontSize:13.5, color:POUR.ink1, lineHeight:1.4 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
      <div className="pour-caps">{children}</div>
      {hint && <div style={{ fontSize:11, color:POUR.ink2 }}>{hint}</div>}
    </div>
  );
}

// ─── Step 1 — mobile ──────────────────────────────────────
function BookingStep1() {
  const [psi, setPsi] = React.useState('4000');
  const [qty, setQty] = React.useState(22);
  const [slump, setSlump] = React.useState(5);
  const [addits, setAddits] = React.useState(['fiber']);
  const toggleAdd = a => setAddits(addits.includes(a) ? addits.filter(x=>x!==a) : [...addits,a]);

  const mixes = [
    { psi:'3000', sub:'Sidewalks, slabs'  },
    { psi:'4000', sub:'Footings, walls'   },
    { psi:'5000', sub:'Suspended, decks'  },
    { psi:'6000', sub:'High-strength'     },
  ];

  return (
    <div className="pour-screen">
      <StepHeader step={1} title="Mix & volume" subtitle="Pick strength class and cubic yards needed."/>

      <div className="pour-scroll" style={{ padding:'20px 20px' }}>
        <FieldLabel hint="ASTM C94">Strength class</FieldLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:22 }}>
          {mixes.map(m => {
            const on = psi === m.psi;
            return (
              <div key={m.psi} onClick={() => setPsi(m.psi)} style={{
                padding:'14px', borderRadius:12, cursor:'pointer',
                background: on ? POUR.blueGlow : '#fff',
                border:`1.5px solid ${on ? POUR.blue : POUR.line}`,
                position:'relative', transition:'all .15s',
              }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span className="pour-mono" style={{ fontSize:22, fontWeight:700, color:POUR.ink0 }}>{m.psi}</span>
                  <span style={{ fontSize:11, color:POUR.ink2 }}>PSI</span>
                </div>
                <div style={{ fontSize:11.5, color:POUR.ink2, marginTop:2 }}>{m.sub}</div>
                {on && (
                  <div style={{ position:'absolute', top:10, right:10, width:18, height:18, borderRadius:99,
                    background:POUR.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="check" size={10} stroke={3}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <FieldLabel hint="cubic yards">Volume</FieldLabel>
        <div className="pour-card" style={{ padding:'16px', marginBottom:22,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={() => setQty(Math.max(1,qty-1))} style={{
            width:40, height:40, borderRadius:10, background:POUR.bg2,
            border:`1px solid ${POUR.line}`, color:POUR.ink0, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><Icon name="minus" size={18} stroke={2}/></button>
          <div style={{ textAlign:'center' }}>
            <div className="pour-mono" style={{ fontSize:36, fontWeight:700, color:POUR.ink0, letterSpacing:'-0.02em' }}>{qty.toFixed(1)}</div>
            <div style={{ fontSize:11, color:POUR.ink2, marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              cubic yards · ~{Math.round(qty*1.8)} tons
            </div>
          </div>
          <button onClick={() => setQty(qty+1)} style={{
            width:40, height:40, borderRadius:10, background:POUR.bg2,
            border:`1px solid ${POUR.line}`, color:POUR.ink0, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><Icon name="plus" size={18} stroke={2}/></button>
        </div>

        <FieldLabel hint={`${slump}"`}>Slump target</FieldLabel>
        <div style={{ position:'relative', padding:'8px 4px 30px', marginBottom:8 }}>
          <div style={{ height:6, background:POUR.bg3, borderRadius:99, position:'relative' }}>
            <div style={{
              position:'absolute', left:0, top:0, height:6, borderRadius:99,
              width:`${(slump/8)*100}%`,
              background:`linear-gradient(90deg, ${POUR.blueDeep}, ${POUR.blue})`,
            }}/>
            <div style={{
              position:'absolute', top:'50%', left:`${(slump/8)*100}%`,
              width:22, height:22, borderRadius:99, background:'#fff',
              border:`2px solid ${POUR.blue}`,
              transform:'translate(-50%,-50%)',
              boxShadow:'0 1px 4px rgba(0,0,0,0.12)',
            }}/>
          </div>
          <input type="range" min={2} max={8} value={slump} onChange={e=>setSlump(+e.target.value)}
            style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:10.5, color:POUR.ink3 }}>
            {['2"','4"','6"','8"'].map(v => <span key={v} className="pour-mono">{v}</span>)}
          </div>
        </div>

        <FieldLabel>Additives</FieldLabel>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {['Air-entrained','Fiber','Accelerator','Retarder','Plasticizer'].map(a => {
            const on = addits.includes(a.toLowerCase());
            return (
              <div key={a} onClick={() => toggleAdd(a.toLowerCase())} style={{
                padding:'7px 12px', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:500,
                background: on ? POUR.blueGlow : '#fff',
                border:`1.5px solid ${on ? POUR.blue : POUR.line}`,
                color: on ? POUR.blue : POUR.ink1,
                display:'flex', alignItems:'center', gap:5, transition:'all .15s',
              }}>
                {on && <Icon name="check" size={11} stroke={2.5}/>}
                {a}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding:'14px 20px 28px', borderTop:`1px solid ${POUR.line}`,
        display:'flex', alignItems:'center', gap:12, background:'#fff' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:POUR.ink2, textTransform:'uppercase', letterSpacing:'0.06em' }}>Estimate</div>
          <div className="pour-mono" style={{ fontSize:18, fontWeight:700, color:POUR.ink0 }}>
            ${(qty*178).toLocaleString()}<span style={{ fontSize:11, color:POUR.ink2, fontWeight:400, marginLeft:4 }}>+ tax</span>
          </div>
        </div>
        <button className="pour-btn" style={{ width:'auto', padding:'0 24px' }}>
          Continue <Icon name="arrow" size={16}/>
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — mobile ──────────────────────────────────────
function BookingStep2() {
  const [site, setSite] = React.useState('foundry');
  const [date, setDate] = React.useState(15);
  const [time, setTime] = React.useState('07:30');
  const times = ['06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'];
  const days = [
    { d:13, dow:'Wed', label:'Today' },{ d:14, dow:'Thu' },{ d:15, dow:'Fri' },
    { d:16, dow:'Sat' },{ d:17, dow:'Sun' },{ d:18, dow:'Mon' },{ d:19, dow:'Tue' },
  ];
  const sites = [
    { id:'foundry', name:'Foundry Lofts · Block C', addr:'1414 Iron St · Bay 3 entry', tag:'Active' },
    { id:'harbor',  name:'Harbor & 11th · Tower A', addr:'1101 Harbor Blvd · West dock' },
    { id:'new',     name:'+ New jobsite',            addr:'Drop pin or enter address', dashed:true },
  ];

  return (
    <div className="pour-screen">
      <StepHeader step={2} title="Jobsite & schedule" subtitle="Where the pour lands and when trucks roll."/>
      <div className="pour-scroll" style={{ padding:'20px 20px' }}>
        <FieldLabel hint="3 saved">Jobsite</FieldLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:22 }}>
          {sites.map(s => {
            const on = site === s.id;
            return (
              <div key={s.id} onClick={() => setSite(s.id)} style={{
                padding:'14px', borderRadius:12, cursor:'pointer',
                background: on ? POUR.blueGlow : '#fff',
                border:`${s.dashed?'1.5px dashed':'1.5px solid'} ${on ? POUR.blue : POUR.line}`,
                display:'flex', alignItems:'flex-start', gap:12, transition:'all .15s',
              }}>
                <div style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  background: on ? POUR.blue : POUR.bg2, color: on ? '#fff' : POUR.ink2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon name={s.dashed ? 'plus' : 'pin'} size={16}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14, fontWeight:600, color: s.dashed ? POUR.ink2 : POUR.ink0 }}>{s.name}</span>
                    {s.tag && <span style={{ fontSize:9.5, padding:'2px 6px', borderRadius:4,
                      background:POUR.bg3, color:POUR.ink2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.tag}</span>}
                  </div>
                  <div style={{ fontSize:11.5, color:POUR.ink2, marginTop:3 }}>{s.addr}</div>
                </div>
              </div>
            );
          })}
        </div>

        <FieldLabel hint="May 2026">Delivery date</FieldLabel>
        <div style={{ display:'flex', gap:6, marginBottom:20, overflowX:'auto', scrollbarWidth:'none' }}>
          {days.map(d => {
            const on = date === d.d;
            return (
              <div key={d.d} onClick={() => setDate(d.d)} style={{
                flex:'0 0 48px', padding:'10px 0', borderRadius:12, cursor:'pointer', textAlign:'center',
                background: on ? POUR.blue : '#fff',
                border:`1.5px solid ${on ? POUR.blue : POUR.line}`,
                transition:'all .15s',
              }}>
                <div style={{ fontSize:10, color: on ? 'rgba(255,255,255,0.8)' : POUR.ink2, fontWeight:600,
                  letterSpacing:'0.06em', textTransform:'uppercase' }}>{d.dow}</div>
                <div className="pour-mono" style={{ fontSize:18, fontWeight:700, color: on ? '#fff' : POUR.ink0, marginTop:3 }}>{d.d}</div>
                {d.label && <div style={{ fontSize:9, color: on ? 'rgba(255,255,255,0.7)' : POUR.ink3, marginTop:1 }}>{d.label}</div>}
              </div>
            );
          })}
        </div>

        <FieldLabel hint="30-min windows">Departure time</FieldLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
          {times.map(t => {
            const on = time === t;
            const sold = t === '08:00' || t === '10:30';
            return (
              <div key={t} onClick={() => !sold && setTime(t)} style={{
                padding:'10px 0', borderRadius:10, textAlign:'center', fontSize:13, cursor: sold ? 'not-allowed' : 'pointer',
                background: on ? POUR.blue : (sold ? POUR.bg2 : '#fff'),
                border:`1.5px solid ${on ? POUR.blue : POUR.line}`,
                color: sold ? POUR.ink3 : (on ? '#fff' : POUR.ink0),
                textDecoration: sold ? 'line-through' : 'none', transition:'all .15s',
              }}>
                <span className="pour-mono" style={{ fontWeight: on ? 600 : 400 }}>{t}</span>
              </div>
            );
          })}
        </div>

        <FieldLabel>Site contact</FieldLabel>
        <div className="pour-card" style={{ padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:99, background:`linear-gradient(135deg,${POUR.bg3},${POUR.bg4})`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:POUR.ink0 }}>RB</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5, fontWeight:600 }}>Ray Beckmann · Foreman</div>
            <div className="pour-mono" style={{ fontSize:12, color:POUR.ink2, marginTop:1 }}>+1 (415) 555-0193</div>
          </div>
          <Icon name="edit" size={16}/>
        </div>

        <FieldLabel>Access notes</FieldLabel>
        <textarea className="pour-input" rows={3}
          defaultValue="Crane access from north gate. Pump on level 3 — call Ray on approach."
          style={{ resize:'none', fontSize:13, lineHeight:1.5 }}/>
      </div>

      <div style={{ padding:'14px 20px 28px', borderTop:`1px solid ${POUR.line}`,
        display:'flex', gap:10, background:'#fff' }}>
        <button className="pour-btn ghost" style={{ width:'auto', padding:'0 18px' }}>Back</button>
        <button className="pour-btn" style={{ flex:1 }}>Review <Icon name="arrow" size={16}/></button>
      </div>
    </div>
  );
}

// ─── Step 3 — mobile ──────────────────────────────────────
function BookingStep3() {
  return (
    <div className="pour-screen">
      <StepHeader step={3} title="Review & dispatch" subtitle="Confirm ticket. Trucks dispatch the moment you place the order."/>

      <div className="pour-scroll" style={{ padding:'16px 20px' }}>
        {/* Summary card */}
        <div className="pour-card pour-hatched" style={{ padding:'18px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div className="pour-caps">Order summary</div>
              <div className="pour-mono" style={{ fontSize:11, color:POUR.ink2, marginTop:2 }}>Draft · PR-4083</div>
            </div>
            <StatusBadge status="scheduled" size="md"/>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:14 }}>
            <span className="pour-mono" style={{ fontSize:32, fontWeight:700, color:POUR.ink0, letterSpacing:'-0.02em' }}>22.0</span>
            <span style={{ fontSize:13, color:POUR.ink2 }}>CY · 4000 PSI · fiber</span>
          </div>
          <div style={{ marginTop:14, paddingTop:14, borderTop:`1px dashed ${POUR.line2}`,
            display:'grid', gridTemplateColumns:'auto 1fr', gap:'8px 14px', fontSize:12.5 }}>
            {[
              ['Jobsite','Foundry Lofts · Block C\n1414 Iron St · Gate 8842'],
              ['Departure','Fri May 15 · 07:30'],
              ['Slump','5" · pump-grade'],
              ['Contact','Ray Beckmann · Foreman'],
            ].map(([k,v]) => (
              <React.Fragment key={k}>
                <div style={{ color:POUR.ink2 }}>{k}</div>
                <div style={{ color:POUR.ink0 }}>{v}</div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <FieldLabel>Purchase order</FieldLabel>
        <input className="pour-input pour-mono" defaultValue="PO-2026-0114" style={{ marginBottom:14, fontSize:13 }}/>

        <FieldLabel>Cost center</FieldLabel>
        <div className="pour-input" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, cursor:'pointer' }}>
          <span>Block C · Foundation</span><Icon name="chevDn" size={16}/>
        </div>

        {/* Cost breakdown */}
        <div className="pour-card" style={{ padding:'14px 16px', marginBottom:14 }}>
          {[
            ['Material · 22 CY @ $178/CY','$3,916.00'],
            ['Fiber additive · 22 CY @ $12','$264.00'],
            ['Short-load fee','—'],
            ['Delivery · 7.4 mi','$185.00'],
            ['Tax · 8.5%','$370.04'],
          ].map(([k,v],i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0',
              fontSize:12.5, borderTop: i ? `1px dashed ${POUR.line}` : 'none' }}>
              <span style={{ color:POUR.ink1 }}>{k}</span>
              <span className="pour-mono" style={{ color: v==='—' ? POUR.ink3 : POUR.ink0 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop:8, paddingTop:10, borderTop:`1px solid ${POUR.line2}`,
            display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Total due net-30</span>
            <span className="pour-mono" style={{ fontSize:18, fontWeight:700, color:POUR.ink0 }}>$4,735.04</span>
          </div>
        </div>

        <div style={{ padding:'12px 14px', borderRadius:12, fontSize:11.5, color:POUR.ink2, lineHeight:1.55,
          background:POUR.bg2, border:`1px solid ${POUR.line}`, display:'flex', gap:10 }}>
          <Icon name="info" size={16}/>
          <div>Short-pours under 6 CY incur a $90/CY fee. Cancellations after 6 AM day-of forfeit the dispatch fee. <span className="pour-link">Full terms</span></div>
        </div>
      </div>

      <div style={{ padding:'14px 20px 28px', borderTop:`1px solid ${POUR.line}`,
        display:'flex', gap:10, background:'#fff' }}>
        <button className="pour-btn ghost" style={{ width:'auto', padding:'0 18px' }}>Back</button>
        <button className="pour-btn" style={{ flex:1 }}><Icon name="check" size={16} stroke={2.4}/> Place order</button>
      </div>
    </div>
  );
}

// ─── PC screen — step 1 with sidebar + 2-col layout ───────
function PCBookingScreen() {
  const [psi, setPsi] = React.useState('4000');
  const [qty, setQty] = React.useState(22);
  const [slump, setSlump] = React.useState(5);
  const [addits, setAddits] = React.useState(['fiber']);
  const toggleAdd = a => setAddits(addits.includes(a) ? addits.filter(x=>x!==a) : [...addits,a]);

  const steps = ['Mix & volume','Jobsite & schedule','Review & dispatch'];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:POUR.sans }}>
      <PCSidebar active="orders"/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header + step indicator */}
        <div style={{ padding:'12px 24px', background:'#fff', borderBottom:`1px solid ${POUR.line}`,
          display:'flex', alignItems:'center', gap:16 }}>
          <button className="pour-btn ghost" style={{ width:'auto', padding:'0 12px', height:36, fontSize:13 }}>
            <Icon name="close" size={14}/>
          </button>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:POUR.ink0 }}>New order</div>
            <div style={{ fontSize:11, color:POUR.ink2 }}>PR-4083 · Draft</div>
          </div>
          <div style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center', gap:4 }}>
            {steps.map((s,i) => (
              <React.Fragment key={i}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:8,
                  background: i===0 ? POUR.blueGlow : 'transparent' }}>
                  <div style={{
                    width:22, height:22, borderRadius:99, flexShrink:0, fontSize:11, fontWeight:700,
                    background: i===0 ? POUR.blue : POUR.bg3,
                    color: i===0 ? '#fff' : POUR.ink2,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{i+1}</div>
                  <span style={{ fontSize:13, fontWeight: i===0 ? 600 : 400, color: i===0 ? POUR.blue : POUR.ink2 }}>{s}</span>
                </div>
                {i < steps.length-1 && <div style={{ width:24, height:1, background:POUR.line }}/>}
              </React.Fragment>
            ))}
          </div>
          <button style={{ background:'transparent', border:0, color:POUR.ink2, font:'inherit', fontSize:13, cursor:'pointer', padding:'6px 12px', borderRadius:6 }}>
            Save draft
          </button>
        </div>

        {/* 2-col content */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px', overflow:'hidden' }}>
          {/* Form */}
          <div className="pour-pc-scroll" style={{ padding:'28px 32px' }}>
            <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:600, color:POUR.ink0, letterSpacing:'-0.015em' }}>Mix & volume</h2>
            <p style={{ margin:'0 0 24px', fontSize:14, color:POUR.ink2 }}>Pick strength class and how many cubic yards you need.</p>

            {/* Strength */}
            <div style={{ marginBottom:24 }}>
              <div className="pour-caps" style={{ marginBottom:10 }}>Strength class <span style={{ color:POUR.ink3, fontWeight:400, textTransform:'none', letterSpacing:0 }}>ASTM C94</span></div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[{psi:'3000',sub:'Sidewalks'},{psi:'4000',sub:'Footings'},{psi:'5000',sub:'Suspended'},{psi:'6000',sub:'High-strength'}].map(m => {
                  const on = psi===m.psi;
                  return (
                    <div key={m.psi} onClick={() => setPsi(m.psi)} style={{
                      padding:'14px 12px', borderRadius:10, cursor:'pointer',
                      border:`1.5px solid ${on ? POUR.blue : POUR.line}`,
                      background: on ? POUR.blueGlow : '#fff', transition:'all .15s', position:'relative',
                    }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                        <span className="pour-mono" style={{ fontSize:20, fontWeight:700, color:POUR.ink0 }}>{m.psi}</span>
                        <span style={{ fontSize:10, color:POUR.ink2 }}>PSI</span>
                      </div>
                      <div style={{ fontSize:11.5, color:POUR.ink2, marginTop:2 }}>{m.sub}</div>
                      {on && <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:99,
                        background:POUR.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon name="check" size={9} stroke={3}/>
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Volume */}
            <div style={{ marginBottom:24 }}>
              <div className="pour-caps" style={{ marginBottom:10 }}>Volume (cubic yards)</div>
              <div className="pour-card" style={{ padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <button onClick={() => setQty(Math.max(1,qty-1))} style={{
                  width:36, height:36, borderRadius:8, background:POUR.bg2, border:`1px solid ${POUR.line}`,
                  color:POUR.ink0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                }}><Icon name="minus" size={16} stroke={2}/></button>
                <div style={{ textAlign:'center' }}>
                  <div className="pour-mono" style={{ fontSize:32, fontWeight:700, color:POUR.ink0 }}>{qty.toFixed(1)}</div>
                  <div style={{ fontSize:11, color:POUR.ink2, marginTop:2 }}>CY · ~{Math.round(qty*1.8)} tons</div>
                </div>
                <button onClick={() => setQty(qty+1)} style={{
                  width:36, height:36, borderRadius:8, background:POUR.bg2, border:`1px solid ${POUR.line}`,
                  color:POUR.ink0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                }}><Icon name="plus" size={16} stroke={2}/></button>
              </div>
            </div>

            {/* Slump */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
                <div className="pour-caps">Slump target</div>
                <span className="pour-mono" style={{ fontSize:14, fontWeight:700, color:POUR.ink0 }}>{slump}"</span>
              </div>
              <div style={{ position:'relative', padding:'4px 0 20px' }}>
                <div style={{ height:6, background:POUR.bg3, borderRadius:99, position:'relative' }}>
                  <div style={{ position:'absolute', left:0, top:0, height:6, borderRadius:99,
                    width:`${(slump/8)*100}%`, background:`linear-gradient(90deg,${POUR.blueDeep},${POUR.blue})` }}/>
                  <div style={{ position:'absolute', top:'50%', left:`${(slump/8)*100}%`,
                    width:20, height:20, borderRadius:99, background:'#fff', border:`2px solid ${POUR.blue}`,
                    transform:'translate(-50%,-50%)', boxShadow:'0 1px 4px rgba(0,0,0,0.12)' }}/>
                </div>
                <input type="range" min={2} max={8} value={slump} onChange={e=>setSlump(+e.target.value)}
                  style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }}/>
              </div>
            </div>

            {/* Additives */}
            <div>
              <div className="pour-caps" style={{ marginBottom:10 }}>Additives</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['Air-entrained','Fiber','Accelerator','Retarder','Plasticizer'].map(a => {
                  const on = addits.includes(a.toLowerCase());
                  return (
                    <div key={a} onClick={() => toggleAdd(a.toLowerCase())} style={{
                      padding:'7px 14px', borderRadius:999, cursor:'pointer', fontSize:13, fontWeight:500,
                      background: on ? POUR.blueGlow : '#fff',
                      border:`1.5px solid ${on ? POUR.blue : POUR.line}`,
                      color: on ? POUR.blue : POUR.ink1,
                      display:'flex', alignItems:'center', gap:6, transition:'all .15s',
                    }}>
                      {on && <Icon name="check" size={11} stroke={2.5}/>}
                      {a}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary panel */}
          <div style={{ background:'#fff', borderLeft:`1px solid ${POUR.line}`, display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px', borderBottom:`1px solid ${POUR.line}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:POUR.ink0, marginBottom:14 }}>Order summary</div>
              {[
                ['Strength', psi+' PSI'],
                ['Volume',   qty.toFixed(1)+' CY'],
                ['Slump',    slump+'"'],
                ['Additives', addits.length ? addits.join(', ') : '—'],
              ].map(([k,v],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0',
                  fontSize:13, borderTop: i ? `1px solid ${POUR.line}` : 'none' }}>
                  <span style={{ color:POUR.ink2 }}>{k}</span>
                  <span className="pour-mono" style={{ color:POUR.ink0, fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'20px', borderBottom:`1px solid ${POUR.line}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                <span style={{ fontSize:12, color:POUR.ink2 }}>Estimate</span>
              </div>
              <div className="pour-mono" style={{ fontSize:26, fontWeight:700, color:POUR.ink0 }}>
                ${(qty*178).toLocaleString()}
              </div>
              <div style={{ fontSize:11.5, color:POUR.ink2, marginTop:4 }}>+ tax · confirmed at dispatch</div>
            </div>
            <div style={{ padding:'20px', borderBottom:`1px solid ${POUR.line}` }}>
              <div style={{ padding:'12px', borderRadius:10, background:POUR.bg2, fontSize:12, color:POUR.ink2, lineHeight:1.55, display:'flex', gap:8 }}>
                <Icon name="info" size={14}/>
                <div>Short-pours under 6 CY incur a $90/CY fee.</div>
              </div>
            </div>
            <div style={{ padding:'20px', marginTop:'auto' }}>
              <button className="pour-btn">Continue to jobsite <Icon name="arrow" size={16}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BookingStep1, BookingStep2, BookingStep3, PCBookingScreen });
