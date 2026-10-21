import { useState, useEffect } from 'react'
import api from '../services/api'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR',
    { day: '2-digit', month: 'long', year: 'numeric' })
}

const reasonConfig = {
  'Départ en retraite':   { color: '#64748b', bg: '#f1f5f9', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  'Changement de statut': { color: '#7c3aed', bg: '#f5f3ff', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  'Changement de rôle':   { color: '#2563eb', bg: '#eff6ff', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  'Changement d\'équipe': { color: '#d97706', bg: '#fffbeb', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  'Nouvelle affiliation': { color: '#059669', bg: '#ecfdf5', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  'Départ':               { color: '#dc2626', bg: '#fef2f2', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
}

function groupByMember(history) {
  const groups = {}
  history.forEach(h => {
    const key = h.member?.id || 'unknown'
    if (!groups[key]) groups[key] = { member: h.member, entries: [] }
    groups[key].entries.push(h)
  })
  return Object.values(groups)
}

export default function MemberHistory() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('Tous')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    api.get('/member-history')
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = history.filter(h => {
    const name = `${h.member?.firstName || ''} ${h.member?.lastName || ''}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) ||
                        h.reason?.toLowerCase().includes(search.toLowerCase()) ||
                        h.statusLabel?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Tous'
                     || (filterStatus === 'En cours' && h.current)
                     || (filterStatus === 'Terminé'  && !h.current)
    return matchSearch && matchStatus
  })

  const groups = groupByMember(filtered)

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#7c3aed', fontSize: '14px', fontWeight: '600' }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .entry-card:hover { background:#faf8ff !important; }
        .entry-card { transition:background 0.15s; }
        .member-card { transition:all 0.2s; }
        .member-card:hover { box-shadow:0 6px 20px rgba(124,58,237,0.1) !important; }
        .toggle-btn:hover { background:#ede9fe !important; }
        .toggle-btn { transition:all 0.15s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: '20px', animation: 'fadeUp 0.4s ease-out' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', marginBottom: '4px', letterSpacing: '-0.5px' }}>
          Historique des membres
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          {history.length} entrée{history.length > 1 ? 's' : ''} · {new Set(history.map(h => h.member?.id)).size} membre{new Set(history.map(h => h.member?.id)).size > 1 ? 's' : ''} concerné{new Set(history.map(h => h.member?.id)).size > 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Bandeau info ── */}
      <div style={{ background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.15)', borderLeft: '4px solid #7c3aed', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p style={{ fontSize: '13px', color: '#6d28d9', lineHeight: '1.6', margin: 0 }}>
          Conformément aux règles du système, <strong>aucune donnée n'est supprimée</strong>. Tout changement de rôle, d'équipe ou de statut est historisé avec les dates de début et de fin.
        </p>
      </div>

      {/* ── Filtres ── */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.1)', padding: '12px 16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '2fr auto', gap: '10px', alignItems: 'center', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par membre, raison, statut..."
            style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#faf8ff', color: '#2d1058', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
        </div>
        <div style={{ display: 'flex', gap: '6px', background: '#f5f3ff', padding: '4px', borderRadius: '8px' }}>
          {['Tous', 'En cours', 'Terminé'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                background: filterStatus === s ? 'white' : 'transparent',
                color:      filterStatus === s ? '#7c3aed' : '#94a3b8',
                boxShadow:  filterStatus === s ? '0 2px 8px rgba(124,58,237,0.15)' : 'none' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      {history.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.1)', padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#2d1058', marginBottom: '6px' }}>Aucun historique</p>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Les changements de statut, rôle et équipe apparaîtront ici automatiquement</p>
        </div>
      ) : groups.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.1)', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Aucun résultat</p>
          <button onClick={() => { setSearch(''); setFilterStatus('Tous') }}
            style={{ marginTop: '12px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Réinitialiser
          </button>
        </div>
      ) : (
        /* ── Groupé par membre ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groups.map((g, gi) => {
            const isOpen     = expanded[g.member?.id ?? gi] !== false // ouvert par défaut
            const current    = g.entries.filter(e => e.current).length
            const total      = g.entries.length
            const initiale   = g.member?.firstName?.charAt(0)?.toUpperCase() || '?'

            return (
              <div key={g.member?.id ?? gi} className="member-card"
                style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.08)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(124,58,237,0.04)', animation: `fadeUp ${0.3 + gi * 0.06}s ease-out` }}>

                {/* ── En-tête membre (cliquable) ── */}
                <div onClick={() => toggleExpand(g.member?.id ?? gi)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer', background: isOpen ? 'linear-gradient(135deg,#f5f3ff,#faf8ff)' : 'white', borderBottom: isOpen ? '1px solid rgba(124,58,237,0.08)' : 'none', transition: 'background 0.2s' }}>

                  {/* Avatar */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '800', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.25)', overflow: 'hidden' }}>
                    {g.member?.photo
                      ? <img src={`http://localhost:8081${g.member.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initiale}
                  </div>

                  {/* Nom + badges */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#2d1058', marginBottom: '4px' }}>
                      {g.member?.firstName} {g.member?.lastName}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.2)' }}>
                        {total} entrée{total > 1 ? 's' : ''}
                      </span>
                      {current > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '20px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' }} />
                          {current} en cours
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* ── Entrées de l'historique ── */}
                {isOpen && (
                  <div style={{ padding: '8px 20px 12px', animation: 'slideDown 0.2s ease-out' }}>
                    <div style={{ position: 'relative', paddingLeft: '20px' }}>
                      {/* Ligne verticale */}
                      <div style={{ position: 'absolute', left: '7px', top: '12px', bottom: '12px', width: '2px', background: 'linear-gradient(180deg,#7c3aed44,#a78bfa22)', borderRadius: '2px' }} />

                      {g.entries.map((h, ei) => {
                        const cfg   = reasonConfig[h.reason] || { color: '#7c3aed', bg: '#f5f3ff', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }

                        return (
                          <div key={h.id ?? ei} className="entry-card"
                            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 10px 10px 0', borderRadius: '10px', position: 'relative', marginBottom: '4px' }}>

                            {/* Point timeline */}
                            <div style={{ position: 'absolute', left: '-17px', top: '16px', width: '10px', height: '10px', borderRadius: '50%', background: cfg.color, border: '2px solid white', boxShadow: `0 0 0 2px ${cfg.color}44`, flexShrink: 0 }} />

                            {/* Icône raison */}
                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.color}33` }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={cfg.icon}/>
                              </svg>
                            </div>

                            {/* Contenu */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {/* Raison */}
                                  {h.reason && (
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: '20px' }}>
                                      {h.reason}
                                    </span>
                                  )}
                                  {/* Statut */}
                                  {h.statusLabel && (
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '20px' }}>
                                      {h.statusLabel}
                                    </span>
                                  )}
                                  {/* Rôle */}
                                  {h.role && (
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '20px' }}>
                                      {h.role?.name || h.role}
                                    </span>
                                  )}
                                  {/* Équipe */}
                                  {h.team && (
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: '20px' }}>
                                      {h.team?.name || h.team}
                                    </span>
                                  )}
                                </div>
                                {/* Date */}
                                <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {formatDate(h.startDate)}
                                </span>
                              </div>

                              {/* Statut en cours / terminé */}
                              <span style={{
                                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                                color:      h.current ? '#059669' : '#94a3b8',
                                background: h.current ? '#ecfdf5' : '#f1f5f9',
                              }}>
                                {h.current
                                  ? '● En cours'
                                  : `Terminé${h.endDate ? ' · ' + formatDate(h.endDate) : ''}`}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}