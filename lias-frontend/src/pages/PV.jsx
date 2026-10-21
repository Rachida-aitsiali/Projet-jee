import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { getRole } from '../services/authService'

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
const emptyForm = { title:'', date:'', participants:0, agenda:'', description:'', status:'BROUILLON' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
}

export default function PV() {
  const [pvList, setPvList]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [file, setFile]           = useState(null)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('Tous')
  const [detailFile, setDetailFile]     = useState(null)
  const [detailUploading, setDetailUploading] = useState(false)
  const fileInputRef = useRef()
  const uploadRef    = useRef()

  const role    = getRole()
  const canEdit = ['ADMIN','DIRECTEUR','CHEF_EQUIPE'].includes(role)

  useEffect(() => { fetchPV() }, [])

  const fetchPV = async () => {
    try {
      setLoading(true)
      const res = await api.get('/pv')
      setPvList(res.data)
    } catch { setPvList([]) }
    finally { setLoading(false) }
  }

  const filtered = pvList.filter(pv => {
    const matchSearch = pv.title?.toLowerCase().includes(search.toLowerCase()) ||
                        pv.agenda?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'Tous' || pv.status === filterStatus
    return matchSearch && matchStatus
  })

  const openAdd  = () => { setForm(emptyForm); setFile(null); setEditItem(null); setShowModal(true) }
  const openEdit = (pv) => {
    setForm({ title:pv.title||'', date:pv.date||'', participants:pv.participants||0,
              agenda:pv.agenda||'', description:pv.description||'', status:pv.status||'BROUILLON' })
    setFile(null); setEditItem(pv.id); setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title?.trim() || !form.date) return
    try {
      setSaving(true)
      if (editItem) {
        await api.put(`/pv/${editItem}`, form)
        if (file) {
          const fd = new FormData(); fd.append('file', file)
          await api.post(`/pv/${editItem}/upload`, fd, { headers:{'Content-Type':'multipart/form-data'} })
        }
      } else {
        if (file) {
          const fd = new FormData()
          Object.keys(form).forEach(k => { if (form[k] !== '' && form[k] !== 0) fd.append(k, form[k]) })
          fd.append('file', file)
          await api.post('/pv/upload', fd, { headers:{'Content-Type':'multipart/form-data'} })
        } else {
          await api.post('/pv', form)
        }
      }
      fetchPV(); setShowModal(false); setFile(null)
    } catch { alert("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce PV ?')) {
      try { await api.delete(`/pv/${id}`); fetchPV() }
      catch { alert('Erreur suppression') }
    }
  }

  const handlePublish = async (id) => {
    try { await api.put(`/pv/${id}/publish`); fetchPV() }
    catch { alert('Erreur publication') }
  }

  const handleUploadDetail = async () => {
    if (!detailFile || !selected) return
    try {
      setDetailUploading(true)
      const fd = new FormData(); fd.append('file', detailFile)
      await api.post(`/pv/${selected.id}/upload`, fd, { headers:{'Content-Type':'multipart/form-data'} })
      setDetailFile(null)
      const res = await api.get('/pv')
      setPvList(res.data)
      const updated = res.data.find(p => p.id === selected.id)
      if (updated) setSelected(updated)
    } catch { alert("Erreur upload") }
    finally { setDetailUploading(false) }
  }

  const publie    = pvList.filter(p => p.status === 'PUBLIE').length
  const brouillon = pvList.filter(p => p.status === 'BROUILLON').length
  const avecFichier = pvList.filter(p => p.fileUrl).length

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
        .pv-row { transition:all 0.15s ease; }
        .pv-row:hover { background:#faf8ff !important; }
        .action-btn { transition:all 0.15s; border:none; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Procès-verbaux
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {pvList.length} réunion{pvList.length > 1 ? 's' : ''}
            </span>
            {pvList.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#059669', fontWeight:'600' }}>
                {publie} publié{publie > 1 ? 's' : ''}
              </span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#d97706', fontWeight:'600' }}>
                {brouillon} brouillon{brouillon > 1 ? 's' : ''}
              </span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#2563eb', fontWeight:'600' }}>
                {avecFichier} avec fichier
              </span>
            </>}
          </div>
        </div>
        {canEdit && (
          <button onClick={openAdd}
            style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 22px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(124,58,237,0.35)', display:'flex', alignItems:'center', gap:'6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle réunion
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
            placeholder="Rechercher par titre ou ordre du jour..."
            style={{ ...inputStyle, padding:'9px 12px 9px 34px', fontSize:'13px' }}
            onFocus={e => e.target.style.borderColor='#7c3aed'}
            onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ ...inputStyle, padding:'9px 12px', fontSize:'13px', cursor:'pointer' }}>
          <option value="Tous">Tous les statuts</option>
          <option value="PUBLIE">Publiés</option>
          <option value="BROUILLON">Brouillons</option>
        </select>
      </div>

      {/* ── Liste ── */}
      {pvList.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucun procès-verbal</p>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'24px' }}>Créez le premier PV de réunion du laboratoire</p>
          {canEdit && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
              Créer le premier PV
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', padding:'48px', textAlign:'center', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' }}>
          <p style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'12px' }}>Aucun résultat</p>
          <button onClick={() => { setSearch(''); setFilterStatus('Tous') }}
            style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.1s both' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px' }}>
              <thead>
                <tr style={{ background:'#f5f3ff', borderBottom:'2px solid rgba(124,58,237,0.1)' }}>
                  {['Réunion','Date','Participants','Ordre du jour','Statut','Fichier','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((pv, i) => (
                  <tr key={pv.id} className="pv-row"
                    style={{ borderBottom:'1px solid #f5f3ff', background:'white', animation:`fadeUp 0.3s ease-out ${i*0.03}s both` }}>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ fontSize:'13px', fontWeight:'700', color:'#2d1058', cursor:'pointer' }}
                        onClick={() => setSelected(pv)}>
                        {pv.title}
                      </div>
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b', whiteSpace:'nowrap' }}>
                      {formatDate(pv.date)}
                    </td>
                    <td style={{ padding:'14px 16px', textAlign:'center' }}>
                      <span style={{ fontSize:'12px', fontWeight:'700', color:'#7c3aed', background:'#f5f3ff', padding:'3px 10px', borderRadius:'20px' }}>
                        {pv.participants || 0}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b', maxWidth:'220px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {pv.agenda || <span style={{ color:'#c4b5fd', fontStyle:'italic' }}>Non renseigné</span>}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', color:pv.status==='PUBLIE'?'#059669':'#d97706', background:pv.status==='PUBLIE'?'#ecfdf5':'#fffbeb', border:`1px solid ${pv.status==='PUBLIE'?'#bbf7d0':'#fde68a'}` }}>
                        {pv.status === 'PUBLIE' ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      {pv.fileUrl ? (
                        <a href={`http://localhost:8081${pv.fileUrl}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:'11px', fontWeight:'700', color:'#7c3aed', textDecoration:'none', background:'#f5f3ff', padding:'3px 10px', borderRadius:'6px', border:'1px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', gap:'4px', width:'fit-content' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          PDF
                        </a>
                      ) : (
                        <span style={{ fontSize:'11px', color:'#c4b5fd', fontStyle:'italic' }}>Aucun</span>
                      )}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', gap:'4px', flexWrap:'nowrap' }}>
                        <button onClick={() => { setSelected(pv); setDetailFile(null) }} className="action-btn"
                          style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px' }}>
                          Voir
                        </button>
                        {canEdit && <>
                          <button onClick={() => openEdit(pv)} className="action-btn"
                            style={{ background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px' }}>
                            Modifier
                          </button>
                          {pv.status !== 'PUBLIE' && (
                            <button onClick={() => handlePublish(pv.id)} className="action-btn"
                              style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'5px 10px', fontSize:'11px' }}>
                              Publier
                            </button>
                          )}
                          <button onClick={() => handleDelete(pv.id)} className="action-btn"
                            style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'5px 8px', fontSize:'11px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
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

      {/* ── Modal Détail ── */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', width:'560px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', padding:'24px 28px 20px', borderBottom:'3px solid #7c3aed' }}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'10px', alignItems:'center' }}>
                <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', color:selected.status==='PUBLIE'?'#059669':'#d97706', background:selected.status==='PUBLIE'?'#ecfdf5':'#fffbeb', border:`1px solid ${selected.status==='PUBLIE'?'#bbf7d0':'#fde68a'}` }}>
                  {selected.status === 'PUBLIE' ? 'Publié' : 'Brouillon'}
                </span>
                {selected.fileUrl && (
                  <span style={{ fontSize:'11px', fontWeight:'600', color:'#7c3aed', background:'#f5f3ff', padding:'3px 10px', borderRadius:'20px', border:'1px solid rgba(124,58,237,0.2)' }}>
                    Fichier joint
                  </span>
                )}
              </div>
              <h2 style={{ fontSize:'18px', fontWeight:'800', color:'#2d1058', margin:0, lineHeight:'1.3' }}>{selected.title}</h2>
            </div>

            <div style={{ padding:'24px 28px' }}>
              <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1px solid rgba(124,58,237,0.08)' }}>
                {[
                  { label:'Date', val:formatDate(selected.date), icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label:'Participants', val:`${selected.participants||0} personne${(selected.participants||0)>1?'s':''}`, icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px 0', borderBottom:i<arr.length-1?'1px solid #f0eeff':'none' }}>
                    <div style={{ width:28, height:28, borderRadius:'8px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d={item.icon}/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>{item.label}</div>
                      <span style={{ fontSize:'13px', fontWeight:'600', color:'#2d1058' }}>{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selected.agenda && (
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Ordre du jour</div>
                  <div style={{ background:'#faf8ff', borderLeft:'4px solid #7c3aed', padding:'14px 16px', borderRadius:'0 10px 10px 0', fontSize:'13px', color:'#2d1058', lineHeight:'1.7' }}>
                    {selected.agenda}
                  </div>
                </div>
              )}

              {selected.description && (
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ fontSize:'11px', fontWeight:'700', color:'#6d28d9', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Contenu du PV</div>
                  <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', border:'1px solid rgba(124,58,237,0.1)', fontSize:'13px', color:'#2d1058', lineHeight:'1.7' }}>
                    {selected.description}
                  </div>
                </div>
              )}

              <div style={{ border:'1px solid rgba(124,58,237,0.15)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ background:'#f5f3ff', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#6d28d9' }}>Fichier PV</span>
                  </div>
                  {selected.fileUrl && (
                    <a href={`http://localhost:8081${selected.fileUrl}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:'12px', fontWeight:'700', color:'#7c3aed', textDecoration:'none', background:'white', padding:'4px 12px', borderRadius:'6px', border:'1px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', gap:'4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Télécharger
                    </a>
                  )}
                </div>
                {canEdit && (
                  <div style={{ padding:'14px 16px', background:'white' }}>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <label style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', border:'1.5px solid rgba(124,58,237,0.2)', borderRadius:'8px', background:'#faf8ff', cursor:'pointer', fontSize:'12px', color:detailFile?'#2d1058':'#94a3b8' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {detailFile ? detailFile.name : selected.fileUrl ? 'Remplacer le fichier...' : 'Uploader le fichier PV...'}
                        <input ref={uploadRef} type="file" accept=".pdf,.doc,.docx"
                          onChange={e => setDetailFile(e.target.files[0])} style={{ display:'none' }} />
                      </label>
                      <button onClick={handleUploadDetail} disabled={detailUploading || !detailFile}
                        style={{ background:detailUploading||!detailFile?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:detailUploading||!detailFile?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
                        {detailUploading ? '...' : 'Uploader'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:'8px' }}>
                {canEdit && selected.status !== 'PUBLIE' && (
                  <button onClick={() => { handlePublish(selected.id); setSelected(null) }}
                    style={{ flex:1, background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'11px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                    Publier
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => { setSelected(null); openEdit(selected) }}
                    style={{ flex:1, background:'#ede9fe', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'11px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                    Modifier
                  </button>
                )}
                <button onClick={() => { setSelected(null); setDetailFile(null) }}
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
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'560px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
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
                {editItem ? 'Modifier le PV' : 'Nouvelle réunion'}
              </h2>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Titre *</label>
              <input value={form.title} onChange={e => setForm({...form, title:e.target.value})}
                placeholder="Ex: Réunion Conseil de Laboratoire" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
              <div>
                <label style={labelStyle}>Nombre de participants</label>
                <input type="number" min="0" value={form.participants}
                  onChange={e => setForm({...form, participants:parseInt(e.target.value)||0})}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Ordre du jour</label>
              <textarea value={form.agenda} onChange={e => setForm({...form, agenda:e.target.value})}
                placeholder="Points à discuter lors de la réunion..." rows={4}
                style={{ ...inputStyle, resize:'vertical', lineHeight:'1.6' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>
                Contenu / Résumé
                <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>(optionnel)</span>
              </label>
              <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Résumé des décisions prises, points discutés..." rows={3}
                style={{ ...inputStyle, resize:'vertical', lineHeight:'1.6' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Statut</label>
              <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="BROUILLON">Brouillon</option>
                <option value="PUBLIE">Publié</option>
              </select>
            </div>

            <div style={{ marginBottom:'22px' }}>
              <label style={labelStyle}>
                Fichier PV
                <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>(PDF, DOC — optionnel)</span>
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', border:`1.5px dashed ${file?'#7c3aed':'rgba(124,58,237,0.25)'}`, borderRadius:'10px', background:file?'rgba(124,58,237,0.04)':'#faf8ff', cursor:'pointer', transition:'all 0.15s' }}>
                <div style={{ width:36, height:36, borderRadius:'8px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:file?'#2d1058':'#94a3b8' }}>
                    {file ? file.name : editItem ? 'Remplacer ou ajouter un fichier...' : 'Joindre le fichier PV...'}
                  </div>
                  {file && <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>{(file.size/1024/1024).toFixed(2)} MB</div>}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files[0])} style={{ display:'none' }} />
              </label>
              {file && (
                <button onClick={() => setFile(null)}
                  style={{ marginTop:'6px', background:'none', border:'none', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'600' }}>
                  Supprimer
                </button>
              )}
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer le PV'}
              </button>
              <button onClick={() => { setShowModal(false); setFile(null) }}
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