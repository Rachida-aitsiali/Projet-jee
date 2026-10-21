import { useState, useEffect, useRef } from 'react'
import documentService from '../services/documentService'
import api from '../services/api'
import { getRole } from '../services/authService'

const typeColor = { RAPPORT:'#7c3aed', PROGRAMME:'#059669', DEMANDE_FINANCEMENT:'#d97706', PV:'#2563eb', ATTESTATION:'#0891b2', ADMINISTRATIF:'#475569' }
const typeBg    = { RAPPORT:'#f5f3ff', PROGRAMME:'#ecfdf5', DEMANDE_FINANCEMENT:'#fffbeb', PV:'#eff6ff', ATTESTATION:'#ecfeff', ADMINISTRATIF:'#f1f5f9' }
const typeLabel = { RAPPORT:'Rapport', PROGRAMME:'Programme', DEMANDE_FINANCEMENT:'Demande', PV:'PV', ATTESTATION:'Attestation', ADMINISTRATIF:'Administratif' }
const emptyForm = { title:'', type:'RAPPORT', category:'Administratif', uploadedBy:'', eventId:'' }

const inputStyle = {
  width:'100%', padding:'10px 14px',
  border:'1.5px solid rgba(124,58,237,0.2)', borderRadius:'8px',
  fontSize:'14px', outline:'none', background:'#faf8ff',
  boxSizing:'border-box', color:'#2d1058', fontFamily:'Inter,sans-serif'
}
const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:'700',
  color:'#6d28d9', marginBottom:'6px',
  textTransform:'uppercase', letterSpacing:'0.5px'
}

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [file, setFile]           = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const fileInputRef              = useRef()

  const role    = getRole()
  const canEdit = ['ADMIN','DIRECTEUR','VICE_DIRECTEUR','CHEF_EQUIPE'].includes(role)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await documentService.getDocuments()
      setDocuments(response.data)
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchDocuments()
    api.get('/events').then(r => setEvents(r.data)).catch(() => {})
  }, [])

  const filtered = documents.filter(d => {
    const matchSearch = d.title?.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType ? d.type === filterType : true
    return matchSearch && matchType
  })

  const openAdd  = () => { setForm(emptyForm); setFile(null); setEditItem(null); setShowModal(true) }
  const openEdit = (d) => { setForm({...d, eventId: d.event?.id || ''}); setFile(null); setEditItem(d.id); setShowModal(true) }
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) setFile(f) }
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }

  const handleSave = async () => {
    if (!form.title) return alert('Le titre est obligatoire')
    try {
      setUploading(true)
      if (!editItem && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', form.title)
        formData.append('type', form.type)
        formData.append('category', form.category)
        formData.append('uploadedBy', form.uploadedBy || '')
        if (form.eventId) formData.append('eventId', form.eventId)
        await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else if (editItem) {
        await documentService.updateDocument(editItem, form)
      } else {
        await documentService.createDocument(form)
      }
      fetchDocuments(); setShowModal(false); setFile(null)
    } catch { alert("Erreur lors de l'enregistrement") }
    finally { setUploading(false) }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce document ?')) {
      try { await documentService.deleteDocument(id); fetchDocuments() }
      catch { alert('Erreur suppression') }
    }
  }

  const handleView = (doc) => {
    if (doc.fileUrl) window.open('http://localhost:8081' + doc.fileUrl, '_blank')
    else alert('Aucun fichier associé')
  }

  const getFileIcon = (doc) => {
    const base = 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
    const fold = 'M14 2 14 8 20 8'
    const lines = 'M16 13 8 13 M16 17 8 17'
    if (doc.fileType?.includes('pdf') || doc.fileUrl?.endsWith('.pdf'))
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={base}/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    if (doc.fileType?.includes('word') || doc.fileUrl?.endsWith('.docx'))
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={base}/><polyline points="14 2 14 8 20 8"/></svg>
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={base}/><polyline points="14 2 14 8 20 8"/></svg>
  }

  // Compteurs pour le header
  const rapports  = documents.filter(d => d.type === 'RAPPORT').length
  const pvs       = documents.filter(d => d.type === 'PV').length
  const autres    = documents.filter(d => !['RAPPORT','PV'].includes(d.type)).length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(124,58,237,0.2)', borderTop:'3px solid #7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ color:'#94a3b8', fontSize:13 }}>Chargement des documents...</div>
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
        .doc-row { transition:all 0.15s ease; }
        .doc-row:hover { background:#faf8ff !important; }
        .action-btn { transition:all 0.15s; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
        .add-btn { transition:all 0.2s ease; }
        .add-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,0.45) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Archivage Documentaire
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {documents.length} document{documents.length > 1 ? 's' : ''}
            </span>
            {filtered.length !== documents.length && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            </>}
            {documents.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>{rapports} rapport{rapports > 1 ? 's' : ''}</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#2563eb', fontWeight:'600' }}>{pvs} PV</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#d97706', fontWeight:'600' }}>{autres} autre{autres > 1 ? 's' : ''}</span>
            </>}
          </div>
        </div>
        {canEdit && (
          <button className="add-btn" onClick={openAdd}
            style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 22px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(124,58,237,0.35)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Uploader un document
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.1)', padding:'12px 16px', marginBottom:'16px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.05s both' }}>
        <div style={{ position:'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
            style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            style={{ ...inputStyle, padding:'9px 12px 9px 34px', fontSize:'13px' }}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ ...inputStyle, padding:'9px 12px', fontSize:'13px', cursor:'pointer' }}>
          <option value="">Tous les types</option>
          <option value="RAPPORT">Rapport</option>
          <option value="PROGRAMME">Programme</option>
          <option value="DEMANDE_FINANCEMENT">Demande financement</option>
          <option value="PV">PV</option>
          <option value="ATTESTATION">Attestation</option>
          <option value="ADMINISTRATIF">Administratif</option>
        </select>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>
            {documents.length === 0 ? 'Aucun document archivé' : 'Aucun résultat pour ces filtres'}
          </p>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'20px' }}>
            {documents.length === 0 ? 'Commencez par uploader le premier document du laboratoire' : 'Essayez de modifier les filtres'}
          </p>
          {documents.length === 0 && canEdit && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
              Uploader le premier document
            </button>
          )}
          {documents.length > 0 && (
            <button onClick={() => { setSearch(''); setFilterType('') }}
              style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.1s both' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'650px' }}>
              <thead>
                <tr style={{ background:'#f5f3ff', borderBottom:'2px solid rgba(124,58,237,0.1)' }}>
                  {['Document','Type','Catégorie','Événement lié','Fichier','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className="doc-row"
                    style={{ borderBottom:'1px solid #f5f3ff', background:'white', animation:`fadeUp 0.3s ease-out ${i * 0.03}s both` }}>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:36, height:36, background:typeBg[d.type]||'#f5f3ff', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 2px 6px ${typeColor[d.type] || '#7c3aed'}20` }}>
                          {getFileIcon(d)}
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:'600', color:'#2d1058' }}>{d.title}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontSize:'10px', fontWeight:'700', color:typeColor[d.type]||'#7c3aed', background:typeBg[d.type]||'#f5f3ff', padding:'3px 10px', borderRadius:'20px', whiteSpace:'nowrap', border:`1px solid ${typeColor[d.type] || '#7c3aed'}25` }}>
                        {typeLabel[d.type] || d.type}
                      </span>
                    </td>
                    <td style={{ padding:'13px 16px', fontSize:'12px', color:'#64748b' }}>{d.category || '—'}</td>
                    <td style={{ padding:'13px 16px' }}>
                      {d.event
                        ? <span style={{ fontSize:'11px', color:'#7c3aed', background:'#f5f3ff', padding:'3px 10px', borderRadius:'20px', fontWeight:'600', whiteSpace:'nowrap', border:'1px solid rgba(124,58,237,0.15)' }}>{d.event.title}</span>
                        : <span style={{ color:'#94a3b8', fontSize:'12px' }}>—</span>}
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      {d.fileUrl
                        ? <span style={{ fontSize:'11px', color:'#059669', background:'#ecfdf5', padding:'3px 10px', borderRadius:'20px', fontWeight:'600', whiteSpace:'nowrap', border:'1px solid #bbf7d0' }}>✓ Fichier joint</span>
                        : <span style={{ fontSize:'11px', color:'#94a3b8', background:'#f1f5f9', padding:'3px 10px', borderRadius:'20px' }}>Aucun fichier</span>}
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', gap:'4px', flexWrap:'nowrap' }}>
                        {d.fileUrl && (
                          <button onClick={() => handleView(d)} className="action-btn"
                            style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #bbf7d0', padding:'5px 10px', fontSize:'11px' }}>
                            Voir
                          </button>
                        )}
                        {canEdit && <>
                          <button onClick={() => openEdit(d)} className="action-btn"
                            style={{ background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px' }}>
                            Modifier
                          </button>
                          <button onClick={() => handleDelete(d.id)} className="action-btn"
                            style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'5px 10px', fontSize:'11px' }}>
                            Supprimer
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Upload / Modifier ── */}
      {showModal && canEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'520px', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto', animation:'popIn 0.3s ease-out' }}>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'22px', paddingBottom:'16px', borderBottom:'1px solid #f0eeff' }}>
              <div style={{ width:36, height:36, borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {editItem
                    ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                    : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>
                  }
                </svg>
              </div>
              <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#2d1058', margin:0 }}>
                {editItem ? 'Modifier le document' : 'Uploader un document'}
              </h2>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Titre *</label>
              <input value={form.title||''} onChange={e => setForm({...form, title:e.target.value})}
                placeholder="Titre du document"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="RAPPORT">Rapport</option>
                  <option value="PROGRAMME">Programme</option>
                  <option value="DEMANDE_FINANCEMENT">Demande financement</option>
                  <option value="PV">PV</option>
                  <option value="ATTESTATION">Attestation</option>
                  <option value="ADMINISTRATIF">Administratif</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="Administratif">Administratif</option>
                  <option value="Événement">Événement</option>
                  <option value="Financement">Financement</option>
                  <option value="Réunion">Réunion</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>
                Lié à un événement
                <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>(optionnel)</span>
              </label>
              <select value={form.eventId||''} onChange={e => setForm({...form, eventId:e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">-- Aucun événement --</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>

            {!editItem && (
              <div style={{ marginBottom:'22px' }}>
                <label style={labelStyle}>Fichier</label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    padding:'24px 16px',
                    background: dragOver ? '#ede9fe' : file ? '#f0fdf4' : '#faf8ff',
                    borderRadius:'10px',
                    border:`2px dashed ${dragOver ? '#7c3aed' : file ? '#059669' : 'rgba(124,58,237,0.3)'}`,
                    textAlign:'center', cursor:'pointer', transition:'all 0.2s',
                  }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} style={{ display:'none' }}/>
                  {file ? (
                    <>
                      <div style={{ width:40, height:40, borderRadius:'10px', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p style={{ fontSize:'13px', color:'#059669', fontWeight:'700', margin:'0 0 2px' }}>{file.name}</p>
                      <p style={{ fontSize:'11px', color:'#94a3b8', margin:0 }}>{(file.size/1024/1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:'0 auto 10px', display:'block' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p style={{ fontSize:'13px', color:'#6d28d9', fontWeight:'600', margin:'0 0 4px' }}>Glissez un fichier ou cliquez</p>
                      <p style={{ fontSize:'11px', color:'#94a3b8', margin:0 }}>PDF, DOC, DOCX, PNG, JPG — Max 10MB</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={uploading}
                style={{ flex:2, background:uploading?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:uploading?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {uploading ? 'Upload en cours...' : editItem ? 'Enregistrer les modifications' : 'Uploader'}
              </button>
              <button onClick={() => setShowModal(false)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}