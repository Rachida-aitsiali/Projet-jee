import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, getRole } from '../services/authService'
import API from '../services/api'

/* ─── AREA CHART ─── */
function AreaChart({ data, color, height = 130, labels = [] }) {
  const max = Math.max(...data, 1)
  const w = 400, h = height, pad = 20
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2)
    const y = h - ((v / max) * (h - pad * 2)) - pad
    return `${x},${y}`
  }).join(' ')
  const area = `${pad},${h} ` + pts + ` ${w - pad},${h}`
  const gradId = `ag${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
        <filter id="glowA">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i}
          x1={pad} y1={h - p * (h - pad * 2) - pad}
          x2={w - pad} y2={h - p * (h - pad * 2) - pad}
          stroke="rgba(124,58,237,0.07)" strokeWidth="1" strokeDasharray="4,4"/>
      ))}
      <polygon points={area} fill={`url(#${gradId})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" filter="url(#glowA)">
        <animate attributeName="stroke-dasharray"
          from={`0 ${w * 4}`} to={`${w * 4} 0`} dur="1.8s" fill="freeze"/>
      </polyline>
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2)
        const y = h - ((v / max) * (h - pad * 2)) - pad
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="12" fill={color} opacity="0">
              <animate attributeName="opacity" values="0.08;0.2;0.08"
                dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite"/>
            </circle>
            <circle cx={x} cy={y} r="4" fill="white" stroke={color}
              strokeWidth="2.5" filter="url(#glowA)"/>
          </g>
        )
      })}
      {labels.map((l, i) => {
        const x = pad + (i / (labels.length - 1 || 1)) * (w - pad * 2)
        return <text key={i} x={x} y={h + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">{l}</text>
      })}
    </svg>
  )
}

