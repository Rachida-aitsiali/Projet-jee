import { useState, useEffect } from 'react'
import publicationService from '../services/publicationService'
import memberService from '../services/memberService'
import teamService from '../services/teamService'
import Pagination from '../components/Pagination'
import { getRole } from '../services/authService'

const PER_PAGE = 10

const typeColor = {
  Article:    '#059669',
  Conférence: '#7c3aed',
  Thèse:      '#d97706',
  Rapport:    '#2563eb',
}
const typeBg = {
  Article:    '#ecfdf5',
  Conférence: '#f5f3ff',
  Thèse:      '#fffbeb',
  Rapport:    '#eff6ff',
}
const typeIcon = {
  Article:    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  Conférence: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  Thèse:      'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  Rapport:    'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

// Mapping affichage (français) <-> enum backend (sans accents)
const typeToEnum = {
  Article:    'ARTICLE',
  Conférence: 'CONFERENCE',
  Thèse:      'THESE',
  Rapport:    'RAPPORT',
}
const enumToType = {
  ARTICLE:    'Article',
  CONFERENCE: 'Conférence',
  THESE:      'Thèse',
  RAPPORT:    'Rapport',
}
const displayType = (t) => enumToType[t] || t

const emptyForm = {
  title: '', authorIds: [], journal: '',
  year: new Date().getFullYear().toString(),
  type: 'Article', teamId: '', doi: ''
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: '8px',
  fontSize: '14px', outline: 'none', background: '#faf8ff',
  boxSizing: 'border-box', color: '#2d1058', fontFamily: 'Inter,sans-serif',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '700',
  color: '#6d28d9', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.5px',
}

function Icon({ path, size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function Publications() {
  const [publications, setPublications] = useState([])
  const [members, setMembers]           = useState([])
  const [teams, setTeams]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterType, setFilterType]     = useState('Tous les types')
  const [filterYear, setFilterYear]     = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [showDetail, setShowDetail]     = useState(null)
  const [editItem, setEditItem]         = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [page, setPage]                 = useState(1)
  const [saving, setSaving]             = useState(false)

  const role      = getRole()
  const canAdd    = ['ADMIN','DIRECTEUR','VICE_DIRECTEUR','CHEF_EQUIPE','MEMBRE','DOCTORANT'].includes(role)
  const canDelete = ['ADMIN','DIRECTEUR'].includes(role)

  const fetchPublications = async () => {
    try {
      setLoading(true)
      const response = await publicationService.getPublications()
      setPublications(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await memberService.getMembers()
      setMembers(response.data)
    } catch (error) {
      console.error('Erreur membres:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await teamService.getTeams()
      setTeams(response.data)
    } catch (error) {
      console.error('Erreur équipes:', error)
    }
  }

  useEffect(() => {
    fetchPublications()
    fetchMembers()
    fetchTeams()
  }, [])
  useEffect(() => { setPage(1) }, [search, filterType, filterYear])

  // Helper : noms d'auteurs à partir des objets Member liés
  const getAuthorNames = (p) =>
    (p.authors || [])
      .map(a => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim())
      .join(', ')

  const filtered = publications.filter(p => {
    const authorNames = getAuthorNames(p).toLowerCase()
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
                        authorNames.includes(search.toLowerCase())
    const matchType   = filterType === 'Tous les types' || displayType(p.type) === filterType
    const matchYear   = filterYear === '' || p.year?.toString().includes(filterYear)
    return matchSearch && matchType && matchYear
  })
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openAdd  = () => { setForm(emptyForm); setEditItem(null); setShowModal(true) }

  const openEdit = (p) => {
    setForm({
      title: p.title || '',
      journal: p.journal || '',
      year: p.year?.toString() || new Date().getFullYear().toString(),
      type: displayType(p.type) || 'Article',
      doi: p.doi || '',
      authorIds: (p.authors || []).map(a => a.id),
      teamId: p.team?.id ? p.team.id.toString() : '',
    })
    setEditItem(p.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title?.trim() || form.authorIds.length === 0) return
    const payload = {
      title: form.title,
      journal: form.journal,
      year: parseInt(form.year, 10),
      type: typeToEnum[form.type] || form.type,
      doi: form.doi,
      authors: form.authorIds.map(id => ({ id })),
      team: form.teamId ? { id: form.teamId } : null,
    }
    try {
      setSaving(true)
      if (editItem) await publicationService.updatePublication(editItem, payload)
      else          await publicationService.createPublication(payload)
      fetchPublications()
      setShowModal(false)
    } catch {
      alert("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette publication ?')) {
      try { await publicationService.deletePublication(id); fetchPublications() }
      catch { alert('Erreur suppression') }
    }
  }

  const toggleAuthor = (memberId) => {
    setForm(prev => {
      const has = prev.authorIds.includes(memberId)
      return {
        ...prev,
        authorIds: has
          ? prev.authorIds.filter(id => id !== memberId)
          : [...prev.authorIds, memberId]
      }
    })
  }

  // Compteurs pour le header
  const articles    = publications.filter(p => displayType(p.type) === 'Article').length
  const conferences = publications.filter(p => displayType(p.type) === 'Conférence').length
  const theses       = publications.filter(p => displayType(p.type) === 'Thèse').length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(124,58,237,0.2)', borderTop:'3px solid #7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ color:'#94a3b8', fontSize:13 }}>Chargement des publications...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { 0%{opacity:0;transform:scale(0.94)} 60%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }
        @keyframes spin   { to{transform:rotate(360deg)} }

        .pub-card { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .pub-card:hover {
          box-shadow: 0 8px 28px rgba(124,58,237,0.13) !important;
          transform: translateY(-2px) !important;
          border-color: rgba(124,58,237,0.15) !important;
        }
        .action-btn {
          transition: all 0.15s ease;
          border: none; cursor: pointer;
          border-radius: 6px; font-weight: 600;
        }
        .action-btn:hover { transform: translateY(-1px); opacity: 0.85; }
        .add-btn {
          transition: all 0.2s ease;
        }
        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.45) !important;
        }
        .author-check {
          transition: background 0.15s ease;
        }
        .author-check:hover { background: #f0eeff; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Publications scientifiques
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {publications.length} publication{publications.length > 1 ? 's' : ''}
            </span>
            {filtered.length !== publications.length && (
              <>
                <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
                <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </span>
              </>
            )}
            {publications.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#059669', fontWeight:'600' }}>{articles} article{articles > 1 ? 's' : ''}</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>{conferences} conférence{conferences > 1 ? 's' : ''}</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#d97706', fontWeight:'600' }}>{theses} thèse{theses > 1 ? 's' : ''}</span>
            </>}
          </div>
        </div>
        {canAdd && (
          <button className="add-btn" onClick={openAdd}
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: 'white', border: 'none', padding: '11px 22px',
              borderRadius: '10px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter une publication
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid rgba(124,58,237,0.1)',
        padding: '12px 16px', marginBottom: '16px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px',
        boxShadow: '0 2px 8px rgba(124,58,237,0.06)',
        animation: 'fadeUp 0.4s ease-out 0.05s both',
      }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou auteur..."
            style={{ ...inputStyle, padding: '9px 12px 9px 34px', fontSize: '13px' }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ ...inputStyle, padding: '9px 12px', fontSize: '13px', cursor: 'pointer' }}>
          <option value="Tous les types">Tous les types</option>
          <option value="Article">Article</option>
          <option value="Conférence">Conférence</option>
          <option value="Thèse">Thèse</option>
          <option value="Rapport">Rapport</option>
        </select>
        <input type="text" value={filterYear} onChange={e => setFilterYear(e.target.value)}
          placeholder="Année (ex: 2024)"
          style={{ ...inputStyle, padding: '9px 12px', fontSize: '13px' }}
          onFocus={e => e.target.style.borderColor = '#7c3aed'}
          onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
      </div>

      {/* ── Liste ── */}
      {publications.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Icon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" size={30} color="#a78bfa" />
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucune publication enregistrée</p>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'24px' }}>Commencez par ajouter la première publication du laboratoire</p>
          {canAdd && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
              Ajouter la première publication
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', padding:'48px', textAlign:'center', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' }}>
          <p style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'12px' }}>Aucun résultat pour ces filtres</p>
          <button onClick={() => { setSearch(''); setFilterType('Tous les types'); setFilterYear('') }}
            style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {paginated.map((p, i) => {
              const tLabel = displayType(p.type)
              return (
              <div key={p.id} className="pub-card"
                style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid rgba(124,58,237,0.08)',
                  padding: '20px 24px',
                  borderLeft: `4px solid ${typeColor[tLabel] || '#7c3aed'}`,
                  boxShadow: '0 2px 8px rgba(124,58,237,0.04)',
                  animation: `fadeUp 0.35s ease-out ${i * 0.04}s both`,
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'16px' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'10px', alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'11px', fontWeight:'700', color:typeColor[tLabel]||'#7c3aed', background:typeBg[tLabel]||'#f5f3ff', padding:'3px 10px', borderRadius:'20px', display:'flex', alignItems:'center', gap:'4px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d={typeIcon[tLabel] || typeIcon.Article} />
                        </svg>
                        {tLabel}
                      </span>
                      {p.year && (
                        <span style={{ fontSize:'11px', fontWeight:'600', color:'#6d28d9', background:'#ede9fe', padding:'3px 10px', borderRadius:'20px' }}>
                          {p.year}
                        </span>
                      )}
                      {p.team?.name && (
                        <span style={{ fontSize:'11px', color:'#64748b', background:'#f1f5f9', padding:'3px 10px', borderRadius:'20px' }}>
                          {p.team.name}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'8px', lineHeight:'1.4', cursor:'pointer', margin:'0 0 8px' }}
                      onClick={() => setShowDetail(p)}>
                      {p.title}
                    </h3>

                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <span style={{ fontSize:'12px', color:'#64748b' }}>{getAuthorNames(p) || 'Non renseigné'}</span>
                    </div>

                    {p.journal && (
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                        <span style={{ fontSize:'12px', color:'#94a3b8', fontStyle:'italic' }}>{p.journal}</span>
                      </div>
                    )}

                    {p.doi && (
                      <div style={{ marginTop:'6px' }}>
                        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:'11px', color:'#7c3aed', textDecoration:'none', fontWeight:'600' }}>
                          DOI: {p.doi}
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                    <button onClick={() => setShowDetail(p)} className="action-btn"
                      style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'6px 14px', fontSize:'12px' }}>
                      Voir
                    </button>
                    {canAdd && (
                      <button onClick={() => openEdit(p)} className="action-btn"
                        style={{ background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'6px 14px', fontSize:'12px' }}>
                        Modifier
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(p.id)} className="action-btn"
                        style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'6px 14px', fontSize:'12px' }}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          {filtered.length > PER_PAGE && (
            <div style={{ background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.08)', marginTop:'12px' }}>
              <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage} />
            </div>
          )}
        </>
      )}

      {/* ── Modal Détail ── */}
      {showDetail && (() => {
        const dLabel = displayType(showDetail.type)
        return (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'32px', width:'520px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ textAlign:'center', marginBottom:'24px' }}>
              <div style={{ width:64, height:64, borderRadius:'16px', background:typeBg[dLabel]||'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', border:`2px solid ${typeColor[dLabel]||'#7c3aed'}` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={typeColor[dLabel]||'#7c3aed'} strokeWidth="1.5">
                  <path d={typeIcon[dLabel] || typeIcon.Article} />
                </svg>
              </div>
              <span style={{ fontSize:'12px', fontWeight:'700', color:typeColor[dLabel]||'#7c3aed', background:typeBg[dLabel]||'#f5f3ff', padding:'4px 14px', borderRadius:'20px', display:'inline-block', marginBottom:'12px' }}>
                {dLabel}
              </span>
              <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', lineHeight:'1.4', margin:0 }}>
                {showDetail.title}
              </h2>
            </div>

            <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1px solid rgba(124,58,237,0.08)' }}>
              {[
                { label:'Auteurs', val:getAuthorNames(showDetail)||'Non renseigné',    icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
                { label:'Journal', val:showDetail.journal||'Non renseigné',            icon:'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
                { label:'Année',   val:showDetail.year?.toString()||'Non renseigné',   icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { label:'Équipe',  val:showDetail.team?.name||'Non renseigné',         icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { label:'DOI',     val:showDetail.doi||'Non renseigné',                icon:'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
              ].map((item, i, arr) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'9px 0', borderBottom:i < arr.length-1 ? '1px solid #f0eeff' : 'none' }}>
                  <div style={{ width:28, height:28, borderRadius:'8px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d={item.icon} /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>{item.label}</div>
                    {item.label === 'DOI' && showDetail.doi
                      ? <a href={`https://doi.org/${showDetail.doi}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600', textDecoration:'none' }}>{showDetail.doi}</a>
                      : <span style={{ fontSize:'13px', fontWeight:item.val.includes('Non')?'400':'600', color:item.val.includes('Non')?'#c4b5fd':'#2d1058', fontStyle:item.val.includes('Non')?'italic':'normal' }}>{item.val}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              {canAdd && (
                <button onClick={() => { setShowDetail(null); openEdit(showDetail) }}
                  style={{ flex:1, background:'#ede9fe', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'11px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                  Modifier
                </button>
              )}
              <button onClick={() => setShowDetail(null)}
                style={{ flex:2, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── Modal Ajouter / Modifier ── */}
      {showModal && canAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'560px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'22px', paddingBottom:'16px', borderBottom:'1px solid #f0eeff' }}>
              <div style={{ width:36, height:36, borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {editItem
                    ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                    : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                  }
                </svg>
              </div>
              <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#2d1058', margin:0 }}>
                {editItem ? 'Modifier la publication' : 'Ajouter une publication'}
              </h2>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Titre *</label>
              <input value={form.title||''} onChange={e => setForm({...form, title:e.target.value})}
                placeholder="Titre complet de la publication" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            {/* Auteurs — sélection multiple par ID via checkboxes */}
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Auteurs * {form.authorIds.length > 0 && `(${form.authorIds.length} sélectionné${form.authorIds.length > 1 ? 's' : ''})`}</label>
              <div style={{
                maxHeight: 170, overflowY: 'auto',
                border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 8,
                background: '#faf8ff', padding: '4px',
              }}>
                {members.length === 0 ? (
                  <div style={{ padding: '10px', fontSize: 13, color: '#a78bfa', fontStyle: 'italic' }}>
                    Aucun membre disponible
                  </div>
                ) : members.map(m => {
                  const displayName = m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim()
                  return (
                    <label key={m.id} className="author-check"
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', fontSize:13, color:'#2d1058', cursor:'pointer', borderRadius:6 }}>
                      <input
                        type="checkbox"
                        checked={form.authorIds.includes(m.id)}
                        onChange={() => toggleAuthor(m.id)}
                      />
                      {displayName}
                    </label>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Journal / Conférence</label>
              <input value={form.journal||''} onChange={e => setForm({...form, journal:e.target.value})}
                placeholder="IEEE Transactions, Elsevier, ..." style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            {/* Équipe — select par ID */}
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Équipe</label>
              <select value={form.teamId} onChange={e => setForm({...form, teamId: e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">— Sélectionner une équipe —</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>DOI</label>
              <input value={form.doi||''} onChange={e => setForm({...form, doi:e.target.value})}
                placeholder="10.xxxx/xxxxx" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'22px' }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="Article">Article</option>
                  <option value="Conférence">Conférence</option>
                  <option value="Thèse">Thèse</option>
                  <option value="Rapport">Rapport</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Année</label>
                <input type="number" value={form.year||''} onChange={e => setForm({...form, year:e.target.value})}
                  min="1990" max="2030" style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer les modifications' : 'Ajouter la publication'}
              </button>
              <button onClick={() => setShowModal(false)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}