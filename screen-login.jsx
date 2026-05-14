// Login — mobile (blue hero + clean form) + PC (split panel).

// ─── Mobile ───────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = React.useState('m.alvarez@ironwork.co');
  const [pw, setPw] = React.useState('');
  const [remember, setRemember] = React.useState(true);

  return (
    <div className="pour-screen" style={{ paddingTop:0 }}>
      {/* Blue hero */}
      <div style={{
        position:'relative', height:300, flexShrink:0, overflow:'hidden',
        background:`linear-gradient(160deg, ${POUR.blueDeep} 0%, ${POUR.blue} 100%)`,
      }}>
        {/* Hatch overlay */}
        <svg style={{ position:'absolute', inset:0, opacity:0.12, pointerEvents:'none' }} width="100%" height="100%">
          <defs>
            <pattern id="lgHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#fff" strokeWidth="1.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lgHatch)"/>
        </svg>

        {/* Status bar spacer */}
        <div style={{ height:54 }}/>

        {/* Logo row */}
        <div style={{ position:'absolute', top:60, left:20, display:'flex', alignItems:'center', gap:10 }}>
          <PourMark size={28}/>
          <div style={{ fontWeight:700, fontSize:16, letterSpacing:'0.04em', color:'#fff' }}>POUR</div>
          <div style={{
            marginLeft:4, display:'flex', alignItems:'center', gap:5, fontSize:11,
            color:'rgba(255,255,255,0.7)', padding:'4px 9px', borderRadius:999,
            border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)',
          }}>
            <span style={{ width:5, height:5, borderRadius:99, background:POUR.complete }}/>
            Dispatch online
          </div>
        </div>

        {/* Headline */}
        <div style={{ position:'absolute', bottom:28, left:20, right:20 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', color:'rgba(255,255,255,0.65)',
            textTransform:'uppercase', marginBottom:8 }}>Concrete dispatch · v2.4</div>
          <h1 style={{ margin:0, fontSize:30, lineHeight:1.1, fontWeight:600, color:'#fff', letterSpacing:'-0.02em' }}>
            Welcome back.
          </h1>
          <div style={{ marginTop:8, color:'rgba(255,255,255,0.75)', fontSize:14, lineHeight:1.5 }}>
            Sign in to manage pours, dispatch trucks, and sign tickets in the field.
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="pour-scroll" style={{ padding:'24px 20px 16px', background:'#fff' }}>
        <label style={{ display:'block', fontSize:12, fontWeight:600, color:POUR.ink2,
          textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Work email</label>
        <input className="pour-input pour-mono" value={email} onChange={e=>setEmail(e.target.value)}
          style={{ marginBottom:16, fontSize:14 }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:POUR.ink2, textTransform:'uppercase', letterSpacing:'0.07em' }}>Password</label>
          <a className="pour-link" style={{ fontSize:12 }}>Forgot?</a>
        </div>
        <input className="pour-input" type="password" placeholder="••••••••••"
          style={{ marginBottom:16, fontSize:14 }}/>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22, cursor:'pointer' }}
          onClick={() => setRemember(!remember)}>
          <div style={{
            width:20, height:20, borderRadius:6, flexShrink:0,
            border:`1.5px solid ${remember ? POUR.blue : POUR.line2}`,
            background: remember ? POUR.blue : '#fff',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
            transition:'all .15s',
          }}>
            {remember && <Icon name="check" size={12} stroke={2.5}/>}
          </div>
          <div style={{ fontSize:13, color:POUR.ink1 }}>Stay signed in on this device</div>
        </div>

        <button className="pour-btn" style={{ marginBottom:14 }}>
          Sign in <Icon name="arrow" size={16}/>
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0 14px', color:POUR.ink3, fontSize:11 }}>
          <div style={{ flex:1, height:1, background:POUR.line }}/>
          <span className="pour-caps" style={{ color:POUR.ink3 }}>or</span>
          <div style={{ flex:1, height:1, background:POUR.line }}/>
        </div>

        <button className="pour-btn ghost">Continue with SSO</button>
      </div>

      <div style={{ padding:'14px 20px 28px', textAlign:'center', fontSize:11, color:POUR.ink2, background:'#fff' }}>
        Need an account? <span className="pour-link">Contact your dispatcher</span>
      </div>
    </div>
  );
}