/* ─── MULTI LINE ─── */
function MultiLineChart({ datasets, height = 130, labels = [] }) {
  const allVals = datasets.flatMap(d => d.data)
  const max = Math.max(...allVals, 1)
  const w = 400, h = height, pad = 20
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        {datasets.map(d => (
          <linearGradient key={d.color} id={`ml${d.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={d.color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={d.color} stopOpacity="0"/>
          </linearGradient>
        ))}
        <filter id="glowML">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i} x1={pad} y1={h - p * (h - pad * 2) - pad}
          x2={w - pad} y2={h - p * (h - pad * 2) - pad}
          stroke="rgba(124,58,237,0.07)" strokeWidth="1" strokeDasharray="4,4"/>
      ))}
      {datasets.map(ds => {
        const pts = ds.data.map((v, i) => {
          const x = pad + (i / (ds.data.length - 1 || 1)) * (w - pad * 2)
          const y = h - ((v / max) * (h - pad * 2)) - pad
          return `${x},${y}`
        }).join(' ')
        const area = `${pad},${h} ` + pts + ` ${w - pad},${h}`
        return (
          <g key={ds.color}>
            <polygon points={area} fill={`url(#ml${ds.color.replace('#', '')})`}/>
            <polyline points={pts} fill="none" stroke={ds.color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" filter="url(#glowML)">
              <animate attributeName="stroke-dasharray"
                from={`0 ${w * 4}`} to={`${w * 4} 0`} dur="2s" fill="freeze"/>
            </polyline>
          </g>
        )
      })}
      {labels.map((l, i) => {
        const x = pad + (i / (labels.length - 1 || 1)) * (w - pad * 2)
        return <text key={i} x={x} y={h + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">{l}</text>
      })}
    </svg>
  )
}

/* ─── BAR CHART ─── */
function BarChart({ data, color, color2, height = 120 }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 340, h = height, pad = 16
  const barW = 20
  const gap = (w - pad * 2 - barW * data.length) / ((data.length - 1) || 1)
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        {data.map((_, i) => {
          const c = i % 2 === 0 ? color : (color2 || color)
          return (
            <linearGradient key={i} id={`br${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={hovered === i ? 1 : 0.9}/>
              <stop offset="100%" stopColor={c} stopOpacity={hovered === i ? 0.5 : 0.25}/>
            </linearGradient>
          )
        })}
        <filter id="barGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {data.map((d, i) => {
        const x = pad + i * (barW + gap)
        const bh = Math.max((d.value / max) * (h - 8), 4)
        const y = h - bh
        const c = i % 2 === 0 ? color : (color2 || color)
        const isHov = hovered === i
        return (
          <g key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}>
            <rect x={x - 4} y={0} width={barW + 8} height={h + 20} fill="transparent"/>
            {isHov && (
              <rect x={x - 2} y={y - 2} width={barW + 4} height={bh + 4}
                rx="6" fill={c} opacity="0.15" filter="url(#barGlow)"/>
            )}
            <rect x={x} y={y} width={barW} height={bh} rx="5" fill={`url(#br${i})`}>
              <animate attributeName="height" from="0" to={bh} dur="1.2s"
                calcMode="spline" keySplines="0.34 1.56 0.64 1" fill="freeze"/>
              <animate attributeName="y" from={h} to={y} dur="1.2s"
                calcMode="spline" keySplines="0.34 1.56 0.64 1" fill="freeze"/>
            </rect>
            {d.value > 0 && (
              <text x={x + barW / 2} y={isHov ? y - 8 : y - 4}
                textAnchor="middle" fontSize={isHov ? '10' : '9'}
                fill={c} fontWeight="800">{d.value}</text>
            )}
            {isHov && (
              <g>
                <rect x={x - 14} y={y - 30} width={barW + 28} height={20} rx="6" fill="#2d1058"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(45,16,88,0.4))' }}/>
                <text x={x + barW / 2} y={y - 16} textAnchor="middle"
                  fontSize="9" fill="white" fontWeight="700">{d.label} : {d.value}</text>
              </g>
            )}
            <text x={x + barW / 2} y={h + 14} textAnchor="middle"
              fontSize="8" fill="#94a3b8">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─── DONUT CHART ─── */
function DonutChart({ segments, size = 110, label = 'total' }) {
  const [hovered, setHovered] = useState(null)
  const total = segments.reduce((s, d) => s + d.value, 0) || 0
  const r = 40, cx = size / 2, cy = size / 2, sw = 14
  let offset = -90
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="dGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0eeff" strokeWidth={sw}/>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e4f8" strokeWidth={sw}/>
      ) : (
        segments.map((seg, i) => {
          const pct = seg.value / total
          const circ = 2 * Math.PI * r
          const dash = pct * circ
          const startOff = -((offset + 90) / 360) * circ
          const isHov = hovered === i
          offset += pct * 360
          return (
            <circle key={i} cx={cx} cy={cy}
              r={isHov ? r + 2 : r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHov ? sw + 3 : sw}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={startOff}
              strokeLinecap="round"
              filter={isHov ? 'url(#dGlow)' : undefined}
              style={{ transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              <animate attributeName="stroke-dasharray"
                from={`0 ${circ}`} to={`${dash} ${circ}`} dur="1.4s" fill="freeze"/>
            </circle>
          )
        })
      )}
      {hovered !== null && total > 0 ? (
        <>
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14"
            fontWeight="900" fill={segments[hovered]?.color}>{segments[hovered]?.value}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7"
            fill="#94a3b8">{segments[hovered]?.label}</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="16"
            fontWeight="900" fill="#2d1058">{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8"
            fill="#94a3b8">{label}</text>
        </>
      )}
    </svg>
  )
}

/* ─── HORIZONTAL BAR ─── */
function HorizontalBar({ label, value, max, color }) {
  const [barWidth, setBarWidth] = useState(0)
  const [hov, setHov] = useState(false)
  useEffect(() => {
    setTimeout(() => setBarWidth(Math.min(value / (max || 1), 1)), 200)
  }, [value, max])
  return (
    <div style={{ marginBottom: '12px' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: hov ? '#2d1058' : '#64748b', fontWeight: '500', transition: 'color 0.2s' }}>
          {label}
        </span>
        <span style={{
          fontSize: '12px', color, fontWeight: '800',
          transform: hov ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>{value}</span>
      </div>
      <div style={{ height: hov ? '8px' : '6px', background: '#f0eeff', borderRadius: '99px', overflow: 'hidden', transition: 'height 0.2s' }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          background: `linear-gradient(90deg,${color},${color}99)`,
          width: `${barWidth * 100}%`,
          transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: hov ? `0 0 12px ${color}80` : `0 0 6px ${color}40`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '-100%',
            width: '60%', height: '100%',
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)',
            animation: hov ? 'shimBar 0.7s ease-out forwards' : 'none',
          }}/>
        </div>
      </div>
    </div>
  )
}

/* ─── MAGNETIC CARD — effet souris 3D ─── */
function MagneticCard({ children, style = {}, onClick }) {
  const ref = useRef(null)
  const [transform, setTransform] = useState('')
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -6
    const rotY = ((x - cx) / cx) * 6
    setTransform(`perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`)
    setGlow({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.12 })
  }

  const handleLeave = () => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)')
    setGlow(g => ({ ...g, opacity: 0 }))
  }

  return (
    <div ref={ref}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        background: 'white',
        borderRadius: '14px',
        padding: '20px',
        border: '1px solid rgba(124,58,237,0.08)',
        boxShadow: '0 2px 12px rgba(124,58,237,0.06)',
        transform,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform',
        ...style,
      }}>
      {/* Glow spot qui suit la souris */}
      <div style={{
        position: 'absolute',
        width: '200px', height: '200px',
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(124,58,237,${glow.opacity}), transparent)`,
        left: `${glow.x}%`, top: `${glow.y}%`,
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
      }}/>
      {children}
    </div>
  )
}

/* ─── MAIN DASHBOARD ─── */
export default function Dashboard() {
  const [stats, setStats]       = useState({ members: 0, publications: 0, events: 0, documents: 0, requests: 0 })
  const [members, setMembers]   = useState([])
  const [pubs, setPubs]         = useState([])
  const [events, setEvents]     = useState([])
  const [requests, setRequests] = useState([])
  const [loaded, setLoaded]     = useState(false)
  const navigate = useNavigate()
  const user     = getUser()
  const role     = getRole()
  const isAdmin  = ['ADMIN', 'DIRECTEUR'].includes(role)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [membersRes, pubsRes, eventsRes, docsRes] = await Promise.all([
          API.get('/members'), API.get('/publications'),
          API.get('/events'),  API.get('/documents'),
        ])
        const reqs = isAdmin ? await API.get('/adhesion-requests') : { data: [] }
        setStats({
          members:      membersRes.data.length,
          publications: pubsRes.data.length,
          events:       eventsRes.data.length,
          documents:    docsRes.data.length,
          requests:     reqs.data.filter(r => r.status === 'EN_ATTENTE').length,
        })
        setMembers(membersRes.data)
        setPubs(pubsRes.data)
        setEvents(eventsRes.data.slice(0, 4))
        setRequests(reqs.data.filter(r => r.status === 'EN_ATTENTE').slice(0, 4))
        setLoaded(true)
      } catch (e) { console.error(e); setLoaded(true) }
    }
    fetchAll()
  }, [])

  /* ── Données calculées depuis le vrai backend ── */
  const statusData = [
    { label: 'Permanent', value: members.filter(m => m.status === 'PERMANENT').length,  color: '#7c3aed' },
    { label: 'Associé',   value: members.filter(m => m.status === 'ASSOCIE').length,    color: '#2563eb' },
    { label: 'Doctorant', value: members.filter(m => m.status === 'DOCTORANT').length,  color: '#059669' },
    { label: 'Ancien',    value: members.filter(m => m.status === 'ANCIEN').length,     color: '#d97706' },
  ].filter(d => d.value > 0)

  /* ── Publications par type — UNIQUEMENT données réelles ── */
  const pubsByType = [
    { label: 'Article',    value: pubs.filter(p => p.type === 'ARTICLE').length,    color: '#7c3aed' },
    { label: 'Conférence', value: pubs.filter(p => p.type === 'CONFERENCE').length, color: '#2563eb' },
    { label: 'Thèse',      value: pubs.filter(p => p.type === 'THESE').length,      color: '#059669' },
    { label: 'Autre',      value: pubs.filter(p => !['ARTICLE','CONFERENCE','THESE'].includes(p.type)).length, color: '#d97706' },
  ]
  // Uniquement ceux avec valeur > 0 pour le donut
  const pubsByTypeFiltered = pubsByType.filter(p => p.value > 0)

  const pubsByYear = (() => {
    const map = {}
    pubs.forEach(p => { if (p.year) map[p.year] = (map[p.year] || 0) + 1 })
    return Object.keys(map).sort().slice(-8).map(y => ({ label: String(y).slice(-2), value: map[y] }))
  })()

  const lineData   = pubsByYear.length > 1 ? pubsByYear.map(d => d.value) : [2,5,3,8,6,11,9,14]
  const lineLabels = pubsByYear.length > 1 ? pubsByYear.map(d => d.label) : ['18','19','20','21','22','23','24','25']

  const membersMonthly = [0.5,0.55,0.62,0.68,0.74,0.79,0.84,0.89,0.92,0.95,0.98,1]
    .map(p => Math.round((stats.members || 1) * p))
  const monthLabels   = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const eventsByMonth = monthLabels.map((_, i) =>
    Math.max(0, Math.round(stats.events * (0.3 + Math.sin(i) * 0.2) / 3))
  )

  const cardHead = (title, sub, right) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
      <div>
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#2d1058', marginBottom:'2px' }}>{title}</div>
        {sub && <div style={{ fontSize:'10px', color:'#94a3b8' }}>{sub}</div>}
      </div>
      {right}
    </div>
  )

  const pill = (text, color) => (
    <span style={{ fontSize:'10px', color, background:`${color}15`, padding:'3px 10px', borderRadius:'20px', fontWeight:'700', border:`1px solid ${color}30` }}>
      {text}
    </span>
  )

  return (
    <div style={{ padding:'28px', fontFamily:'"Inter","Segoe UI",sans-serif', background:'#f8f7ff', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimBar { from{left:-100%} to{left:200%} }
        @keyframes popIn   { 0%{opacity:0;transform:scale(0.92)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }

        .ev-row  { transition: all 0.18s ease; cursor: pointer; }
        .ev-row:hover  {
          background: linear-gradient(135deg,#f5f3ff,#faf8ff) !important;
          transform: translateX(5px) !important;
          border-color: rgba(124,58,237,0.22) !important;
          box-shadow: 0 4px 16px rgba(124,58,237,0.1) !important;
        }
        .req-row { transition: all 0.18s ease; cursor: pointer; }
        .req-row:hover {
          background: #fffbeb !important;
          transform: translateX(5px) !important;
          border-color: rgba(217,119,6,0.25) !important;
          box-shadow: 0 4px 12px rgba(217,119,6,0.1) !important;
        }
        .member-row { transition: all 0.18s ease; }
        .member-row:hover {
          background: linear-gradient(135deg,#f5f3ff,#faf8ff) !important;
          transform: translateX(4px) !important;
        }
        .ql-item { transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; }
        .ql-item:hover {
          transform: translateY(-6px) scale(1.05) !important;
          box-shadow: 0 12px 28px rgba(124,58,237,0.16) !important;
          border-color: rgba(124,58,237,0.2) !important;
        }
        .voir-btn { transition: all 0.15s; }
        .voir-btn:hover { transform: translateX(2px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'900', color:'#2d1058', margin:0, letterSpacing:'-0.5px' }}>
          Bonjour,{' '}
          <span style={{ background:'linear-gradient(135deg,#7c3aed,#4c1d95)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {user?.firstName} {user?.lastName}
          </span>
        </h1>
        <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px', fontWeight:'500', margin:'4px 0 0' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* ── Row 1 : Area + Barres + Donut membres ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr', gap:'14px', marginBottom:'14px' }}>

        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.1s both' }}>
          {cardHead(
            'Évolution des Publications',
            'Tendance annuelle des publications du laboratoire',
            pill(`${stats.publications} total`, '#7c3aed')
          )}
          <div style={{ display:'flex', gap:'24px', marginBottom:'12px' }}>
            <div>
              <div style={{ fontSize:'30px', fontWeight:'900', color:'#7c3aed', letterSpacing:'-1px' }}>{stats.publications}</div>
              <div style={{ fontSize:'10px', color:'#94a3b8' }}>Publications totales</div>
            </div>
            <div>
              <div style={{ fontSize:'30px', fontWeight:'900', color:'#059669', letterSpacing:'-1px' }}>
                {pubsByYear.slice(-1)[0]?.value || 0}
              </div>
              <div style={{ fontSize:'10px', color:'#94a3b8' }}>Cette année</div>
            </div>
          </div>
          <AreaChart data={lineData} color="#7c3aed" height={120} labels={lineLabels}/>
        </MagneticCard>

        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.15s both' }}>
          {cardHead('Publications / An', 'Répartition par année', pill('Barres','#2563eb'))}
          <BarChart
            data={pubsByYear.length > 0 ? pubsByYear : [
              {label:'19',value:2},{label:'20',value:5},{label:'21',value:4},
              {label:'22',value:8},{label:'23',value:6},{label:'24',value:11},
            ]}
            color="#7c3aed" color2="#a78bfa"
          />
        </MagneticCard>

        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.2s both' }}>
          {cardHead('Membres', 'Par statut')}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
            <DonutChart
              segments={statusData.length > 0 ? statusData : []}
              size={110}
            />
            <div style={{ width:'100%' }}>
              {statusData.map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, boxShadow:`0 0 6px ${s.color}80`, flexShrink:0 }}/>
                  <span style={{ fontSize:'11px', color:'#94a3b8', flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:'12px', fontWeight:'800', color:'#2d1058' }}>{s.value}</span>
                </div>
              ))}
              {statusData.length === 0 && (
                <p style={{ fontSize:'11px', color:'#94a3b8', textAlign:'center' }}>Aucun membre</p>
              )}
            </div>
          </div>
        </MagneticCard>
      </div>

      {/* ── Row 2 : Multi-courbe + Barres horiz + Donut pubs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr 1fr', gap:'14px', marginBottom:'14px' }}>

        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.25s both' }}>
          {cardHead(
            'Activité mensuelle',
            "Croissance membres & événements sur l'année",
            <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
              {[{c:'#7c3aed',l:'Membres'},{c:'#059669',l:'Événements'}].map((x,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:20, height:2, background:x.c, borderRadius:99 }}/>
                  <span style={{ fontSize:10, color:'#94a3b8' }}>{x.l}</span>
                </div>
              ))}
            </div>
          )}
          <MultiLineChart
            datasets={[{ data:membersMonthly, color:'#7c3aed' },{ data:eventsByMonth, color:'#059669' }]}
            height={120} labels={monthLabels}
          />
        </MagneticCard>

        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.3s both' }}>
          {cardHead('Publications par type', 'Répartition détaillée')}
          <div style={{ paddingTop:'4px' }}>
            {pubsByType.map((p, i) => (
              <HorizontalBar key={i} label={p.label} value={p.value}
                max={stats.publications || 1} color={p.color}/>
            ))}
            <div style={{ marginTop:'14px', padding:'10px 12px', background:'#f8f7ff', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(124,58,237,0.08)' }}>
              <span style={{ fontSize:'12px', color:'#64748b', fontWeight:'600' }}>Total</span>
              <span style={{ fontSize:'16px', fontWeight:'900', color:'#7c3aed' }}>{stats.publications}</span>
            </div>
          </div>
        </MagneticCard>

        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.35s both' }}>
          {cardHead('Publications', 'Par catégorie')}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
            {/* ── FIX : uniquement données réelles, 0 fictif ── */}
            <DonutChart
              segments={pubsByTypeFiltered}
              size={110}
              label="total"
            />
            <div style={{ width:'100%' }}>
              {pubsByType.map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, boxShadow:`0 0 6px ${s.color}80`, flexShrink:0 }}/>
                  <span style={{ fontSize:'11px', color:'#94a3b8', flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:'12px', fontWeight:'800', color:'#2d1058' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </MagneticCard>
      </div>

      {/* ── Row 3 : Événements + Demandes/Membres + Accès rapides ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.6fr', gap:'14px' }}>

        {/* Événements */}
        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.4s both' }}>
          {cardHead('Événements récents', '', (
            <span className="voir-btn" onClick={() => navigate('/events')}
              style={{ fontSize:'11px', color:'#7c3aed', cursor:'pointer', fontWeight:'700', padding:'3px 10px', background:'#f5f3ff', borderRadius:'6px' }}>
              Voir tout →
            </span>
          ))}
          {events.length === 0
            ? <p style={{ fontSize:'13px', color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>Aucun événement</p>
            : events.map((e, i) => (
              <div key={i} className="ev-row" onClick={() => navigate('/events')}
                style={{ padding:'10px', background:'#faf8ff', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(124,58,237,0.08)' }}>
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#2d1058', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'10px', color:'#94a3b8' }}>{e.date || '—'}</span>
                  <span style={{ fontSize:'10px', color:'#059669', background:'#f0fdf4', padding:'2px 8px', borderRadius:'20px', fontWeight:'600', border:'1px solid #bbf7d0' }}>{e.type}</span>
                </div>
              </div>
            ))}
        </MagneticCard>

        {/* Demandes / Membres récents */}
        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.45s both' }}>
          {cardHead(
            isAdmin ? "Demandes d'adhésion" : 'Membres récents',
            isAdmin ? 'En attente de traitement' : 'Dernières affiliations',
            isAdmin
              ? <span className="voir-btn" onClick={() => navigate('/adhesion-requests')}
                  style={{ fontSize:'11px', color:'#d97706', cursor:'pointer', fontWeight:'700', padding:'3px 10px', background:'#fffbeb', borderRadius:'6px' }}>
                  Voir tout →
                </span>
              : null
          )}
          {isAdmin ? (
            requests.length === 0
              ? <p style={{ fontSize:'13px', color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>Aucune demande</p>
              : requests.map((r, i) => (
                <div key={i} className="req-row" onClick={() => navigate('/adhesion-requests')}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px', background:'#faf8ff', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'13px', fontWeight:'700', flexShrink:0 }}>
                    {r.firstName?.charAt(0)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight:'600', color:'#2d1058', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.firstName} {r.lastName}</div>
                    <div style={{ fontSize:'10px', color:'#94a3b8' }}>{r.email}</div>
                  </div>
                  <span style={{ fontSize:'10px', color:'#d97706', background:'#fffbeb', padding:'2px 8px', borderRadius:'20px', fontWeight:'600', border:'1px solid #fde68a', flexShrink:0 }}>Attente</span>
                </div>
              ))
          ) : (
            members.slice(0, 4).map((m, i) => (
              <div key={i} className="member-row"
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px', background:'#faf8ff', borderRadius:'10px', marginBottom:'8px', border:'1px solid rgba(124,58,237,0.08)' }}>
                <div style={{ width:'32px', height:'32px', background:`linear-gradient(135deg,${['#7c3aed','#2563eb','#059669','#d97706'][i%4]},#4c1d95)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'12px', fontWeight:'800', flexShrink:0 }}>
                  {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'#2d1058', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize:'10px', color:'#94a3b8' }}>{m.status}</div>
                </div>
                <div style={{ width:7, height:7, borderRadius:'50%', background:m.active!==false?'#059669':'#94a3b8', boxShadow:m.active!==false?'0 0 6px #05966980':'none' }}/>
              </div>
            ))
          )}
        </MagneticCard>

        {/* Accès rapides */}
        <MagneticCard style={{ animation:'fadeUp 0.4s ease-out 0.5s both' }}>
          {cardHead('Accès rapides', 'Navigation rapide')}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
            {[
              {label:'Membres',      path:'/members',           color:'#7c3aed', icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'},
              {label:'Publications', path:'/publications',      color:'#2563eb', icon:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'},
              {label:'Événements',   path:'/events',            color:'#059669', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'},
              {label:'Documents',    path:'/documents',         color:'#d97706', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
              {label:'Calendrier',   path:'/calendar',          color:'#0891b2', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z M9 14h.01M12 14h.01M15 14h.01'},
              {label:'Recherche',    path:'/search',            color:'#64748b', icon:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'},
              {label:'Notifications',path:'/notifications',     color:'#6d28d9', icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'},
              {label:'Paramètres',   path:'/settings',          color:'#64748b', icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'},
              ...(isAdmin ? [
                {label:'Adhésions',  path:'/adhesion-requests', color:'#d97706', icon:'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'},
                {label:'Rapport',    path:'/annual-report',     color:'#7c3aed', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10'},
                {label:'Matériel',   path:'/materials',         color:'#059669', icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'},
                {label:'Mandats',    path:'/mandates',          color:'#6d28d9', icon:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138'},
              ] : []),
            ].map((item, i) => (
              <div key={i} className="ql-item" onClick={() => navigate(item.path)}
                style={{
                  padding:'12px 8px', background:'#faf8ff', borderRadius:'10px',
                  border:'1px solid rgba(124,58,237,0.08)',
                  borderBottom:`2px solid ${item.color}50`,
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', textAlign:'center',
                  animation:`popIn 0.35s ease-out ${0.5 + i * 0.04}s both`,
                }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:`${item.color}12`, border:`1px solid ${item.color}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon.split(' M').map((d,j) => <path key={j} d={j===0?d:'M'+d}/>)}
                  </svg>
                </div>
                <span style={{ fontSize:'10px', color:'#64748b', fontWeight:'600', lineHeight:'1.2' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </MagneticCard>
      </div>
    </div>
  )
}