import { useState, useEffect } from 'react'
import api from '../services/api'
import { getRole } from '../services/authService'

function formatDate(d) {
  if (!d) return '...'
  return new Date(d).toLocaleDateString('fr-FR',
    { day: '2-digit', month: 'long', year: 'numeric' })
}

function duration(start, end) {
  if (!start) return ''
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const months = Math.round((e - s) / (1000 * 60 * 60 * 24 * 30))
  if (months < 1)  return 'Moins d\'1 mois'
  if (months < 12) return `${months} mois`
  const years  = Math.floor(months / 12)
  const rem    = months % 12
  return rem > 0 ? `${years} an${years > 1 ? 's' : ''} ${rem} mois` : `${years} an${years > 1 ? 's' : ''}`
}

const roleConfig = {
  DIRECTEUR:      { label: 'Directeur',       color: '#7c3aed', bg: '#f5f3ff', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  VICE_DIRECTEUR: { label: 'Vice-Directeur',  color: '#6d28d9', bg: '#ede9fe', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  CHEF_EQUIPE:    { label: 'Chef d\'équipe',  color: '#d97706', bg: '#fffbeb', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
}

// Seuls ces rôles constituent des "mandats" de gouvernance (section 5.3 du cahier des charges)
const GOVERNANCE_ROLES = ['DIRECTEUR', 'VICE_DIRECTEUR', 'CHEF_EQUIPE']

function getRoleKey(m) {
  const name = m.role?.name || m.roleName || ''
  const upper = name.toUpperCase().replace(/\s+/g, '_').replace(/'/g, '')
  if (upper.includes('VICE')) return 'VICE_DIRECTEUR'
  if (upper.includes('CHEF')) return 'CHEF_EQUIPE'
  if (upper.includes('DIRECTEUR')) return 'DIRECTEUR'
  return upper
}

export default function Mandates() {
  const [mandates, setMandates] = useState([])
  const [loading, setLoading]   = useState(true)

  const role    = getRole()
  const canEdit = ['ADMIN', 'DIRECTEUR'].includes(role)

  useEffect(() => {
    api.get('/member-history')
      .then(r => {
        // On ne garde que les entrées liées à un rôle de gouvernance
        const filtered = (r.data || []).filter(entry => {
          const key = getRoleKey(entry)
          return GOVERNANCE_ROLES.includes(key)
        })
        setMandates(filtered)
      })
      .catch(() => setMandates([]))
      .finally(() => setLoading(false))
  }, [])

  const current = mandates.filter(m => m.current)
  const past    = mandates.filter(m => !m.current)

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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .past-card:hover { box-shadow:0 4px 16px rgba(124,58,237,0.08) !important; transform:translateY(-1px); }
        .past-card { transition:all 0.2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', animation: 'fadeUp 0.4s ease-out' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', marginBottom: '4px', letterSpacing: '-0.5px' }}>
          Mandats de gouvernance
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Historique complet — directeurs et chefs d'équipe · {mandates.length} mandat{mandates.length > 1 ? 's' : ''} enregistré{mandates.length > 1 ? 's' : ''}
        </p>
      </div>

      {mandates.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.1)', padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#2d1058', marginBottom: '6px' }}>Aucun mandat enregistré</p>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Les mandats apparaissent ici dès qu'un membre est nommé Directeur, Vice-Directeur ou Chef d'équipe</p>
        </div>
      ) : (
        <>
          {/* ── Mandats actuels ── */}
          {current.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Mandats en cours
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
                  {current.length} actif{current.length > 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {current.map((m, i) => {
                  const rKey = getRoleKey(m)
                  const cfg  = roleConfig[rKey] || { label: m.role?.name || m.roleName || '—', color: '#7c3aed', bg: '#f5f3ff', icon: 'M9 12l2 2 4-4' }
                  const initiale = m.member?.firstName?.charAt(0)?.toUpperCase() || '?'
                  const dur  = duration(m.startDate, null)

                  return (
                    <div key={m.id}
                      style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cfg.color}33`, overflow: 'hidden', boxShadow: `0 4px 16px ${cfg.color}15`, animation: `fadeUp ${0.3 + i * 0.1}s ease-out` }}>

                      {/* Card header coloré */}
                      <div style={{ background: `linear-gradient(135deg,${cfg.color}18,${cfg.color}08)`, padding: '20px', borderBottom: `3px solid ${cfg.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${cfg.color}33` }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={cfg.icon}/>
                            </svg>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' }} />
                            En cours
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#2d1058' }}>
                          {m.member?.firstName} {m.member?.lastName}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Depuis le <strong style={{ color: '#2d1058' }}>{formatDate(m.startDate)}</strong>
                          </span>
                        </div>

                        {/* Durée */}
                        <div style={{ background: cfg.bg, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Durée du mandat</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: cfg.color }}>{dur}</span>
                        </div>

                        {/* Équipe (si Chef d'équipe) */}
                        {m.team?.name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                              <path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5"/>
                            </svg>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Équipe : <strong style={{ color: '#2d1058' }}>{m.team.name}</strong>
                            </span>
                          </div>
                        )}

                        {/* Avatar + nom membre */}
                        {m.member && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', padding: '10px 12px', background: '#faf8ff', borderRadius: '8px', border: '1px solid rgba(124,58,237,0.06)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${cfg.color},#4c1d95)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                              {m.member?.photo
                                ? <img src={`http://localhost:8081${m.member.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : initiale}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#2d1058' }}>{m.member.firstName} {m.member.lastName}</div>
                              {m.member.email && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{m.member.email}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Anciens mandats ── */}
          {past.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Anciens mandats
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>
                  {past.length}
                </span>
              </div>

              {/* Timeline anciens mandats */}
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'linear-gradient(180deg,rgba(124,58,237,0.2),rgba(124,58,237,0.05))', borderRadius: '2px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {past.map((m, i) => {
                    const rKey = getRoleKey(m)
                    const cfg  = roleConfig[rKey] || { label: m.role?.name || m.roleName || '—', color: '#94a3b8', bg: '#f1f5f9', icon: 'M9 12l2 2 4-4' }
                    const dur  = duration(m.startDate, m.endDate)
                    const initiale = m.member?.firstName?.charAt(0)?.toUpperCase() || '?'

                    return (
                      <div key={m.id} className="past-card"
                        style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid rgba(124,58,237,0.06)', boxShadow: '0 2px 6px rgba(124,58,237,0.04)', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', animation: `fadeUp ${0.3 + i * 0.05}s ease-out` }}>

                        {/* Point timeline */}
                        <div style={{ position: 'absolute', left: '-21px', width: '10px', height: '10px', borderRadius: '50%', background: cfg.color + '66', border: `2px solid ${cfg.color}33`, flexShrink: 0 }} />

                        {/* Icône rôle */}
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.7 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={cfg.icon}/>
                          </svg>
                        </div>

                        {/* Rôle + Nom */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px', opacity: 0.8 }}>
                            {cfg.label}{m.team?.name ? ` · ${m.team.name}` : ''}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Mini avatar */}
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#94a3b8,#64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                              {m.member?.photo
                                ? <img src={`http://localhost:8081${m.member.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : initiale}
                            </div>
                            {m.member?.firstName} {m.member?.lastName}
                          </div>
                        </div>

                        {/* Dates + durée */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                            {formatDate(m.startDate)} → {formatDate(m.endDate)}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{dur}</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>
                              Terminé
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}