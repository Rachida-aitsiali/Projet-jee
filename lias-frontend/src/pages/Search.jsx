import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

const categories = [
  { key: 'members',      label: 'Membres',      color: '#7c3aed', bg: '#f5f3ff', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { key: 'publications', label: 'Publications', color: '#2563eb', bg: '#eff6ff', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { key: 'events',       label: 'Événements',   color: '#059669', bg: '#ecfdf5', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'documents',    label: 'Documents',    color: '#d97706', bg: '#fffbeb', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

function highlight(text, query) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '3px', padding: '0 2px', fontWeight: '700' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function formatAuthors(authors) {
  if (!authors) return ''
  if (Array.isArray(authors)) {
    return authors.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim()).join(', ')
  }
  return authors
}

export default function Search() {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState({ members: [], publications: [], events: [], documents: [] })
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const navigate = useNavigate()

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setActiveFilter('all')
    try {
      const [members, publications, events, documents] = await Promise.all([
        API.get('/members'),
        API.get('/publications'),
        API.get('/events'),
        API.get('/documents'),
      ])
      const q = query.toLowerCase()
      setResults({
        members: members.data.filter(m =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.establishment?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q)
        ),
        publications: publications.data.filter(p => {
          const authorsMatch = Array.isArray(p.authors)
            ? p.authors.some(a => `${a.firstName} ${a.lastName}`.toLowerCase().includes(q))
            : p.authors?.toLowerCase().includes(q)
          return (
            p.title?.toLowerCase().includes(q) ||
            authorsMatch ||
            p.journal?.toLowerCase().includes(q)
          )
        }),
        events: events.data.filter(e =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
        ),
        documents: documents.data.filter(d =>
          d.title?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q)
        ),
      })
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const total = results.members.length + results.publications.length +
                results.events.length + results.documents.length

  const filteredCategories = activeFilter === 'all'
    ? categories
    : categories.filter(c => c.key === activeFilter)

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .result-card:hover { box-shadow:0 4px 16px rgba(124,58,237,0.12) !important; transform:translateY(-1px); }
        .result-card { transition:all 0.15s; }
        .filter-btn { transition:all 0.15s; }
        .filter-btn:hover { opacity:0.85; }
        .cat-btn:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(124,58,237,0.1) !important; }
        .cat-btn { transition:all 0.2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', marginBottom: '4px', letterSpacing: '-0.5px' }}>
          Recherche globale
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Cherchez dans tous les modules du laboratoire
        </p>
      </div>

      {/* ── Barre de recherche ── */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.1)', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher membres, publications, événements, documents..."
              autoFocus
              style={{ width: '100%', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: '10px', padding: '13px 40px 13px 44px', fontSize: '15px', outline: 'none', background: '#faf8ff', color: '#2d1058', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif' }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSearched(false); setResults({ members:[], publications:[], events:[], documents:[] }) }}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#f0eeff', border: 'none', cursor: 'pointer', color: '#7c3aed', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                ×
              </button>
            )}
          </div>
          <button onClick={handleSearch} disabled={loading}
            style={{ background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Recherche...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Rechercher
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Résultats ── */}
      {searched && !loading && (
        <>
          {/* Résumé + filtres */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ background: total > 0 ? '#f5f3ff' : '#fef2f2', border: `1px solid ${total > 0 ? 'rgba(124,58,237,0.2)' : '#fecaca'}`, borderRadius: '8px', padding: '10px 16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: total > 0 ? '#7c3aed' : '#dc2626' }}>
                {total > 0
                  ? `${total} résultat${total > 1 ? 's' : ''} pour « ${query} »`
                  : `Aucun résultat pour « ${query} »`}
              </span>
            </div>

            {total > 0 && (
              <div style={{ display: 'flex', gap: '6px', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.08)' }}>
                <button className="filter-btn" onClick={() => setActiveFilter('all')}
                  style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: activeFilter === 'all' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent', color: activeFilter === 'all' ? 'white' : '#64748b' }}>
                  Tout ({total})
                </button>
                {categories.map(c => results[c.key]?.length > 0 && (
                  <button key={c.key} className="filter-btn" onClick={() => setActiveFilter(c.key)}
                    style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: activeFilter === c.key ? c.color : 'transparent', color: activeFilter === c.key ? 'white' : '#64748b' }}>
                    {c.label} ({results[c.key].length})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pas de résultats */}
          {total === 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.1)', padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#2d1058', marginBottom: '6px' }}>Aucun résultat</p>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filteredCategories.map(cat => {
                const items = results[cat.key]
                if (!items?.length) return null
                return (
                  <div key={cat.key} style={{ animation: 'fadeUp 0.3s ease-out' }}>
                    {/* En-tête section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2"><path d={cat.icon}/></svg>
                      </div>
                      <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#2d1058', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {cat.label}
                      </h2>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: cat.color, background: cat.bg, padding: '2px 10px', borderRadius: '20px', border: `1px solid ${cat.color}33` }}>
                        {items.length}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(124,58,237,0.08)' }} />
                    </div>

                    {/* Résultats membres */}
                    {cat.key === 'members' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map(m => (
                          <div key={m.id} className="result-card" onClick={() => navigate('/members')}
                            style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.08)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderLeft: `4px solid ${cat.color}`, boxShadow: '0 2px 6px rgba(124,58,237,0.04)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
                              {m.photo
                                ? <img src={`http://localhost:8081${m.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : m.firstName?.charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d1058', marginBottom: '2px' }}>
                                {highlight(`${m.firstName} ${m.lastName}`, query)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {m.establishment || 'FSBM'} · <span style={{ color: cat.color, fontWeight: '600' }}>{m.status}</span>
                              </div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Résultats publications */}
                    {cat.key === 'publications' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map(p => (
                          <div key={p.id} className="result-card" onClick={() => navigate('/publications')}
                            style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.08)', padding: '14px 18px', cursor: 'pointer', borderLeft: `4px solid ${cat.color}`, boxShadow: '0 2px 6px rgba(124,58,237,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', fontWeight: '700', color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: '20px' }}>{p.type}</span>
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.year}</span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d1058', marginBottom: '4px' }}>
                                  {highlight(p.title, query)}
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  {highlight(formatAuthors(p.authors), query)} {p.journal && `· ${p.journal}`}
                                </div>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" style={{ flexShrink: 0, marginTop: '4px' }}><path d="M9 18l6-6-6-6"/></svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Résultats événements */}
                    {cat.key === 'events' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map(e => (
                          <div key={e.id} className="result-card" onClick={() => navigate('/events')}
                            style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.08)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderLeft: `4px solid ${cat.color}`, boxShadow: '0 2px 6px rgba(124,58,237,0.04)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2"><path d={cat.icon}/></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d1058', marginBottom: '3px' }}>
                                {highlight(e.title, query)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {e.startDate && `${e.startDate} `}
                                {e.location && highlight(e.location, query)}
                                {e.type && <span style={{ color: cat.color, fontWeight: '600', marginLeft: '6px' }}>{e.type}</span>}
                              </div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Résultats documents */}
                    {cat.key === 'documents' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map(d => (
                          <div key={d.id} className="result-card" onClick={() => navigate('/documents')}
                            style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.08)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderLeft: `4px solid ${cat.color}`, boxShadow: '0 2px 6px rgba(124,58,237,0.04)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2"><path d={cat.icon}/></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d1058', marginBottom: '3px' }}>
                                {highlight(d.title, query)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {d.type} {d.category && `· ${d.category}`}
                              </div>
                            </div>
                            {d.fileUrl && (
                              <a href={`http://localhost:8081${d.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}33`, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textDecoration: 'none', flexShrink: 0 }}>
                                Voir
                              </a>
                            )}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── État initial — une seule fois ── */}
      {!searched && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(124,58,237,0.08)', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(124,58,237,0.04)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(124,58,237,0.12)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#2d1058', marginBottom: '8px' }}>
            Recherche dans tout le laboratoire
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
            Tapez un mot-clé et appuyez sur Entrée ou cliquez Rechercher
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <div key={c.key} className="cat-btn"
                onClick={() => { setQuery(c.label.toLowerCase()); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.bg, color: c.color, padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: `1px solid ${c.color}22`, cursor: 'pointer', boxShadow: `0 2px 8px ${c.color}15` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={c.icon}/></svg>
                {c.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}