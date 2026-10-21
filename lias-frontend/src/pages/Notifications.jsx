import { useState, useEffect } from 'react'
import API from '../services/api'
import { getUser } from '../services/authService'

const typeConfig = {
  VALIDATION_DEMANDE: { label: 'Adhésion',    color: '#7c3aed', bg: '#f5f3ff', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  NOUVEL_EVENEMENT:   { label: 'Événement',   color: '#059669', bg: '#ecfdf5', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  AJOUT_DOCUMENT:     { label: 'Document',    color: '#d97706', bg: '#fffbeb', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  MODIFICATION_ROLE:  { label: 'Rôle',        color: '#2563eb', bg: '#eff6ff', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  GENERAL:            { label: 'Général',     color: '#64748b', bg: '#f1f5f9', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (diff < 60)     return 'À l\'instant'
  if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Hier'
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} jours`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function Notifications() {
  const [notifs, setNotifs]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('Tous')
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => { fetchNotifs() }, [])

  const fetchNotifs = async () => {
    try {
      setLoading(true)
      const res = await API.get('/notifications')
      setNotifs(res.data)
    } catch {
      setNotifs([])
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* silencieux */ }
  }

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all')
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silencieux */ }
  }

  const deleteNotif = async (id, e) => {
    e.stopPropagation()
    setDeleting(id)
    try {
      await API.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch { /* silencieux */ }
    finally { setDeleting(null) }
  }

  const unread   = notifs.filter(n => !n.read).length
  const filtered = filter === 'Tous'     ? notifs
                 : filter === 'Non lues' ? notifs.filter(n => !n.read)
                 : notifs.filter(n => n.read)

  if (loading) return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#7c3aed', fontSize: '14px', fontWeight: '600' }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .notif-card { transition:all 0.15s; }
        .notif-card:hover { box-shadow:0 4px 16px rgba(124,58,237,0.1) !important; transform:translateY(-1px); }
        .del-btn { opacity:0; transition:opacity 0.15s; }
        .notif-card:hover .del-btn { opacity:1; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', animation: 'fadeUp 0.4s ease-out' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', letterSpacing: '-0.5px', margin: 0 }}>
              Notifications
            </h1>
            {unread > 0 && (
              <span style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontSize: '12px', fontWeight: '800', padding: '2px 10px', borderRadius: '20px', animation: 'pulse 2s infinite' }}>
                {unread}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''} sur ${notifs.length}` : `Toutes les notifications sont lues`}
          </p>
        </div>

        {unread > 0 && (
          <button onClick={markAllRead}
            style={{ background: 'white', color: '#7c3aed', border: '1.5px solid rgba(124,58,237,0.3)', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'white', padding: '5px', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.08)', width: 'fit-content', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
        {[
          { label: 'Tous',      count: notifs.length },
          { label: 'Non lues',  count: notifs.filter(n => !n.read).length },
          { label: 'Lues',      count: notifs.filter(n => n.read).length },
        ].map(f => (
          <button key={f.label} onClick={() => setFilter(f.label)}
            style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px',
              background: filter === f.label ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent',
              color:      filter === f.label ? 'white' : '#64748b' }}>
            {f.label}
            {f.count > 0 && (
              <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', background: filter === f.label ? 'rgba(255,255,255,0.25)' : '#f0eeff', color: filter === f.label ? 'white' : '#7c3aed' }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Liste ── */}
      {notifs.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.08)', padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#2d1058', marginBottom: '6px' }}>Aucune notification</p>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Vous n'avez pas encore de notifications</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.08)', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Aucune notification dans cette catégorie</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.GENERAL
            return (
              <div key={n.id} className="notif-card"
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  background: n.read ? 'white' : '#faf8ff',
                  borderRadius: '12px',
                  border: `1px solid ${n.read ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.15)'}`,
                  padding: '16px 20px',
                  cursor: n.read ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  boxShadow: n.read ? '0 1px 4px rgba(124,58,237,0.04)' : '0 2px 8px rgba(124,58,237,0.08)',
                  animation: `fadeUp ${0.2 + i * 0.03}s ease-out`,
                  position: 'relative',
                }}>

                {/* Barre gauche non lue */}
                {!n.read && (
                  <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', borderRadius: '0 3px 3px 0', background: '#7c3aed' }} />
                )}

                {/* Icône type */}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.color}22` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={cfg.icon}/>
                  </svg>
                </div>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: n.read ? '#64748b' : '#2d1058', fontWeight: n.read ? '400' : '600', marginBottom: '6px', lineHeight: '1.5', margin: '0 0 6px' }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: '20px' }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Point non lu + bouton suppr */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {!n.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 0 3px rgba(124,58,237,0.15)' }} />
                  )}
                  <button className="del-btn"
                    onClick={(e) => deleteNotif(n.id, e)}
                    disabled={deleting === n.id}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}