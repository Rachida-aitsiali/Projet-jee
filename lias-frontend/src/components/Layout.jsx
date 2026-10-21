import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout, getUser, getRole } from '../services/authService'

const menuItems = [
  { label: 'Tableau de bord',   path: '/dashboard',         icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 roles: [] },
  { label: 'Membres',           path: '/members',           icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',                                                                                                                                                                                                                                                                                                                                                                                                                                                                          roles: [] },
  { label: 'Équipes',           path: '/teams',             icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     roles: [] },
  { label: 'Publications',      path: '/publications',      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',                                                                                                                                                                                                                                                                                                                                                         roles: [] },
  { label: 'Événements',        path: '/events',            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       roles: [] },
  { label: 'Calendrier',        path: '/calendar',          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z M9 14h.01M12 14h.01M15 14h.01',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        roles: [] },
  { label: 'Documents',         path: '/documents',         icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        roles: [] },
  { label: 'Demandes adhésion', path: '/adhesion-requests', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        roles: ['DIRECTEUR','ADMIN'] },
  { label: 'Conventions',       path: '/conventions',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',                                                                                                                                                                                                                                                                                                                                                                                                             roles: [] },
  { label: 'Matériel',          path: '/materials',         icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              roles: [] },
  { label: 'PV Réunions',       path: '/pv',                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',                                                                                                                                                                                                                                                                                                                                                                                                                                                               roles: ['DIRECTEUR','ADMIN','CHEF_EQUIPE'] },
  { label: 'Historique',        path: '/member-history',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   roles: ['DIRECTEUR','ADMIN'] },
  { label: 'Mandats',           path: '/mandates',          icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',                                                                                                                                                               roles: ['DIRECTEUR','ADMIN'] },
  { label: 'Rapport annuel',    path: '/annual-report',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',                                                                                                                                                                                                                                                                                                                                                                                                    roles: ['DIRECTEUR','ADMIN','CHEF_EQUIPE'] },
  { label: 'Recherche',         path: '/search',            icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   roles: [] },
  { label: 'Notifications',     path: '/notifications',     icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',                                                                                                                                                                                                                                                                                                                                                                                                             roles: [] },
  { label: 'Paramètres',        path: '/settings',          icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: [] },
  { label: 'Messages',          path: '/messages',          icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',                                                                                                                                                                                                                                                                                                                                                                                                                                               roles: [] },
]

const roleLabel = {
  DIRECTEUR:'Directeur', VICE_DIRECTEUR:'Vice-Directeur',
  CHEF_EQUIPE:"Chef d'équipe", MEMBRE:'Membre',
  DOCTORANT:'Doctorant', ADMIN:'Administrateur',
}
const roleBadgeColor = {
  DIRECTEUR:'#7c3aed', VICE_DIRECTEUR:'#6d28d9',
  CHEF_EQUIPE:'#5b21b6', MEMBRE:'#4c1d95',
  DOCTORANT:'#7c3aed', ADMIN:'#6d28d9',
}

function PageIcon({ iconStr, color='#a78bfa', size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {iconStr.split(' M').map((d,i) => (
        <path key={i} d={i===0 ? d : 'M'+d}/>
      ))}
    </svg>
  )
}

function Flyout({ label, anchorY, sidebarW, active, isLogout, isAvatar, userName, userRole }) {
  if (anchorY === null) return null
  return (
    <div style={{
      position:'fixed', top:anchorY, left:sidebarW+14,
      transform:'translateY(-50%)', zIndex:99999,
      display:'flex', alignItems:'center', pointerEvents:'none',
      animation:'flyoutIn 0.15s ease-out forwards',
    }}>
      <div style={{
        width:0, height:0,
        borderTop:'6px solid transparent', borderBottom:'6px solid transparent',
        borderRight:`7px solid ${isLogout?'#1c0a0a':active?'#3b1a6e':'#1e1b2e'}`,
        flexShrink:0,
      }}/>
      <div style={{
        background:isLogout?'#1c0a0a':active?'#3b1a6e':'#1e1b2e',
        color:isLogout?'#fca5a5':active?'#f3e8ff':'#d4d0e8',
        fontSize:13, fontWeight:600,
        padding:isAvatar?'8px 14px':'7px 16px',
        borderRadius:8, whiteSpace:'nowrap',
        boxShadow:isLogout
          ?'0 4px 20px rgba(239,68,68,0.25),0 0 0 1px rgba(239,68,68,0.2)'
          :'0 4px 20px rgba(0,0,0,0.4),0 0 0 1px rgba(124,58,237,0.25)',
        borderLeft:`3px solid ${isLogout?'#ef4444':active?'#a78bfa':'#7c3aed'}`,
        fontFamily:'Inter,sans-serif',
        display:'flex', flexDirection:isAvatar?'column':'row', gap:isAvatar?2:0,
      }}>
        {isAvatar ? (
          <>
            <span style={{ fontWeight:700, fontSize:13 }}>{userName}</span>
            <span style={{ fontSize:10, color:'#c4b5fd', fontWeight:500 }}>{userRole}</span>
          </>
        ) : label}
      </div>
    </div>
  )
}

// ── Bord droit en vagues arrondies ──
function SidebarWave({ sidebarW }) {
  // On génère les dents via clip-path sur un pseudo-élément
  // Ici on utilise un SVG positionné en absolute à droite de la sidebar
  const teeth = []
  const step = 24
  const depth = 10
  const count = 60
  for (let i = 0; i < count; i++) {
    const y = i * step
    teeth.push(`${sidebarW},${y}`)
    teeth.push(`${sidebarW - depth},${y + step/2}`)
  }
  teeth.push(`${sidebarW},${count * step}`)

  return (
    <svg
      style={{
        position:'absolute', top:0, right:-1, bottom:0,
        width: depth + 2, height:'100%',
        overflow:'visible', pointerEvents:'none', zIndex:10,
      }}
      viewBox={`${sidebarW - depth - 1} 0 ${depth + 2} 1440`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.15"/>
          <stop offset="25%"  stopColor="#7c3aed" stopOpacity="0.55"/>
          <stop offset="50%"  stopColor="#a78bfa" stopOpacity="0.4"/>
          <stop offset="75%"  stopColor="#6d28d9" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.2"/>
        </linearGradient>
        <filter id="waveGlow" x="-50%" y="-5%" width="200%" height="110%">
          <feGaussianBlur stdDeviation="1.8" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Vagues arrondies — Q = quadratic bezier */}
      <path
        d={`
          M ${sidebarW} 0
          ${Array.from({length:60},(_,i) => {
            const y = i * step
            return `Q ${sidebarW - depth} ${y + step/2} ${sidebarW} ${y + step}`
          }).join(' ')}
          L ${sidebarW} 1440
        `}
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="1.5"
        filter="url(#waveGlow)"
      />

      {/* Halo derrière — plus large, très transparent */}
      <path
        d={`
          M ${sidebarW} 0
          ${Array.from({length:60},(_,i) => {
            const y = i * step
            return `Q ${sidebarW - depth} ${y + step/2} ${sidebarW} ${y + step}`
          }).join(' ')}
        `}
        fill="none"
        stroke="rgba(124,58,237,0.18)"
        strokeWidth="6"
      />
    </svg>
  )
}

export default function Layout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = getUser()
  const role      = getRole()
  const statut    = user?.status

  const [collapsed, setCollapsed] = useState(false)
  const [flyout, setFlyout]       = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [animKey, setAnimKey]     = useState(0)

  useEffect(() => { setAnimKey(k => k+1) }, [location.pathname])

  const visibleMenus = menuItems.filter(item => {
    if (item.roles.length > 0 && !item.roles.includes(role)) return false
    if (statut==='DOCTORANT' && !['DIRECTEUR','ADMIN','CHEF_EQUIPE','VICE_DIRECTEUR'].includes(role)) {
      return ['/dashboard','/publications','/settings','/notifications','/messages','/search'].includes(item.path)
    }
    if (statut==='ASSOCIE' && !['DIRECTEUR','ADMIN'].includes(role)) {
      return !['/adhesion-requests','/member-history','/mandates','/materials','/conventions','/pv','/annual-report'].includes(item.path)
    }
    return true
  })

  const currentItem = menuItems.find(m => m.path === location.pathname)
  const handleLogout = () => { logout(); navigate('/login') }
  const handleSearch = (e) => {
    if (e.key==='Enter' && searchQuery.trim()) { navigate('/search'); setSearchQuery('') }
  }

  const sidebarW = collapsed ? 64 : 240

  const showFlyout = (e, opts) => {
    if (!collapsed) return
    const rect = e.currentTarget.getBoundingClientRect()
    setFlyout({ anchorY: rect.top + rect.height/2, ...opts })
  }
  const hideFlyout = () => setFlyout(null)

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'"Inter","Segoe UI",sans-serif', background:'#f8f7ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; }

        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes glow       { 0%,100%{box-shadow:0 0 8px rgba(124,58,237,0.4)} 50%{box-shadow:0 0 22px rgba(124,58,237,0.85)} }
        @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes dotPop     { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.5)} 100%{transform:scale(1);opacity:1} }
        @keyframes headerAnim { 0%{opacity:0;transform:translateX(-30px) scale(0.85)} 60%{opacity:1;transform:translateX(4px) scale(1.02)} 100%{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes flyoutIn   { from{opacity:0;transform:translateY(-50%) translateX(-8px)} to{opacity:1;transform:translateY(-50%) translateX(0)} }
        @keyframes activeGlow {
          0%,100% { box-shadow:0 4px 18px rgba(124,58,237,0.45),0 0 0 0 rgba(124,58,237,0); }
          50%     { box-shadow:0 6px 28px rgba(124,58,237,0.7),0 0 0 3px rgba(124,58,237,0.12); }
        }
        @keyframes activeShimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }

        .lias-item {
          position:relative; border-radius:12px; margin-bottom:3px;
          cursor:pointer; transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1);
          overflow:hidden;
        }
        .lias-item:hover:not(.is-active) {
          background:rgba(167,139,250,0.1) !important;
          transform:translateX(3px);
        }
        .lias-item.is-active {
          background:linear-gradient(135deg,#5b21b6,#7c3aed,#6d28d9) !important;
          animation:activeGlow 2.5s ease-in-out infinite;
          transform:translateX(2px);
        }
        .lias-item.is-active::after {
          content:'';
          position:absolute; inset:0; border-radius:12px;
          background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.1) 50%,transparent 70%);
          background-size:200% 100%;
          animation:activeShimmer 2.5s ease-in-out infinite;
          pointer-events:none;
        }

        .lias-logout { border-radius:10px; cursor:pointer; transition:all 0.15s; overflow:hidden; }
        .lias-logout:hover { background:rgba(239,68,68,0.12) !important; color:#fca5a5 !important; }

        ::-webkit-scrollbar { width:3px; height:0; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.3); border-radius:99px; }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <div style={{
        position:'fixed', top:0, left:0, bottom:0,
        width:sidebarW,
        background:'linear-gradient(180deg,#120830 0%,#1a0a35 55%,#0f0520 100%)',
        display:'flex', flexDirection:'column',
        zIndex:200,
        transition:'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow:'4px 0 32px rgba(0,0,0,0.5)',
        overflow:'hidden',
      }}>

        {/* ── Bord droit en vagues ── */}
        <SidebarWave sidebarW={sidebarW}/>

        {/* LOGO */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:collapsed?'14px 0':'14px 10px',
          borderBottom:'1px solid rgba(124,58,237,0.12)',
          flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0, overflow:'hidden', flex:1, justifyContent:collapsed?'center':'flex-start' }}>
            <div style={{
              width:36, height:36, flexShrink:0,
              background:'linear-gradient(135deg,#7c3aed,#4c1d95)',
              borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 12px rgba(124,58,237,0.4)',
              animation:'glow 3s infinite',
            }}>
              <span style={{ color:'white', fontSize:10, fontWeight:900, letterSpacing:'-0.5px' }}>LIAS</span>
            </div>
            {!collapsed && (
              <div style={{ animation:'fadeIn 0.25s', minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'white', whiteSpace:'nowrap' }}>Laboratoire LIAS</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:1 }}>FSBM · Hassan II</div>
              </div>
            )}
          </div>
          <div
            onClick={() => { setCollapsed(c => !c); hideFlyout() }}
            style={{
              width:26, height:26, flexShrink:0, borderRadius:8,
              background:'rgba(124,58,237,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', transition:'background 0.2s',
              marginLeft:collapsed?0:6,
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(124,58,237,0.38)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(124,58,237,0.2)'}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
              stroke="rgba(167,139,250,0.9)" strokeWidth="2.5">
              {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </div>
        </div>

        {/* MENU */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 6px' }}>
          {visibleMenus.map(item => {
            const active = location.pathname === item.path
            return (
              <div
                key={item.path}
                className={`lias-item${active?' is-active':''}`}
                onClick={() => navigate(item.path)}
                onMouseEnter={e => showFlyout(e, { label:item.label, active })}
                onMouseLeave={hideFlyout}
                style={{
                  display:'flex', alignItems:'center',
                  gap:collapsed?0:10,
                  justifyContent:collapsed?'center':'flex-start',
                  padding:collapsed?'11px 0':'9px 10px',
                }}
              >
                {/* Barre blanche fine à gauche quand actif et ouvert */}
                {active && !collapsed && (
                  <div style={{
                    position:'absolute', left:0, top:'15%', bottom:'15%',
                    width:3, borderRadius:'0 3px 3px 0',
                    background:'rgba(255,255,255,0.5)',
                  }}/>
                )}

                {/* Icône */}
                <div style={{ flexShrink:0, width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <PageIcon
                    iconStr={item.icon}
                    color={active ? 'white' : 'rgba(255,255,255,0.5)'}
                    size={18}
                  />
                </div>

                {/* Label */}
                {!collapsed && (
                  <span style={{
                    fontSize:13, fontWeight:active?700:500,
                    color:active?'white':'rgba(255,255,255,0.6)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    transition:'color 0.15s',
                  }}>
                    {item.label}
                  </span>
                )}

                {/* Point lumineux actif */}
                {active && (
                  <div style={{
                    position:'absolute',
                    right:collapsed?'50%':10,
                    transform:collapsed?'translateX(50%)':'none',
                    top:'50%', marginTop:-3,
                    width:6, height:6, borderRadius:'50%',
                    background:'rgba(255,255,255,0.9)',
                    boxShadow:'0 0 6px rgba(255,255,255,0.8)',
                  }}/>
                )}
              </div>
            )
          })}
        </div>

        {/* FOOTER */}
        <div style={{ borderTop:'1px solid rgba(124,58,237,0.12)', padding:'8px 6px', flexShrink:0 }}>
          {!collapsed ? (
            <div style={{
              padding:'9px 10px', marginBottom:4,
              background:'rgba(124,58,237,0.1)',
              borderRadius:10,
              border:'1px solid rgba(124,58,237,0.15)',
            }}>
              <div style={{ fontSize:12.5, color:'white', fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:4 }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'white', background:roleBadgeColor[role]||'#7c3aed', padding:'2px 8px', borderRadius:20 }}>
                  {roleLabel[role]||'Membre'}
                </span>
                {statut && (
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.08)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)' }}>
                    {statut}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{ display:'flex', justifyContent:'center', marginBottom:4 }}
              onMouseEnter={e => showFlyout(e, { label:`${user?.firstName} ${user?.lastName}`, isAvatar:true, active:false })}
              onMouseLeave={hideFlyout}
            >
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background:`linear-gradient(135deg,${roleBadgeColor[role]||'#7c3aed'},#4c1d95)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:13, fontWeight:800,
                boxShadow:'0 2px 8px rgba(124,58,237,0.4)',
              }}>
                {user?.firstName?.charAt(0)}
              </div>
            </div>
          )}

          <div
            className="lias-logout"
            onClick={handleLogout}
            onMouseEnter={e => showFlyout(e, { label:'Déconnexion', isLogout:true, active:false })}
            onMouseLeave={hideFlyout}
            style={{
              display:'flex', alignItems:'center',
              justifyContent:collapsed?'center':'flex-start',
              gap:8,
              padding:collapsed?'10px 0':'8px 10px',
              color:'rgba(255,255,255,0.35)',
              fontSize:13,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink:0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && 'Déconnexion'}
          </div>
        </div>
      </div>

      {/* FLYOUT */}
      {flyout && collapsed && (
        <Flyout
          label={flyout.label} anchorY={flyout.anchorY} sidebarW={sidebarW}
          active={flyout.active} isLogout={flyout.isLogout} isAvatar={flyout.isAvatar}
          userName={`${user?.firstName} ${user?.lastName}`}
          userRole={roleLabel[role]||'Membre'}
        />
      )}

      {/* ══ MAIN ══ */}
      <div style={{
        marginLeft:sidebarW, flex:1,
        display:'flex', flexDirection:'column', minWidth:0,
        transition:'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* HEADER */}
        <div style={{
          position:'sticky', top:0, zIndex:100,
          background:'white',
          borderBottom:'1px solid #f0eeff',
          padding:'10px 24px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          boxShadow:'0 2px 12px rgba(124,58,237,0.06)',
        }}>
          {currentItem && (
            <div key={animKey} style={{
              display:'flex', alignItems:'center', gap:10,
              background:'linear-gradient(135deg,#2d1058,#4c1d95)',
              padding:'7px 18px 7px 10px',
              borderRadius:14,
              boxShadow:'0 4px 20px rgba(124,58,237,0.35)',
              position:'relative', overflow:'hidden',
              animation:'headerAnim 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <div style={{
                width:30, height:30, borderRadius:9,
                background:'rgba(167,139,250,0.2)',
                border:'1px solid rgba(167,139,250,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
              }}>
                <PageIcon iconStr={currentItem.icon} color="#c4b5fd" size={15}/>
              </div>
              <span style={{
                fontSize:15, fontWeight:800, letterSpacing:'-0.3px', whiteSpace:'nowrap',
                background:'linear-gradient(135deg,#ffffff,#c4b5fd)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
                {currentItem.label}
              </span>
              <div style={{
                position:'absolute', top:-3, right:-3,
                width:8, height:8, borderRadius:'50%',
                background:'#a78bfa',
                boxShadow:'0 0 10px rgba(167,139,250,0.9)',
                animation:'dotPop 0.4s 0.3s both, pulse 2.5s 0.7s infinite',
                border:'1.5px solid white',
              }}/>
              <div style={{
                position:'absolute', inset:0, borderRadius:14,
                background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)',
                backgroundSize:'200% 100%',
                animation:'shimmer 2.5s 0.4s infinite',
                pointerEvents:'none',
              }}/>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Recherche... (Entrée)"
              style={{
                padding:'7px 12px',
                border:'1.5px solid rgba(124,58,237,0.2)',
                borderRadius:8, fontSize:13, outline:'none',
                background:'#f8f7ff', width:180, color:'#2d1058',
                fontFamily:'Inter,sans-serif', transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='#7c3aed'}
              onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}
            />
            <div
              onClick={() => navigate('/notifications')}
              style={{
                fontSize:12, color:'#6d28d9', background:'#f5f3ff',
                padding:'7px 12px', borderRadius:6,
                border:'1px solid rgba(124,58,237,0.2)',
                cursor:'pointer', fontWeight:500, whiteSpace:'nowrap', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#ede9fe'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.transform='translateY(0)' }}
            >
              Notifications
            </div>
            <div
              onClick={() => navigate('/settings')}
              style={{
                width:34, height:34, flexShrink:0,
                background:'linear-gradient(135deg,#7c3aed,#4c1d95)',
                borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', color:'white',
                fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(124,58,237,0.3)', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(124,58,237,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(124,58,237,0.3)' }}
            >
              {user?.firstName?.charAt(0)}
            </div>
          </div>
        </div>

        {/* CONTENU */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', background:'#f8f7ff' }}>
          {children}
        </div>
      </div>
    </div>
  )
}