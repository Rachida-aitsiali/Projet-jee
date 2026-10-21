import { useState, useEffect } from 'react'
import eventService from '../services/eventService'
import memberService from '../services/memberService'
import { getRole } from '../services/authService'
import API from '../services/api'

const typeColor = {
  CONFERENCE: '#7c3aed',
  SEMINAIRE:  '#059669',
  WORKSHOP:   '#d97706',
}
const typeBg = {
  CONFERENCE: '#f5f3ff',
  SEMINAIRE:  '#ecfdf5',
  WORKSHOP:   '#fffbeb',
}
const typeLabel = {
  CONFERENCE: 'Conférence',
  SEMINAIRE:  'Séminaire',
  WORKSHOP:   'Workshop',
}
const typeIcon = {
  CONFERENCE: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  SEMINAIRE:  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  WORKSHOP:   'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
}

const emptyForm = {
  title: '', type: 'CONFERENCE',
  startDate: '', endDate: '',
  location: '', organizerId: '',
  participantIds: [], description: '',
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

function formatDate(d) {
  if (!d) return 'Non renseigné'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function MemberAvatar({ member, size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size * 0.4, fontWeight: '700', flexShrink: 0, overflow: 'hidden' }}>
      {member?.photo
        ? <img src={`http://localhost:8081${member.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : member?.firstName?.charAt(0) || '?'}
    </div>
  )
}

const docTypes = ['Programme', 'Attestation', 'Rapport', 'Financement', 'Autre']
const docTypeColor = {
  Programme: '#7c3aed', Attestation: '#059669',
  Rapport: '#2563eb', Financement: '#d97706', Autre: '#64748b'
}
const docTypeBg = {
  Programme: '#f5f3ff', Attestation: '#ecfdf5',
  Rapport: '#eff6ff', Financement: '#fffbeb', Autre: '#f1f5f9'
}

export default function Events() {
  const [events, setEvents]             = useState([])
  const [members, setMembers]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterType, setFilterType]     = useState('Tous')
  const [showModal, setShowModal]       = useState(false)
  const [showDetail, setShowDetail]     = useState(null)
  const [editItem, setEditItem]         = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [saving, setSaving]             = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [eventDocs, setEventDocs]       = useState([])
  const [uploadFile, setUploadFile]     = useState(null)
  const [uploadType, setUploadType]     = useState('Programme')
  const [uploadTitle, setUploadTitle]   = useState('')
  const [uploading, setUploading]       = useState(false)
  const [showDocSection, setShowDocSection] = useState(false)

  const role    = getRole()
  const canEdit = ['ADMIN', 'DIRECTEUR', 'VICE_DIRECTEUR', 'CHEF_EQUIPE'].includes(role)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [evRes, mbRes] = await Promise.all([
        eventService.getEvents(),
        memberService.getMembers(),
      ])
      setEvents(evRes.data)
      setMembers(mbRes.data.filter(m => m.status !== 'ANCIEN' && m.status !== 'RETRAITE'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const fetchEventDocs = async (eventId) => {
    try {
      const res = await API.get(`/documents?eventId=${eventId}`)
      setEventDocs(res.data)
    } catch { setEventDocs([]) }
  }

  const openDetail = async (ev) => {
    setShowDetail(ev)
    setShowDocSection(false)
    setUploadFile(null)
    setUploadTitle('')
    setUploadType('Programme')
    await fetchEventDocs(ev.id)
  }

  const filtered = events.filter(e => {
    const org = e.organizer ? `${e.organizer.firstName} ${e.organizer.lastName}` : ''
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) ||
                        e.location?.toLowerCase().includes(search.toLowerCase()) ||
                        org.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'Tous' || e.type === filterType
    return matchSearch && matchType
  })

  const conferences = events.filter(e => e.type === 'CONFERENCE').length
  const seminaires  = events.filter(e => e.type === 'SEMINAIRE').length
  const workshops   = events.filter(e => e.type === 'WORKSHOP').length

  const openAdd = () => {
    setForm(emptyForm); setEditItem(null); setMemberSearch(''); setShowModal(true)
  }
  const openEdit = (ev) => {
    setForm({
      title: ev.title || '', type: ev.type || 'CONFERENCE',
      startDate: ev.startDate || '', endDate: ev.endDate || '',
      location: ev.location || '', organizerId: ev.organizer?.id || '',
      participantIds: ev.participants?.map(p => p.id) || [],
      description: ev.description || '',
    })
    setEditItem(ev.id); setMemberSearch(''); setShowModal(true)
  }
  const toggleParticipant = (id) => {
    setForm(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter(x => x !== id)
        : [...prev.participantIds, id]
    }))
  }

  const handleSave = async () => {
    if (!form.title?.trim() || !form.startDate) return
    try {
      setSaving(true)
      const payload = {
        title: form.title, type: form.type,
        startDate: form.startDate, endDate: form.endDate || null,
        location: form.location, description: form.description,
        organizerId: form.organizerId || null,
        participantIds: form.participantIds,
      }
      if (editItem) await eventService.updateEvent(editItem, payload)
      else          await eventService.createEvent(payload)
      fetchAll(); setShowModal(false)
    } catch { alert("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cet événement ?')) {
      try { await eventService.deleteEvent(id); fetchAll() }
      catch { alert('Erreur suppression') }
    }
  }

  const handleUploadDoc = async () => {
    if (!uploadFile || !uploadTitle.trim()) return
    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('title', uploadTitle)
      fd.append('type', uploadType)
      fd.append('category', 'EVENEMENT')
      fd.append('eventId', showDetail.id)
      await API.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadFile(null); setUploadTitle(''); setUploadType('Programme')
      await fetchEventDocs(showDetail.id)
    } catch { alert("Erreur lors de l'upload") }
    finally { setUploading(false) }
  }

  const handleDeleteDoc = async (docId) => {
    if (window.confirm('Supprimer ce document ?')) {
      try { await API.delete(`/documents/${docId}`); await fetchEventDocs(showDetail.id) }
      catch { alert('Erreur suppression') }
    }
  }

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())
  )

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(124,58,237,0.2)', borderTop:'3px solid #7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ color:'#94a3b8', fontSize:13 }}>Chargement des événements...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'28px', fontFamily:'"Inter","Segoe UI",sans-serif', background:'#f8f7ff', minHeight:'100vh', boxSizing:'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { 0%{opacity:0;transform:scale(0.94)} 60%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .ev-card { transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
        .ev-card:hover { box-shadow:0 10px 30px rgba(124,58,237,0.14) !important; transform:translateY(-4px) !important; border-color:rgba(124,58,237,0.18) !important; }
        .action-btn { transition:all 0.15s; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
        .member-row:hover { background:#f5f3ff !important; }
        .member-row { transition:background 0.15s; }
        .doc-row:hover { background:#faf8ff !important; }
        .doc-row { transition:background 0.15s; }
        .add-btn { transition:all 0.2s ease; }
        .add-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,0.45) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Événements scientifiques
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {events.length} événement{events.length > 1 ? 's' : ''}
            </span>
            {filtered.length !== events.length && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            </>}
            {events.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>{conferences} conférence{conferences > 1 ? 's' : ''}</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#059669', fontWeight:'600' }}>{seminaires} séminaire{seminaires > 1 ? 's' : ''}</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#d97706', fontWeight:'600' }}>{workshops} workshop{workshops > 1 ? 's' : ''}</span>
            </>}
          </div>
        </div>
        {canEdit && (
          <button className="add-btn" onClick={openAdd}
            style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 22px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(124,58,237,0.35)', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Créer un événement
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.1)', padding:'12px 16px', marginBottom:'20px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.05s both' }}>
        <div style={{ position:'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
            style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre, lieu ou organisateur..."
            style={{ ...inputStyle, padding:'9px 12px 9px 34px', fontSize:'13px' }}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ ...inputStyle, padding:'9px 12px', fontSize:'13px', cursor:'pointer' }}>
          <option value="Tous">Tous les types</option>
          <option value="CONFERENCE">Conférence</option>
          <option value="SEMINAIRE">Séminaire</option>
          <option value="WORKSHOP">Workshop</option>
        </select>
      </div>

      {/* ── Liste événements ── */}
      {events.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucun événement enregistré</p>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'24px' }}>Créez le premier événement scientifique du laboratoire</p>
          {canEdit && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
              Créer le premier événement
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', padding:'48px', textAlign:'center', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' }}>
          <p style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'12px' }}>Aucun résultat pour ces filtres</p>
          <button onClick={() => { setSearch(''); setFilterType('Tous') }}
            style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:'16px' }}>
          {filtered.map((ev, i) => (
            <div key={ev.id} className="ev-card"
              style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.04)', animation:`fadeUp 0.35s ease-out ${i * 0.05}s both` }}>

              {/* Header card */}
              <div style={{ background:`linear-gradient(135deg,${typeColor[ev.type]}18,${typeColor[ev.type]}06)`, padding:'18px 20px', borderBottom:`3px solid ${typeColor[ev.type]}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px' }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:typeColor[ev.type], background:typeBg[ev.type], padding:'3px 10px', borderRadius:'20px', display:'inline-block', marginBottom:'8px' }}>
                      {typeLabel[ev.type] || ev.type}
                    </span>
                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', lineHeight:'1.3', margin:0, cursor:'pointer' }}
                      onClick={() => openDetail(ev)}>
                      {ev.title}
                    </h3>
                  </div>
                  <div style={{ width:40, height:40, borderRadius:'10px', background:typeBg[ev.type], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={typeColor[ev.type]} strokeWidth="2">
                      <path d={typeIcon[ev.type]}/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Corps */}
              <div style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                  {ev.startDate && (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span style={{ fontSize:'12px', color:'#2d1058', fontWeight:'600' }}>
                        {formatDate(ev.startDate)}{ev.endDate && ev.endDate !== ev.startDate && ` → ${formatDate(ev.endDate)}`}
                      </span>
                    </div>
                  )}
                  {ev.location && (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span style={{ fontSize:'12px', color:'#64748b' }}>{ev.location}</span>
                    </div>
                  )}
                  {ev.organizer && (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <MemberAvatar member={ev.organizer} size={20}/>
                      <span style={{ fontSize:'12px', color:'#64748b' }}>{ev.organizer.firstName} {ev.organizer.lastName}</span>
                    </div>
                  )}
                  {ev.participants?.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ display:'flex' }}>
                        {ev.participants.slice(0, 4).map((p, idx) => (
                          <div key={p.id} style={{ marginLeft:idx > 0 ? '-6px' : 0, border:'2px solid white', borderRadius:'50%' }}>
                            <MemberAvatar member={p} size={22}/>
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize:'11px', color:'#94a3b8' }}>{ev.participants.length} participant{ev.participants.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {ev.description && (
                    <p style={{ fontSize:'12px', color:'#94a3b8', lineHeight:'1.5', margin:'2px 0 0', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {ev.description}
                    </p>
                  )}
                </div>

                {/* Séparateur + Actions */}
                <div style={{ height:1, background:'rgba(124,58,237,0.06)', marginBottom:'12px' }}/>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={() => openDetail(ev)} className="action-btn"
                    style={{ flex:1, background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px', fontSize:'12px' }}>
                    Détails
                  </button>
                  {canEdit && <>
                    <button onClick={() => openEdit(ev)} className="action-btn"
                      style={{ flex:1, background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'8px', fontSize:'12px' }}>
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="action-btn"
                      style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'8px 10px', fontSize:'12px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Détail ── */}
      {showDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', width:'560px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ background:`linear-gradient(135deg,${typeColor[showDetail.type]}20,${typeColor[showDetail.type]}06)`, padding:'24px 28px 20px', borderBottom:`3px solid ${typeColor[showDetail.type]}` }}>
              <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <div style={{ width:52, height:52, borderRadius:'14px', background:typeBg[showDetail.type], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`2px solid ${typeColor[showDetail.type]}` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={typeColor[showDetail.type]} strokeWidth="1.5">
                    <path d={typeIcon[showDetail.type]}/>
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize:'11px', fontWeight:'700', color:typeColor[showDetail.type], background:typeBg[showDetail.type], padding:'3px 10px', borderRadius:'20px', display:'inline-block', marginBottom:'8px' }}>
                    {typeLabel[showDetail.type]}
                  </span>
                  <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', margin:0, lineHeight:'1.3' }}>{showDetail.title}</h2>
                </div>
              </div>
            </div>

            <div style={{ padding:'24px 28px' }}>
              <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'16px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                {[
                  { label:'Date de début', val:formatDate(showDetail.startDate), icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label:'Date de fin',   val:formatDate(showDetail.endDate),   icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label:'Lieu',          val:showDetail.location || 'Non renseigné', icon:'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'8px 0', borderBottom:i < arr.length-1 ? '1px solid #f0eeff' : 'none' }}>
                    <div style={{ width:28, height:28, borderRadius:'8px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d={item.icon}/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>{item.label}</div>
                      <span style={{ fontSize:'13px', fontWeight:item.val==='Non renseigné'?'400':'600', color:item.val==='Non renseigné'?'#c4b5fd':'#2d1058', fontStyle:item.val==='Non renseigné'?'italic':'normal' }}>{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>

              {showDetail.organizer && (
                <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Organisateur</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <MemberAvatar member={showDetail.organizer} size={36}/>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'700', color:'#2d1058' }}>{showDetail.organizer.firstName} {showDetail.organizer.lastName}</div>
                      <div style={{ fontSize:'11px', color:'#94a3b8' }}>{showDetail.organizer.status}</div>
                    </div>
                  </div>
                </div>
              )}

              {showDetail.participants?.length > 0 && (
                <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
                    Participants ({showDetail.participants.length})
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'140px', overflowY:'auto' }}>
                    {showDetail.participants.map(p => (
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <MemberAvatar member={p} size={28}/>
                        <div>
                          <div style={{ fontSize:'12px', fontWeight:'600', color:'#2d1058' }}>{p.firstName} {p.lastName}</div>
                          <div style={{ fontSize:'10px', color:'#94a3b8' }}>{p.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showDetail.description && (
                <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Description</div>
                  <p style={{ fontSize:'13px', color:'#2d1058', lineHeight:'1.6', margin:0 }}>{showDetail.description}</p>
                </div>
              )}

              {/* Documents archivés */}
              <div style={{ border:'1px solid rgba(124,58,237,0.15)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div onClick={() => setShowDocSection(!showDocSection)}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'#f5f3ff', cursor:'pointer', userSelect:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#6d28d9' }}>Documents archivés</span>
                    <span style={{ fontSize:'11px', background:'#ede9fe', color:'#7c3aed', padding:'2px 8px', borderRadius:'20px', fontWeight:'600' }}>{eventDocs.length}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"
                    style={{ transform:showDocSection?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showDocSection && (
                  <div style={{ padding:'16px' }}>
                    {eventDocs.length > 0 && (
                      <div style={{ marginBottom:'14px', display:'flex', flexDirection:'column', gap:'6px' }}>
                        {eventDocs.map(doc => (
                          <div key={doc.id} className="doc-row"
                            style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'8px', background:'#faf8ff', border:'1px solid rgba(124,58,237,0.08)' }}>
                            <div style={{ width:32, height:32, borderRadius:'8px', background:docTypeBg[doc.type]||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={docTypeColor[doc.type]||'#64748b'} strokeWidth="2">
                                <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                              </svg>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'12px', fontWeight:'600', color:'#2d1058', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{doc.title}</div>
                              <span style={{ fontSize:'10px', fontWeight:'700', color:docTypeColor[doc.type]||'#64748b', background:docTypeBg[doc.type]||'#f1f5f9', padding:'1px 6px', borderRadius:'20px' }}>{doc.type}</span>
                            </div>
                            <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                              {doc.fileUrl && (
                                <a href={`http://localhost:8081${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                  style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'600', textDecoration:'none' }}>
                                  Voir
                                </a>
                              )}
                              {canEdit && (
                                <button onClick={() => handleDeleteDoc(doc.id)}
                                  style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'4px 6px', borderRadius:'6px', fontSize:'11px', cursor:'pointer' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {canEdit && (
                      <div style={{ background:'#f8f7ff', borderRadius:'10px', padding:'14px', border:'1.5px dashed rgba(124,58,237,0.25)' }}>
                        <div style={{ fontSize:'11px', fontWeight:'700', color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Ajouter un document</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'8px' }}>
                          <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                            placeholder="Titre du document"
                            style={{ ...inputStyle, padding:'8px 10px', fontSize:'12px' }}
                            onFocus={e => e.target.style.borderColor='#7c3aed'}
                            onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
                          <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                            style={{ ...inputStyle, padding:'8px 10px', fontSize:'12px', cursor:'pointer' }}>
                            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                          <label style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', border:'1.5px solid rgba(124,58,237,0.2)', borderRadius:'8px', background:'white', cursor:'pointer', fontSize:'12px', color:uploadFile?'#2d1058':'#94a3b8' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            {uploadFile ? uploadFile.name : 'Choisir un fichier...'}
                            <input type="file" onChange={e => setUploadFile(e.target.files[0])} style={{ display:'none' }} />
                          </label>
                          <button onClick={handleUploadDoc} disabled={uploading || !uploadFile || !uploadTitle.trim()}
                            style={{ background:uploading||!uploadFile||!uploadTitle.trim()?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:uploading||!uploadFile||!uploadTitle.trim()?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
                            {uploading ? '...' : 'Uploader'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:'8px' }}>
                {canEdit && (
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
        </div>
      )}

      {/* ── Modal Créer/Modifier ── */}
      {showModal && canEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'580px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>

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
                {editItem ? "Modifier l'événement" : 'Créer un événement'}
              </h2>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Titre *</label>
              <input value={form.title||''} onChange={e => setForm({...form, title:e.target.value})}
                placeholder="Titre de l'événement" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="CONFERENCE">Conférence</option>
                <option value="SEMINAIRE">Séminaire</option>
                <option value="WORKSHOP">Workshop</option>
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={labelStyle}>Date de début *</label>
                <input type="date" value={form.startDate||''} onChange={e => setForm({...form, startDate:e.target.value})}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
              <div>
                <label style={labelStyle}>Date de fin</label>
                <input type="date" value={form.endDate||''} onChange={e => setForm({...form, endDate:e.target.value})}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Lieu</label>
              <input value={form.location||''} onChange={e => setForm({...form, location:e.target.value})}
                placeholder="Salle, ville, pays..." style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Organisateur</label>
              <select value={form.organizerId||''} onChange={e => setForm({...form, organizerId:e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">-- Sélectionner un membre --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.status})</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>
                Participants
                <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>
                  ({form.participantIds.length} sélectionné{form.participantIds.length > 1 ? 's' : ''})
                </span>
              </label>
              <div style={{ border:'1.5px solid rgba(124,58,237,0.2)', borderRadius:'8px', background:'#faf8ff', overflow:'hidden' }}>
                <div style={{ padding:'8px', borderBottom:'1px solid rgba(124,58,237,0.1)' }}>
                  <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Rechercher un membre..."
                    style={{ ...inputStyle, padding:'7px 10px', fontSize:'12px', background:'white' }}
                    onFocus={e => e.target.style.borderColor='#7c3aed'}
                    onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
                </div>
                <div style={{ maxHeight:'180px', overflowY:'auto' }}>
                  {filteredMembers.map(m => {
                    const selected = form.participantIds.includes(m.id)
                    return (
                      <div key={m.id} className="member-row" onClick={() => toggleParticipant(m.id)}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', cursor:'pointer', background:selected?'#f5f3ff':'transparent', borderBottom:'1px solid #f0eeff' }}>
                        <div style={{ width:18, height:18, borderRadius:'5px', border:`2px solid ${selected?'#7c3aed':'#d1d5db'}`, background:selected?'#7c3aed':'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                          {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <MemberAvatar member={m} size={28}/>
                        <div>
                          <div style={{ fontSize:'12px', fontWeight:'600', color:'#2d1058' }}>{m.firstName} {m.lastName}</div>
                          <div style={{ fontSize:'10px', color:'#94a3b8' }}>{m.status}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginBottom:'22px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description||''} onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Description de l'événement..."
                style={{ ...inputStyle, height:'80px', resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? 'Enregistrement...' : editItem ? "Enregistrer les modifications" : "Créer l'événement"}
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