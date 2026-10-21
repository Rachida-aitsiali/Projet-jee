import { useState, useEffect, useRef } from 'react'
import conventionService from '../services/conventionService'
import { getRole } from '../services/authService'

const typeColor  = { RECHERCHE:'#7c3aed', FORMATION:'#2563eb', INDUSTRIELLE:'#d97706', ECHANGE:'#059669' }
const typeBg     = { RECHERCHE:'#f5f3ff', FORMATION:'#eff6ff', INDUSTRIELLE:'#fffbeb', ECHANGE:'#ecfdf5' }
const typeLabel  = { RECHERCHE:'Recherche', FORMATION:'Formation', INDUSTRIELLE:'Industrielle', ECHANGE:'Échange' }
const statusColor = { ACTIVE:'#059669', EXPIREE:'#dc2626', EN_ATTENTE:'#d97706', SUSPENDUE:'#64748b' }
const statusBg   = { ACTIVE:'#ecfdf5', EXPIREE:'#fef2f2', EN_ATTENTE:'#fffbeb', SUSPENDUE:'#f1f5f9' }
const statusLabel = { ACTIVE:'Active', EXPIREE:'Expirée', EN_ATTENTE:'En attente', SUSPENDUE:'Suspendue' }

const emptyForm = { title:'', partner:'', type:'RECHERCHE', description:'', startDate:'', endDate:'', status:'EN_ATTENTE', activities:'' }

const inputStyle = {
  width:'100%', padding:'10px 14px',
  border:'1.5px solid rgba(124,58,237,0.2)', borderRadius:'8px',
  fontSize:'14px', outline:'none', background:'#faf8ff',
  boxSizing:'border-box', color:'#2d1058', fontFamily:'Inter,sans-serif',
}
const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:'700',
  color:'#6d28d9', marginBottom:'6px',
  textTransform:'uppercase', letterSpacing:'0.5px',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}
function daysLeft(endDate) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate) - new Date()) / (1000*60*60*24))
}