// ─── PC ───────────────────────────────────────────────────
function PCLoginScreen() {
  const [email, setEmail] = React.useState('m.alvarez@ironwork.co');
  const [pw, setPw] = React.useState('');
  const [remember, setRemember] = React.useState(true);

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:POUR.sans, WebkitFontSmoothing:'antialiased' }}>
      {/* Left — brand panel */}
      <div style={{
        width:'42%', flexShrink:0, position:'relative', overflow:'hidden',
        background:`linear-gradient(160deg, ${POUR.blueDeep} 0%, ${POUR.blue} 100%)`,
        display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'44px 48px',
      }}>
        <svg style={{ position:'absolute', inset:0, opacity:0.10, pointerEvents:'none' }} width="100%" height="100%">
          <defs>
            <pattern id="pcLgHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#fff" strokeWidth="1.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pcLgHatch)"/>
        </svg>

        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
          <PourMark size={36}/>
          <div style={{ fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>POUR</div>
        </div>

        <div style={{ position:'relative' }}>
          <h1 style={{ margin:'0 0 14px', fontSize:34, fontWeight:600, color:'#fff', lineHeight:1.1, letterSpacing:'-0.02em' }}>
            Concrete dispatch,<br/>down to the yard.
          </h1>
          <p style={{ margin:'0 0 32px', fontSize:14.5, color:'rgba(255,255,255,0.75)', lineHeight:1.65 }}>
            Order, track, and sign off pours from field or office — in one place.
          </p>
          {[
            { icon:'truck',  text:'Real-time truck tracking & ETA' },
            { icon:'drop',   text:'Mix, slump & additive spec management' },
            { icon:'layers', text:'Digital tickets synced to QuickBooks' },
          ].map((f, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14,
              color:'rgba(255,255,255,0.9)', fontSize:14 }}>
              <div style={{
                width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <Icon name={f.icon} size={15}/>
              </div>
              {f.text}
            </div>
          ))}
        </div>

        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8,
          fontSize:12, color:'rgba(255,255,255,0.55)' }}>
          <span style={{ width:7, height:7, borderRadius:99, background:POUR.complete }}/>
          All systems operational · v2.4
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        background:POUR.bg, padding:'48px',
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <h2 style={{ margin:'0 0 6px', fontSize:28, fontWeight:600, color:POUR.ink0, letterSpacing:'-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ margin:'0 0 28px', fontSize:14, color:POUR.ink2 }}>
            Sign in to your Ironwork Co dispatcher account.
          </p>

          <label style={{ display:'block', fontSize:12, fontWeight:600, color:POUR.ink2,
            textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Work email</label>
          <input className="pour-input pour-mono" value={email} onChange={e=>setEmail(e.target.value)}
            style={{ marginBottom:16, fontSize:14 }}/>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
            <label style={{ fontSize:12, fontWeight:600, color:POUR.ink2, textTransform:'uppercase', letterSpacing:'0.07em' }}>Password</label>
            <a className="pour-link" style={{ fontSize:12 }}>Forgot password?</a>
          </div>
          <input className="pour-input" type="password" placeholder="••••••••••"
            style={{ marginBottom:16, fontSize:14 }}/>

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, cursor:'pointer' }}
            onClick={() => setRemember(!remember)}>
            <div style={{
              width:18, height:18, borderRadius:5, flexShrink:0,
              border:`1.5px solid ${remember ? POUR.blue : POUR.line2}`,
              background: remember ? POUR.blue : '#fff',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
              transition:'all .15s',
            }}>
              {remember && <Icon name="check" size={11} stroke={2.5}/>}
            </div>
            <span style={{ fontSize:13, color:POUR.ink1 }}>Stay signed in</span>
          </div>

          <button className="pour-btn" style={{ marginBottom:12, fontSize:15 }}>
            Sign in <Icon name="arrow" size={16}/>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0', color:POUR.ink3 }}>
            <div style={{ flex:1, height:1, background:POUR.line }}/>
            <span className="pour-caps" style={{ color:POUR.ink3 }}>or</span>
            <div style={{ flex:1, height:1, background:POUR.line }}/>
          </div>

          <button className="pour-btn ghost">Continue with SSO</button>

          <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:POUR.ink2 }}>
            Need access? <span className="pour-link">Contact your dispatcher</span>
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, PCLoginScreen });
