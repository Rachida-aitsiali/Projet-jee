import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:8081/api'

export default function Home() {
  const [scrollY, setScrollY]       = useState(0)
  const [publications, setPublications] = useState([])
  const [events, setEvents]         = useState([])
  const [teams, setTeams]           = useState([])
  const [members, setMembers]       = useState([])
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 })
  const [activeTeam, setActiveTeam] = useState(null)
  const heroRef                     = useRef(null)
  const navigate                    = useNavigate()

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const m = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', m)
    return () => window.removeEventListener('mousemove', m)
  }, [])

  useEffect(() => {
    axios.get(`${API_BASE}/members`).then(r => setMembers(r.data)).catch(() => {})
    axios.get(`${API_BASE}/publications`).then(r => setPublications(r.data.slice(0, 3))).catch(() => {})
    axios.get(`${API_BASE}/events`).then(r => setEvents(r.data.slice(0, 3))).catch(() => {})
    axios.get(`${API_BASE}/teams`).then(r => setTeams(r.data.slice(0, 6))).catch(() => {})
  }, [])

  const parallaxX = (mousePos.x / (window.innerWidth  || 1) - 0.5) * 20
  const parallaxY = (mousePos.y / (window.innerHeight || 1) - 0.5) * 20

  return (
    <div style={{ fontFamily:'"Inter","Segoe UI",sans-serif', overflowX:'hidden', background:'#f8f7ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft  { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes lineGrow  { from{width:0} to{width:56px} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse     { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }
        @keyframes rotate360     { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
        @keyframes counterRotate { from{transform:rotate(0deg)}  to{transform:rotate(-360deg)} }
        @keyframes drawLine  { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
        @keyframes twinkle   { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.6)} }
        @keyframes glitch1 {
          0%,90%,100%{ clip-path:inset(0 0 100% 0); transform:translate(0,0); }
          91%{ clip-path:inset(20% 0 60% 0); transform:translate(-4px,0); }
          93%{ clip-path:inset(60% 0 20% 0); transform:translate(4px,0); }
          95%{ clip-path:inset(40% 0 40% 0); transform:translate(-2px,0); }
          97%{ clip-path:inset(80% 0 5% 0);  transform:translate(2px,0); }
        }
        @keyframes glitch2 {
          0%,90%,100%{ clip-path:inset(0 0 100% 0); transform:translate(0,0); opacity:0; }
          91%{ clip-path:inset(60% 0 20% 0); transform:translate(4px,0); opacity:0.7; }
          93%{ clip-path:inset(10% 0 70% 0); transform:translate(-4px,0); opacity:0.7; }
          95%{ clip-path:inset(50% 0 30% 0); transform:translate(2px,0); opacity:0.7; }
          97%{ clip-path:inset(5% 0 85% 0);  transform:translate(-2px,0); opacity:0.7; }
        }

        .nav-link {
          color:rgba(255,255,255,0.65); text-decoration:none;
          font-size:13px; font-weight:500; letter-spacing:0.5px;
          transition:color 0.3s; position:relative; padding:4px 0;
        }
        .nav-link::after {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:1px; background:linear-gradient(90deg,#7c3aed,#a78bfa);
          transform:scaleX(0); transition:transform 0.3s; transform-origin:left;
        }
        .nav-link:hover { color:white; }
        .nav-link:hover::after { transform:scaleX(1); }

        .glitch-wrap { position:relative; display:inline-block; }
        .glitch-wrap::before,
        .glitch-wrap::after {
          content:attr(data-text);
          position:absolute; top:0; left:0; width:100%; height:100%;
          font-size:inherit; font-weight:inherit;
          letter-spacing:inherit; line-height:inherit;
          background:inherit; -webkit-background-clip:text;
          -webkit-text-fill-color:transparent; background-clip:text;
        }
        .glitch-wrap::before { animation:glitch1 5s infinite; }
        .glitch-wrap::after  { animation:glitch2 5s infinite; }

        .cursor-glow {
          position:fixed; pointer-events:none; z-index:9998;
          width:380px; height:380px; border-radius:50%;
          background:radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%);
          transform:translate(-50%,-50%);
          transition:left 0.08s ease-out, top 0.08s ease-out;
        }

        .btn-main {
          position:relative; overflow:hidden;
          background:linear-gradient(135deg,#7c3aed,#6d28d9);
          color:white; border:none;
          padding:15px 34px; font-size:14px; font-weight:700;
          cursor:pointer; letter-spacing:0.3px; transition:all 0.3s;
          border-radius:2px; white-space:nowrap;
        }
        .btn-main::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent);
          transform:translateX(-100%); transition:transform 0.4s;
        }
        .btn-main:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(124,58,237,0.5); }
        .btn-main:hover::before { transform:translateX(0); }

        .btn-ghost {
          background:transparent; color:rgba(255,255,255,0.85);
          border:1px solid rgba(255,255,255,0.3);
          padding:14px 34px; font-size:14px; font-weight:600;
          cursor:pointer; transition:all 0.3s; border-radius:2px; white-space:nowrap;
        }
        .btn-ghost:hover { border-color:rgba(255,255,255,0.7); color:white; transform:translateY(-3px); background:rgba(255,255,255,0.07); }

        .btn-section {
          background:transparent; color:#7c3aed;
          border:1px solid rgba(124,58,237,0.28);
          padding:10px 24px; font-size:13px; font-weight:600;
          cursor:pointer; transition:all 0.25s; border-radius:4px; white-space:nowrap;
        }
        .btn-section:hover { background:#7c3aed; color:white; box-shadow:0 6px 18px rgba(124,58,237,0.3); }

        .btn-cta-main {
          background:white; color:#120830; border:none;
          padding:18px 40px; font-size:15px; font-weight:800;
          cursor:pointer; width:100%; transition:all 0.3s; border-radius:2px;
        }
        .btn-cta-main:hover { background:#f0eeff; transform:translateY(-2px); box-shadow:0 12px 30px rgba(0,0,0,0.2); }

        .btn-cta-ghost {
          background:transparent; color:rgba(255,255,255,0.7);
          border:1px solid rgba(255,255,255,0.2);
          padding:17px 40px; font-size:15px; font-weight:600;
          cursor:pointer; width:100%; transition:all 0.3s; border-radius:2px;
        }
        .btn-cta-ghost:hover { border-color:rgba(255,255,255,0.55); color:white; transform:translateY(-2px); }

        .team-card {
          position:relative; overflow:hidden; padding:32px;
          background:#f8f7ff; transition:all 0.35s ease; cursor:pointer;
        }
        .team-card::after {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:2px; background:linear-gradient(90deg,#7c3aed,#a78bfa);
          transform:scaleX(0); transition:transform 0.35s; transform-origin:left;
        }
        .team-card:hover { background:white; box-shadow:0 20px 48px rgba(124,58,237,0.12); transform:translateY(-6px); }
        .team-card:hover::after { transform:scaleX(1); }

        .member-card {
          border:1px solid rgba(124,58,237,0.08); background:white;
          padding:28px; text-align:center;
          transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow:0 2px 8px rgba(124,58,237,0.04);
        }
        .member-card:hover { transform:translateY(-6px) scale(1.02); box-shadow:0 18px 42px rgba(124,58,237,0.13); border-color:rgba(124,58,237,0.2); }

        .pub-card {
          padding:28px; background:white;
          border:1px solid rgba(124,58,237,0.07);
          position:relative; overflow:hidden; transition:all 0.3s;
          box-shadow:0 2px 8px rgba(124,58,237,0.04);
        }
        .pub-card::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
          background:linear-gradient(to bottom,#7c3aed,#a78bfa);
          transform:scaleY(0); transform-origin:top; transition:transform 0.3s;
        }
        .pub-card:hover { transform:translateX(6px); box-shadow:0 8px 28px rgba(124,58,237,0.1); border-color:rgba(124,58,237,0.18); }
        .pub-card:hover::before { transform:scaleY(1); }

        .event-card {
          background:white; border:1px solid rgba(124,58,237,0.07);
          overflow:hidden; transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow:0 2px 8px rgba(124,58,237,0.04);
        }
        .event-card:hover { transform:translateY(-6px); box-shadow:0 20px 44px rgba(124,58,237,0.13); border-color:rgba(124,58,237,0.18); }

        .section-eyebrow {
          display:inline-flex; align-items:center; gap:10px;
          font-size:10px; font-weight:700; color:#7c3aed;
          letter-spacing:4px; text-transform:uppercase; margin-bottom:12px;
        }
        .section-eyebrow::before { content:''; display:block; width:24px; height:1px; background:#7c3aed; }

        .scroll-btn {
          position:fixed; bottom:28px; right:28px; z-index:999;
          width:40px; height:40px;
          background:linear-gradient(135deg,#7c3aed,#4c1d95);
          border:none; color:white; font-size:14px; border-radius:4px;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 16px rgba(124,58,237,0.4); transition:all 0.2s;
        }
        .scroll-btn:hover { transform:translateY(-3px); box-shadow:0 8px 22px rgba(124,58,237,0.55); }

        ::-webkit-scrollbar { width:2px; }
        ::-webkit-scrollbar-track { background:#f8f7ff; }
        ::-webkit-scrollbar-thumb { background:linear-gradient(to bottom,#7c3aed,#a78bfa); }
      `}</style>

      {/* Cursor glow */}
      <div className="cursor-glow" style={{ left:mousePos.x, top:mousePos.y }}/>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1000,
        padding:'14px 8%',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background: scrollY > 70 ? 'rgba(6,2,15,0.95)' : 'transparent',
        backdropFilter: scrollY > 70 ? 'blur(24px)' : 'none',
        borderBottom: scrollY > 70 ? '1px solid rgba(124,58,237,0.1)' : 'none',
        transition:'all 0.4s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
          onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
          <div style={{ position:'relative', width:40, height:40, flexShrink:0 }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10, fontWeight:900, zIndex:1 }}>
              LIAS
            </div>
            <div style={{ position:'absolute', inset:-1, border:'1px solid rgba(124,58,237,0.5)', animation:'pulse 3s ease-in-out infinite' }}/>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ color:'white', fontWeight:800, fontSize:14, whiteSpace:'nowrap' }}>Laboratoire LIAS</div>
            <div style={{ color:'rgba(255,255,255,0.28)', fontSize:10, whiteSpace:'nowrap' }}>FSBM · Hassan II · Casablanca</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:36, alignItems:'center' }}>
          {[['Accueil','#hero'],['Équipes','#equipes'],['Publications','#publications'],['Événements','#evenements'],['Contact','#contact']].map(([l,h]) => (
            <a key={l} href={h} className="nav-link">{l}</a>
          ))}
          <button className="btn-main" onClick={() => navigate('/login')} style={{ padding:'9px 22px', fontSize:13 }}>
            Connexion
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <div id="hero" ref={heroRef} style={{ position:'relative', height:'100vh', overflow:'hidden' }}>

        {/* Vidéo background */}
        <video autoPlay muted loop playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}>
          <source src="/video.mp4" type="video/mp4"/>
        </video>

        {/* ── Overlay directionnel : gauche sombre → droite transparent ── */}
        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background:`linear-gradient(
            to right,
            rgba(6,2,15,0.96) 0%,
            rgba(8,3,18,0.88) 30%,
            rgba(10,4,22,0.60) 55%,
            rgba(10,4,22,0.25) 75%,
            rgba(10,4,22,0.08) 100%
          )`,
        }}/>

        {/* Overlay top — assombrir légèrement pour la navbar */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:160, zIndex:1,
          background:'linear-gradient(to bottom,rgba(6,2,15,0.55),transparent)',
          pointerEvents:'none',
        }}/>

        {/* Overlay bottom — transition vers section suivante */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:100, zIndex:1,
          background:'linear-gradient(to bottom,transparent,rgba(6,2,15,0.4))',
          pointerEvents:'none',
        }}/>

        {/* Étoiles scintillantes sur la zone gauche sombre */}
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none' }}>
          {[
            {x:'5%',y:'15%',s:1.5,d:'0s'},{x:'12%',y:'35%',s:2,d:'0.8s'},
            {x:'8%',y:'60%',s:1,d:'1.5s'},{x:'18%',y:'80%',s:1.5,d:'0.4s'},
            {x:'25%',y:'22%',s:1,d:'1.2s'},{x:'30%',y:'50%',s:2,d:'2s'},
            {x:'3%',y:'45%',s:1.5,d:'0.6s'},{x:'20%',y:'70%',s:1,d:'1.8s'},
          ].map((star,i) => (
            <div key={i} style={{
              position:'absolute', left:star.x, top:star.y,
              width:star.s, height:star.s, borderRadius:'50%',
              background:'rgba(167,139,250,0.9)',
              boxShadow:`0 0 ${star.s*3}px rgba(167,139,250,0.6)`,
              animation:`twinkle ${2.5+i*0.4}s ease-in-out infinite`,
              animationDelay:star.d,
            }}/>
          ))}
        </div>

        {/* Grille de fond subtile */}
        <div style={{
          position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
          backgroundImage:`
            linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),
            linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)
          `,
          backgroundSize:'64px 64px',
        }}/>

        {/* Cercle décoratif parallax — sur la zone droite visible */}
        <div style={{
          position:'absolute', zIndex:3, pointerEvents:'none',
          right:'4%', top:'10%',
          transform:`translate(${parallaxX*1.2}px,${parallaxY*1.2}px)`,
          transition:'transform 0.15s ease-out',
          opacity:0.5,
        }}>
          <div style={{ position:'relative', width:260, height:260 }}>
            <div style={{ position:'absolute', inset:0, border:'1px solid rgba(124,58,237,0.2)', borderRadius:'50%', animation:'rotate360 22s linear infinite' }}/>
            <div style={{ position:'absolute', inset:24, border:'1px solid rgba(167,139,250,0.12)', borderRadius:'50%', animation:'counterRotate 16s linear infinite' }}/>
            <div style={{ position:'absolute', inset:58, border:'1px dashed rgba(124,58,237,0.15)', borderRadius:'50%', animation:'rotate360 30s linear infinite' }}/>
            <div style={{ position:'absolute', inset:96, background:'radial-gradient(circle,rgba(124,58,237,0.12),transparent)', borderRadius:'50%' }}/>
            {[0,60,120,180,240,300].map(deg => (
              <div key={deg} style={{
                position:'absolute', width:3, height:3, borderRadius:'50%',
                background:'#a78bfa', opacity:0.6,
                top:'50%', left:'50%',
                transform:`rotate(${deg}deg) translateX(120px) translate(-50%,-50%)`,
              }}/>
            ))}
          </div>
        </div>

        {/* SVG lignes décoratives */}
        <svg style={{ position:'absolute', zIndex:2, inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.1 }}>
          <defs>
            <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0"/>
              <stop offset="50%" stopColor="#a78bfa" stopOpacity="1"/>
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="100%" x2="30%" y2="35%" stroke="url(#lg1)" strokeWidth="0.5" strokeDasharray="1000" style={{ animation:'drawLine 2.5s ease-out 0.5s both' }}/>
          <line x1="0" y1="30%" x2="45%" y2="70%" stroke="url(#lg1)" strokeWidth="0.3" strokeDasharray="1000" style={{ animation:'drawLine 2.5s ease-out 1s both' }}/>
        </svg>

        {/* ── Contenu ── */}
        <div style={{
          position:'relative', zIndex:10,
          height:'100%',
          display:'flex', flexDirection:'column', justifyContent:'center',
          padding:'0 8%', paddingTop:'88px',
          maxWidth:680,
        }}>

          {/* Label discret */}
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            marginBottom:32, animation:'fadeUp 0.6s ease-out 0.2s both',
          }}>
            <div style={{ width:20, height:1, background:'rgba(124,58,237,0.6)' }}/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'2px', fontWeight:500 }}>
              FSBM · Université Hassan II · Casablanca
            </span>
          </div>

          {/* Titre */}
          <div style={{ marginBottom:20 }}>
            <h1 style={{
              fontSize:'clamp(50px,7vw,100px)', fontWeight:900,
              color:'white', letterSpacing:'-3px', lineHeight:0.92,
              animation:'fadeLeft 0.7s ease-out 0.3s both',
            }}>
              Laboratoire
            </h1>
            <h1 style={{ animation:'fadeLeft 0.7s ease-out 0.45s both', display:'inline-block', margin:0 }}>
              <span className="glitch-wrap" data-text="LIAS" style={{
                fontSize:'clamp(50px,7vw,100px)', fontWeight:900,
                letterSpacing:'-3px', lineHeight:0.92,
                background:'linear-gradient(135deg,#e9d5ff 0%,#c4b5fd 30%,#a78bfa 60%,#7c3aed 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                display:'inline-block',
              }}>
                LIAS
              </span>
            </h1>
          </div>

          {/* Ligne déco */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:26, animation:'fadeUp 0.6s ease-out 0.6s both' }}>
            <div style={{ height:1.5, width:56, background:'linear-gradient(90deg,#7c3aed,rgba(167,139,250,0.3))' }}/>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'#a78bfa', flexShrink:0 }}/>
          </div>

          {/* Description */}
          <p style={{
            fontSize:'clamp(15px,1.5vw,19px)', color:'rgba(255,255,255,0.82)',
            fontWeight:400, lineHeight:1.6, maxWidth:440, marginBottom:6,
            animation:'fadeUp 0.6s ease-out 0.7s both',
          }}>
            Laboratoire d'Informatique et Applications Scientifiques
          </p>
          <p style={{
            fontSize:13, color:'rgba(255,255,255,0.35)', marginBottom:46,
            animation:'fadeUp 0.6s ease-out 0.8s both',
          }}>
            Faculté des Sciences Ben M'Sik — Université Hassan II de Casablanca
          </p>

          {/* Boutons */}
          <div style={{ display:'flex', gap:14, animation:'fadeUp 0.6s ease-out 0.9s both' }}>
            <button className="btn-main" onClick={() => navigate('/login')}>
              Accéder au portail →
            </button>
            <button className="btn-ghost" onClick={() => navigate('/register')}>
              Soumettre une candidature
            </button>
          </div>

          {/* Stats — uniquement si données disponibles */}
          {(members.length > 0 || teams.length > 0) && (
            <div style={{
              display:'flex', gap:0, marginTop:52,
              borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:24,
              animation:'fadeUp 0.6s ease-out 1.1s both',
            }}>
              {[
                { n:members.length,      label:'Membres',     show:members.length>0 },
                { n:teams.length,         label:'Équipes',     show:teams.length>0 },
                { n:publications.length, label:'Publications', show:publications.length>0 },
                { n:events.length,        label:'Événements',  show:events.length>0 },
              ].filter(s => s.show).map((s,i,arr) => (
                <div key={i} style={{
                  flex:1, paddingRight:20,
                  borderRight:i<arr.length-1?'1px solid rgba(255,255,255,0.08)':'none',
                  paddingLeft:i>0?20:0,
                }}>
                  <div style={{ fontSize:'clamp(20px,2.2vw,32px)', fontWeight:900, color:'white', letterSpacing:'-1px', lineHeight:1, marginBottom:4 }}>
                    {s.n}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.32)', fontWeight:500, letterSpacing:'1px', textTransform:'uppercase' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div style={{
          position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
          zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          animation:'fadeUp 0.6s ease-out 1.4s both',
        }}>
          <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)', letterSpacing:'3px' }}>SCROLL</span>
          <div style={{
            width:28, height:28, border:'1px solid rgba(167,139,250,0.22)',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation:'float 2s ease-in-out infinite',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 2L5 8M5 8L2 5M5 8L8 5" stroke="rgba(167,139,250,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ══ ÉQUIPES ══ */}
      <div id="equipes" style={{ padding:'96px 8%', background:'#f8f7ff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:52 }}>
          <div>
            <div className="section-eyebrow">Équipes de Recherche</div>
            <h2 style={{ fontSize:'clamp(28px,3.5vw,44px)', fontWeight:800, color:'#1e1b4b', letterSpacing:'-1px', lineHeight:1.1 }}>
              Nos Domaines<br/>d'Excellence
            </h2>
          </div>
          <button className="btn-section" onClick={() => navigate('/login')}>Voir toutes →</button>
        </div>
        {teams.length === 0 ? (
          <p style={{ color:'#94a3b8', fontSize:14 }}>Aucune équipe enregistrée</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(124,58,237,0.07)' }}>
            {teams.map((team,i) => (
              <div key={team.id} className="team-card"
                onMouseEnter={() => setActiveTeam(team.id)}
                onMouseLeave={() => setActiveTeam(null)}>
                <div style={{ width:24, height:1.5, background:'#7c3aed', marginBottom:20 }}/>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1e1b4b', marginBottom:12, lineHeight:1.3 }}>{team.name}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75, marginBottom:20 }}>
                  {team.description || 'Équipe de recherche du laboratoire LIAS'}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#7c3aed' }}>
                  En savoir plus
                  <span style={{ transition:'transform 0.2s', display:'inline-block', transform:activeTeam===team.id?'translateX(5px)':'translateX(0)' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ MEMBRES ══ */}
      {members.length > 0 && (
        <div style={{ padding:'96px 8%', background:'#f0eeff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:52 }}>
            <div>
              <div className="section-eyebrow">Notre Communauté</div>
              <h2 style={{ fontSize:'clamp(28px,3.5vw,44px)', fontWeight:800, color:'#1e1b4b', letterSpacing:'-1px', lineHeight:1.1 }}>
                Les Membres du<br/>Laboratoire
              </h2>
            </div>
            {members.length > 8 && (
              <button className="btn-section" onClick={() => navigate('/login')}>Voir tous ({members.length}) →</button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {members.slice(0,8).map((m,i) => (
              <div key={m.id} className="member-card">
                <div style={{ position:'relative', width:64, height:64, margin:'0 auto 16px' }}>
                  <div style={{
                    width:64, height:64, borderRadius:'50%',
                    background:`linear-gradient(135deg,${['#7c3aed','#4c1d95','#6d28d9','#5b21b6'][i%4]},#2d1058)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontSize:20, fontWeight:800, overflow:'hidden', position:'relative', zIndex:1,
                  }}>
                    {m.photo
                      ? <img src={`http://localhost:8081${m.photo}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : `${m.firstName?.charAt(0)||''}${m.lastName?.charAt(0)||''}`}
                  </div>
                  <div style={{ position:'absolute', inset:-2, borderRadius:'50%', border:'1px solid rgba(124,58,237,0.2)', animation:'pulse 3s infinite', animationDelay:`${i*0.3}s` }}/>
                </div>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#1e1b4b', marginBottom:3 }}>{m.firstName} {m.lastName}</h3>
                <p style={{ fontSize:11, color:'#94a3b8', marginBottom:12 }}>{m.establishment||'FSBM'}</p>
                <span style={{ fontSize:9, fontWeight:800, color:'#7c3aed', background:'rgba(124,58,237,0.08)', padding:'3px 12px', letterSpacing:'2px', textTransform:'uppercase', borderLeft:'2px solid #7c3aed' }}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ PUBLICATIONS ══ */}
      <div id="publications" style={{ padding:'96px 8%', background:'#f8f7ff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:52 }}>
          <div>
            <div className="section-eyebrow">Recherche Scientifique</div>
            <h2 style={{ fontSize:'clamp(28px,3.5vw,44px)', fontWeight:800, color:'#1e1b4b', letterSpacing:'-1px', lineHeight:1.1 }}>
              Dernières<br/>Publications
            </h2>
          </div>
          <button className="btn-section" onClick={() => navigate('/login')}>Voir toutes →</button>
        </div>
        {publications.length === 0 ? (
          <p style={{ color:'#94a3b8', fontSize:14 }}>Aucune publication pour le moment</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {publications.map((pub,i) => (
              <div key={pub.id} className="pub-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontSize:9, fontWeight:800, color:'#7c3aed', letterSpacing:'2px', textTransform:'uppercase', background:'rgba(124,58,237,0.08)', padding:'3px 10px' }}>
                    {pub.type}
                  </span>
                  <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>{pub.year}</span>
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1e1b4b', marginBottom:10, lineHeight:1.5 }}>{pub.title}</h3>
                <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6, marginBottom:5 }}>
                  {typeof pub.authors==='string' ? pub.authors : pub.authors?.map(a=>`${a.firstName} ${a.lastName}`).join(', ')}
                </p>
                {pub.journal && <p style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>{pub.journal}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ ÉVÉNEMENTS ══ */}
      <div id="evenements" style={{ padding:'96px 8%', background:'#f0eeff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:52 }}>
          <div>
            <div className="section-eyebrow">Agenda Scientifique</div>
            <h2 style={{ fontSize:'clamp(28px,3.5vw,44px)', fontWeight:800, color:'#1e1b4b', letterSpacing:'-1px', lineHeight:1.1 }}>
              Prochains<br/>Événements
            </h2>
          </div>
          <button className="btn-section" onClick={() => navigate('/login')}>Voir tous →</button>
        </div>
        {events.length === 0 ? (
          <p style={{ color:'#94a3b8', fontSize:14 }}>Aucun événement pour le moment</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {events.map((event,i) => (
              <div key={event.id} className="event-card">
                <div style={{ height:3, background:'linear-gradient(90deg,#7c3aed,#a78bfa)' }}/>
                <div style={{ padding:'24px' }}>
                  <div style={{ marginBottom:14 }}>
                    <span style={{ fontSize:9, fontWeight:800, color:'#7c3aed', letterSpacing:'2px', textTransform:'uppercase', background:'rgba(124,58,237,0.08)', padding:'3px 10px' }}>
                      {event.type}
                    </span>
                  </div>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#1e1b4b', marginBottom:12, lineHeight:1.4 }}>{event.title}</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b' }}>
                      <span style={{ color:'#a78bfa', fontSize:10 }}>◎</span>
                      {event.startDate ? new Date(event.startDate).toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'}) : event.date||'—'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8' }}>
                      <span style={{ color:'rgba(167,139,250,0.4)', fontSize:10 }}>◎</span>
                      {event.location||'—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ CTA ══ */}
      <div id="contact" style={{
        padding:'96px 8%',
        background:'linear-gradient(135deg,#1a0a35,#120830,#0f0520)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:`linear-gradient(rgba(124,58,237,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)`, backgroundSize:'60px 60px' }}/>
        <div style={{ position:'absolute', right:'-4%', top:'50%', transform:'translateY(-50%)', width:380, height:380, borderRadius:'50%', border:'1px solid rgba(124,58,237,0.1)', animation:'pulse 4s infinite', pointerEvents:'none' }}/>
        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.3)', letterSpacing:'2px', marginBottom:20 }}>
              <span style={{ display:'block', width:20, height:1, background:'rgba(167,139,250,0.3)' }}/>
              Rejoignez-nous
            </div>
            <h2 style={{ fontSize:'clamp(30px,3.5vw,52px)', fontWeight:900, color:'white', marginBottom:20, letterSpacing:'-1px', lineHeight:1.05 }}>
              Faites partie du<br/>Laboratoire LIAS
            </h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.38)', lineHeight:1.85, maxWidth:400 }}>
              Vous êtes chercheur, doctorant ou membre associé ? Rejoignez notre communauté scientifique et contribuez à l'excellence de la recherche au sein de la FSBM.
            </p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <button className="btn-cta-main" onClick={() => navigate('/register')}>
              Soumettre une candidature →
            </button>
            <button className="btn-cta-ghost" onClick={() => navigate('/login')}>
              Se connecter au portail
            </button>
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{ background:'#040210', color:'white', padding:'64px 8% 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.4fr', gap:52, marginBottom:48 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ width:38, height:38, background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10, fontWeight:900 }}>LIAS</div>
              <div>
                <div style={{ fontWeight:800, fontSize:14 }}>Laboratoire LIAS</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:2 }}>FSBM — Hassan II</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.2)', lineHeight:1.85, maxWidth:250 }}>
              Laboratoire d'Informatique et Applications Scientifiques — Faculté des Sciences Ben M'Sik, Université Hassan II de Casablanca.
            </p>
          </div>
          {[
            { title:'Navigation', links:['Accueil','Équipes','Publications','Événements'] },
            { title:'Portail',    links:['Connexion','Inscription','Tableau de bord'] },
          ].map((col,i) => (
            <div key={i}>
              <h4 style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.16)', textTransform:'uppercase', letterSpacing:'3px', marginBottom:18 }}>{col.title}</h4>
              {col.links.map(link => (
                <div key={link} style={{ fontSize:13, color:'rgba(255,255,255,0.26)', marginBottom:10, cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color='white'; e.currentTarget.style.paddingLeft='8px' }}
                  onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.26)'; e.currentTarget.style.paddingLeft='0' }}>
                  {link}
                </div>
              ))}
            </div>
          ))}
          <div>
            <h4 style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.16)', textTransform:'uppercase', letterSpacing:'3px', marginBottom:18 }}>Contact</h4>
            {["Faculté des Sciences Ben M'Sik","Casablanca, Maroc","contact@lias-fsbm.ma","Université Hassan II de Casablanca"].map((t,i) => (
              <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginBottom:9, lineHeight:1.6 }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.1)' }}>© 2026 Laboratoire LIAS — Faculté des Sciences Ben M'Sik</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.1)' }}>Université Hassan II de Casablanca</span>
        </div>
      </footer>

      {scrollY > 400 && (
        <button className="scroll-btn" onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>↑</button>
      )}
    </div>
  )
}