export default function Conventions() {
  const [conventions, setConventions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('Tous')
  const [filterType, setFilterType]   = useState('Tous')
  const [showModal, setShowModal]     = useState(false)
  const [showDetail, setShowDetail]   = useState(null)
  const [editItem, setEditItem]       = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [docFile, setDocFile]         = useState(null)
  const [uploading, setUploading]     = useState(false)
  const docInputRef                   = useRef()
  const createDocRef                  = useRef()
  const [createDocFile, setCreateDocFile] = useState(null)

  const role    = getRole()
  const canEdit = ['ADMIN','DIRECTEUR','VICE_DIRECTEUR'].includes(role)

  const fetchConventions = async () => {
    try {
      setLoading(true)
      const res = await conventionService.getConventions()
      setConventions(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchConventions() }, [])

  const filtered = conventions.filter(c => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) ||
                        c.partner?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Tous' || c.status === filterStatus
    const matchType   = filterType   === 'Tous' || c.type   === filterType
    return matchSearch && matchStatus && matchType
  })

  const actives    = conventions.filter(c => c.status === 'ACTIVE').length
  const enAttente  = conventions.filter(c => c.status === 'EN_ATTENTE').length
  const expirees   = conventions.filter(c => c.status === 'EXPIREE').length

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setCreateDocFile(null); setShowModal(true) }
  const openEdit = (c) => {
    setForm({ title:c.title||'', partner:c.partner||'', type:c.type||'RECHERCHE', description:c.description||'',
              startDate:c.startDate||'', endDate:c.endDate||'', status:c.status||'EN_ATTENTE', activities:c.activities||'' })
    setEditItem(c.id); setCreateDocFile(null); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title?.trim() || !form.partner?.trim()) return
    try {
      setSaving(true)
      let saved
      if (editItem) { const res = await conventionService.updateConvention(editItem, form); saved = res.data }
      else          { const res = await conventionService.createConvention(form);           saved = res.data }
      if (createDocFile && saved?.id) await conventionService.uploadDocument(saved.id, createDocFile)
      fetchConventions(); setShowModal(false)
    } catch { alert("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette convention ?')) {
      try { await conventionService.deleteConvention(id); fetchConventions() }
      catch { alert('Erreur suppression') }
    }
  }

  const handleUploadDoc = async (conventionId) => {
    if (!docFile) return
    try {
      setUploading(true)
      await conventionService.uploadDocument(conventionId, docFile)
      setDocFile(null)
      const res = await conventionService.getConventions()
      setConventions(res.data)
      const updated = res.data.find(c => c.id === conventionId)
      if (updated) setShowDetail(updated)
    } catch { alert("Erreur upload document") }
    finally { setUploading(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(124,58,237,0.2)', borderTop:'3px solid #7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ color:'#94a3b8', fontSize:13 }}>Chargement...</div>
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
        .conv-card { transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
        .conv-card:hover { box-shadow:0 8px 28px rgba(124,58,237,0.13) !important; transform:translateY(-3px); border-color:rgba(124,58,237,0.18) !important; }
        .action-btn { transition:all 0.15s; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
        .add-btn { transition:all 0.2s ease; }
        .add-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,0.45) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Conventions & Collaborations
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {conventions.length} convention{conventions.length > 1 ? 's' : ''}
            </span>
            {conventions.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#059669', fontWeight:'600' }}>{actives} active{actives>1?'s':''}</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#d97706', fontWeight:'600' }}>{enAttente} en attente</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#dc2626', fontWeight:'600' }}>{expirees} expirée{expirees>1?'s':''}</span>
            </>}
          </div>
        </div>
        {canEdit && (
          <button className="add-btn" onClick={openAdd}
            style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 22px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(124,58,237,0.35)', display:'flex', alignItems:'center', gap:'6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle convention
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.1)', padding:'12px 16px', marginBottom:'20px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'10px', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.05s both' }}>
        <div style={{ position:'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
            style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou partenaire..."
            style={{ ...inputStyle, padding:'9px 12px 9px 34px', fontSize:'13px' }}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ ...inputStyle, padding:'9px 12px', fontSize:'13px', cursor:'pointer' }}>
          <option value="Tous">Tous les types</option>
          <option value="RECHERCHE">Recherche</option>
          <option value="FORMATION">Formation</option>
          <option value="INDUSTRIELLE">Industrielle</option>
          <option value="ECHANGE">Échange</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ ...inputStyle, padding:'9px 12px', fontSize:'13px', cursor:'pointer' }}>
          <option value="Tous">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EXPIREE">Expirée</option>
          <option value="SUSPENDUE">Suspendue</option>
        </select>
      </div>

      {/* ── Liste ── */}
      {conventions.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucune convention</p>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'24px' }}>Créez la première convention du laboratoire</p>
          {canEdit && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
              Nouvelle convention
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', padding:'48px', textAlign:'center', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' }}>
          <p style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'12px' }}>Aucun résultat</p>
          <button onClick={() => { setSearch(''); setFilterStatus('Tous'); setFilterType('Tous') }}
            style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {filtered.map((c, i) => {
            const days = daysLeft(c.endDate)
            const expiringSoon = days !== null && days > 0 && days <= 30
            return (
              <div key={c.id} className="conv-card"
                style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', padding:'20px 24px', borderLeft:`4px solid ${typeColor[c.type]||'#7c3aed'}`, boxShadow:'0 2px 8px rgba(124,58,237,0.04)', animation:`fadeUp 0.35s ease-out ${i*0.04}s both` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'16px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:'11px', fontWeight:'700', color:typeColor[c.type]||'#7c3aed', background:typeBg[c.type]||'#f5f3ff', padding:'3px 10px', borderRadius:'20px' }}>
                        {typeLabel[c.type]||c.type}
                      </span>
                      <span style={{ fontSize:'11px', fontWeight:'700', color:statusColor[c.status]||'#64748b', background:statusBg[c.status]||'#f1f5f9', padding:'3px 10px', borderRadius:'20px' }}>
                        {statusLabel[c.status]||c.status}
                      </span>
                      {expiringSoon && (
                        <span style={{ fontSize:'11px', fontWeight:'700', color:'#d97706', background:'#fffbeb', padding:'3px 10px', borderRadius:'20px', border:'1px solid #fbbf24', display:'flex', alignItems:'center', gap:'4px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Expire dans {days} jours
                        </span>
                      )}
                      {c.documentUrl && (
                        <span style={{ fontSize:'11px', fontWeight:'600', color:'#7c3aed', background:'#f5f3ff', padding:'3px 10px', borderRadius:'20px', border:'1px solid rgba(124,58,237,0.2)' }}>
                          Document joint
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px', cursor:'pointer' }}
                      onClick={() => setShowDetail(c)}>
                      {c.title}
                    </h3>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <span style={{ fontSize:'13px', color:'#6d28d9', fontWeight:'600' }}>{c.partner}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span style={{ fontSize:'12px', color:'#94a3b8' }}>{formatDate(c.startDate)} → {formatDate(c.endDate)}</span>
                    </div>
                    {c.activities && (
                      <div style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                        <span style={{ fontSize:'12px', color:'#64748b', fontStyle:'italic' }}>{c.activities}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                    <button onClick={() => setShowDetail(c)} className="action-btn"
                      style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'6px 14px', fontSize:'12px' }}>
                      Voir
                    </button>
                    {canEdit && (
                      <button onClick={() => openEdit(c)} className="action-btn"
                        style={{ background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'6px 14px', fontSize:'12px' }}>
                        Modifier
                      </button>
                    )}
                    {c.documentUrl && (
                      <a href={`http://localhost:8081${c.documentUrl}`} target="_blank" rel="noopener noreferrer"
                        style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'6px 14px', fontSize:'12px', borderRadius:'6px', fontWeight:'600', textDecoration:'none', textAlign:'center' }}>
                        PDF
                      </a>
                    )}
                    {canEdit && (
                      <button onClick={() => handleDelete(c.id)} className="action-btn"
                        style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'6px 8px', fontSize:'12px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Détail ── */}
      {showDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', width:'520px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ background:`linear-gradient(135deg,${typeColor[showDetail.type]||'#7c3aed'}20,${typeColor[showDetail.type]||'#7c3aed'}06)`, padding:'24px 28px 20px', borderBottom:`3px solid ${typeColor[showDetail.type]||'#7c3aed'}` }}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
                <span style={{ fontSize:'11px', fontWeight:'700', color:typeColor[showDetail.type]||'#7c3aed', background:typeBg[showDetail.type]||'#f5f3ff', padding:'3px 10px', borderRadius:'20px' }}>
                  {typeLabel[showDetail.type]||showDetail.type}
                </span>
                <span style={{ fontSize:'11px', fontWeight:'700', color:statusColor[showDetail.status]||'#64748b', background:statusBg[showDetail.status]||'#f1f5f9', padding:'3px 10px', borderRadius:'20px' }}>
                  {statusLabel[showDetail.status]||showDetail.status}
                </span>
              </div>
              <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', margin:0 }}>{showDetail.title}</h2>
            </div>
            <div style={{ padding:'24px 28px' }}>
              <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'16px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                {[
                  { label:'Partenaire', val:showDetail.partner||'Non renseigné', icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
                  { label:'Date début', val:formatDate(showDetail.startDate), icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label:'Date fin',   val:formatDate(showDetail.endDate),   icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'8px 0', borderBottom:i<arr.length-1?'1px solid #f0eeff':'none' }}>
                    <div style={{ width:28, height:28, borderRadius:'8px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d={item.icon}/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>{item.label}</div>
                      <span style={{ fontSize:'13px', fontWeight:item.val==='Non renseigné'?'400':'600', color:item.val==='Non renseigné'?'#c4b5fd':'#2d1058', fontStyle:item.val==='Non renseigné'?'italic':'normal' }}>
                        {item.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {showDetail.description && (
                <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Description</div>
                  <p style={{ fontSize:'13px', color:'#2d1058', lineHeight:'1.6', margin:0 }}>{showDetail.description}</p>
                </div>
              )}
              {showDetail.activities && (
                <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Activités associées</div>
                  <p style={{ fontSize:'13px', color:'#2d1058', lineHeight:'1.6', margin:0 }}>{showDetail.activities}</p>
                </div>
              )}
              <div style={{ border:'1px solid rgba(124,58,237,0.15)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ background:'#f5f3ff', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#6d28d9' }}>Document convention</span>
                  </div>
                  {showDetail.documentUrl && (
                    <a href={`http://localhost:8081${showDetail.documentUrl}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:'12px', fontWeight:'700', color:'#7c3aed', textDecoration:'none', background:'white', padding:'4px 12px', borderRadius:'6px', border:'1px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', gap:'4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Télécharger
                    </a>
                  )}
                </div>
                {canEdit && (
                  <div style={{ padding:'14px 16px', background:'white' }}>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <label style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', border:'1.5px solid rgba(124,58,237,0.2)', borderRadius:'8px', background:'#faf8ff', cursor:'pointer', fontSize:'12px', color:docFile?'#2d1058':'#94a3b8' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {docFile ? docFile.name : showDetail.documentUrl ? 'Remplacer le document...' : 'Choisir un fichier PDF...'}
                        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx"
                          onChange={e => setDocFile(e.target.files[0])} style={{ display:'none' }} />
                      </label>
                      <button onClick={() => handleUploadDoc(showDetail.id)} disabled={uploading||!docFile}
                        style={{ background:uploading||!docFile?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:uploading||!docFile?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
                        {uploading ? '...' : 'Uploader'}
                      </button>
                    </div>
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
                <button onClick={() => { setShowDetail(null); setDocFile(null) }}
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
                  {editItem ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
                </svg>
              </div>
              <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#2d1058', margin:0 }}>
                {editItem ? 'Modifier la convention' : 'Nouvelle convention'}
              </h2>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Titre *</label>
              <input value={form.title||''} onChange={e => setForm({...form, title:e.target.value})}
                placeholder="Titre de la convention" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Partenaire *</label>
              <input value={form.partner||''} onChange={e => setForm({...form, partner:e.target.value})}
                placeholder="Nom du partenaire / institution" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type:e.target.value})} style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="RECHERCHE">Recherche</option>
                  <option value="FORMATION">Formation</option>
                  <option value="INDUSTRIELLE">Industrielle</option>
                  <option value="ECHANGE">Échange</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={form.status} onChange={e => setForm({...form, status:e.target.value})} style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDUE">Suspendue</option>
                  <option value="EXPIREE">Expirée</option>
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={labelStyle}>Date de début</label>
                <input type="date" value={form.startDate||''} onChange={e => setForm({...form, startDate:e.target.value})}
                  style={inputStyle} onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
              <div>
                <label style={labelStyle}>Date de fin</label>
                <input type="date" value={form.endDate||''} onChange={e => setForm({...form, endDate:e.target.value})}
                  style={inputStyle} onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description||''} onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Description de la convention..."
                style={{ ...inputStyle, height:'70px', resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Activités associées</label>
              <textarea value={form.activities||''} onChange={e => setForm({...form, activities:e.target.value})}
                placeholder="Ex: Échanges d'étudiants, publications conjointes, séminaires..."
                style={{ ...inputStyle, height:'70px', resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'22px' }}>
              <label style={labelStyle}>
                Document convention
                <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>(optionnel — PDF, DOC)</span>
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', border:'1.5px dashed rgba(124,58,237,0.3)', borderRadius:'8px', background:createDocFile?'rgba(124,58,237,0.04)':'#faf8ff', cursor:'pointer', transition:'all 0.15s' }}>
                <div style={{ width:32, height:32, borderRadius:'8px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:createDocFile?'#2d1058':'#94a3b8' }}>
                    {createDocFile ? createDocFile.name : 'Cliquez pour joindre un document'}
                  </div>
                  {createDocFile && <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>{(createDocFile.size/1024/1024).toFixed(2)} MB</div>}
                </div>
                <input ref={createDocRef} type="file" accept=".pdf,.doc,.docx"
                  onChange={e => setCreateDocFile(e.target.files[0])} style={{ display:'none' }} />
              </label>
              {createDocFile && (
                <button onClick={() => setCreateDocFile(null)}
                  style={{ marginTop:'6px', background:'none', border:'none', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'600' }}>
                  Supprimer
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer la convention'}
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