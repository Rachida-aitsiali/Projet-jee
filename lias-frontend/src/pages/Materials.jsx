import { useState, useEffect } from 'react'
import materialService from '../services/materialService'
import memberService from '../services/memberService'
import { getRole } from '../services/authService'

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
const emptyForm    = { name:'', description:'', quantity:1, arrivalDate:'' }
const emptyRequest = { requestedBy:'', materialName:'', quantity:1, reason:'' }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}

export default function Materials() {
  const [materials, setMaterials]             = useState([])
  const [members, setMembers]                 = useState([])
  const [requests, setRequests]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [activeTab, setActiveTab]             = useState('equipements')
  const [showAddModal, setShowAddModal]       = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showListModal, setShowListModal]     = useState(false)
  const [showReqModal, setShowReqModal]       = useState(false)
  const [showReqDetail, setShowReqDetail]     = useState(null)
  const [editItem, setEditItem]               = useState(null)
  const [selectedMat, setSelectedMat]         = useState(null)
  const [assignments, setAssignments]         = useState([])
  const [form, setForm]                       = useState(emptyForm)
  const [assignForm, setAssignForm]           = useState({ memberId:'', quantity:1, assignedAt:new Date().toISOString().split('T')[0], notes:'' })
  const [reqForm, setReqForm]                 = useState(emptyRequest)
  const [saving, setSaving]                   = useState(false)
  const [search, setSearch]                   = useState('')

  const role    = getRole()
  const canEdit = ['ADMIN','DIRECTEUR'].includes(role)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [matRes, reqRes, mbRes] = await Promise.all([
        materialService.getMaterials().catch(() => ({ data:[] })),
        materialService.getRequests().catch(() => ({ data:[] })),
        memberService.getMembers().catch(() => ({ data:[] })),
      ])
      setMaterials(matRes.data)
      setRequests(reqRes.data)
      setMembers(mbRes.data.filter(m => m.status !== 'ANCIEN' && m.status !== 'RETRAITE'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const getAssigned = (m) => (m.assignments || []).reduce((s, a) => s + (a.quantity || 0), 0)

  const totalQty      = materials.reduce((s, m) => s + (m.quantity || 0), 0)
  const totalAssigned = materials.reduce((s, m) => s + getAssigned(m), 0)
  const pendingCount  = requests.filter(r => r.status === 'EN_ATTENTE').length

  const filtered = materials.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(emptyForm); setEditItem(null); setShowAddModal(true) }
  const openEdit = (m) => {
    setForm({ name:m.name||'', description:m.description||'', quantity:m.quantity||1, arrivalDate:m.arrivalDate||'' })
    setEditItem(m.id); setShowAddModal(true)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) return
    try {
      setSaving(true)
      if (editItem) await materialService.updateMaterial(editItem, form)
      else          await materialService.createMaterial(form)
      fetchData(); setShowAddModal(false)
    } catch { alert("Erreur enregistrement") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet équipement ?')) return
    try { await materialService.deleteMaterial(id); fetchData() }
    catch { alert('Erreur suppression') }
  }

  const openAssign = (m) => {
    setSelectedMat(m)
    setAssignForm({ memberId:'', quantity:1, assignedAt:new Date().toISOString().split('T')[0], notes:'' })
    setShowAssignModal(true)
  }

  const openList = async (m) => {
    setSelectedMat(m)
    try { const res = await materialService.getAssignments(m.id); setAssignments(res.data) }
    catch { setAssignments([]) }
    setShowListModal(true)
  }

  const handleAssign = async () => {
    if (!assignForm.memberId) return alert('Sélectionnez un membre')
    try {
      setSaving(true)
      await materialService.assignMaterial(selectedMat.id, assignForm)
      fetchData(); setShowAssignModal(false)
    } catch (e) { alert(e.response?.data || "Erreur assignation") }
    finally { setSaving(false) }
  }

  const handleRemoveAssignment = async (assignId) => {
    if (!window.confirm('Retirer cette attribution ?')) return
    try {
      await materialService.removeAssignment(assignId)
      const res = await materialService.getAssignments(selectedMat.id)
      setAssignments(res.data); fetchData()
    } catch { alert('Erreur') }
  }

  const handleRequest = async () => {
    if (!reqForm.requestedBy?.trim() || !reqForm.reason?.trim()) return
    try {
      setSaving(true)
      await materialService.createRequest(reqForm)
      setReqForm(emptyRequest); fetchData(); setShowReqModal(false)
    } catch { alert("Erreur demande") }
    finally { setSaving(false) }
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
        .mat-card { transition:all 0.2s ease; }
        .mat-card:hover { box-shadow:0 8px 28px rgba(124,58,237,0.14) !important; transform:translateY(-3px); border-color:rgba(124,58,237,0.18) !important; }
        .action-btn { transition:all 0.15s; border:none; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
        .req-row:hover { background:#faf8ff !important; }
        .req-row { transition:background 0.15s; }
        .assign-row:hover { background:#faf8ff !important; }
        .assign-row { transition:background 0.15s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Gestion du matériel
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {materials.length} équipement{materials.length > 1 ? 's' : ''}
            </span>
            {materials.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#2563eb', fontWeight:'600' }}>{totalQty} unités</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#059669', fontWeight:'600' }}>{totalQty - totalAssigned} disponibles</span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#7c3aed', fontWeight:'600' }}>{totalAssigned} assignées</span>
              {pendingCount > 0 && <>
                <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
                <span style={{ fontSize:'13px', color:'#d97706', fontWeight:'600' }}>{pendingCount} demande{pendingCount>1?'s':''} en attente</span>
              </>}
            </>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={() => setShowReqModal(true)}
            style={{ background:'white', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.3)', padding:'10px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Soumettre une demande
          </button>
          {canEdit && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'10px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 15px rgba(124,58,237,0.3)', display:'flex', alignItems:'center', gap:'6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter un équipement
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', background:'white', padding:'6px', borderRadius:'10px', border:'1px solid rgba(124,58,237,0.08)', width:'fit-content' }}>
        {[
          { key:'equipements', label:'Équipements' },
          { key:'demandes',    label:'Demandes', badge:pendingCount },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding:'8px 18px', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', transition:'all 0.15s',
              background: activeTab===tab.key ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent',
              color:      activeTab===tab.key ? 'white' : '#64748b' }}>
            {tab.label}
            {tab.badge > 0 && (
              <span style={{ background:activeTab===tab.key?'rgba(255,255,255,0.25)':'#fef2f2', color:activeTab===tab.key?'white':'#dc2626', fontSize:'10px', fontWeight:'700', padding:'1px 6px', borderRadius:'20px' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Équipements ── */}
      {activeTab === 'equipements' && (
        <>
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.1)', padding:'12px 16px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' }}>
            <div style={{ position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
                style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un équipement..."
                style={{ ...inputStyle, padding:'9px 12px 9px 34px', fontSize:'13px' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
          </div>

          {materials.length === 0 ? (
            <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
              <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucun équipement</p>
              <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'24px' }}>Ajoutez le premier équipement du laboratoire</p>
              {canEdit && (
                <button onClick={openAdd}
                  style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                  Ajouter le premier équipement
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
              {filtered.map((m, i) => {
                const assigned  = getAssigned(m)
                const available = (m.quantity || 0) - assigned
                const pct       = m.quantity > 0 ? Math.round((assigned / m.quantity) * 100) : 0
                const barColor  = pct === 0 ? '#059669' : pct < 60 ? '#059669' : pct < 85 ? '#d97706' : '#dc2626'
                return (
                  <div key={m.id} className="mat-card"
                    style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.05)', animation:`fadeUp ${0.3+i*0.05}s ease-out` }}>
                    <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', padding:'18px 18px 14px', borderBottom:'1px solid rgba(124,58,237,0.08)', position:'relative' }}>
                      {canEdit && (
                        <div style={{ position:'absolute', top:'12px', right:'12px', display:'flex', gap:'4px' }}>
                          <button onClick={() => openEdit(m)} className="action-btn"
                            style={{ background:'rgba(255,255,255,0.8)', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'4px 8px', fontSize:'11px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="action-btn"
                            style={{ background:'rgba(255,255,255,0.8)', color:'#dc2626', border:'1px solid #fecaca', padding:'4px 8px', fontSize:'11px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      )}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                        <div style={{ width:42, height:42, borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 10px rgba(124,58,237,0.25)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                        <div style={{ flex:1, paddingRight:canEdit?'60px':'0' }}>
                          <h3 style={{ fontSize:'14px', fontWeight:'800', color:'#2d1058', margin:'0 0 4px', lineHeight:'1.3' }}>{m.name}</h3>
                          {m.description && <p style={{ fontSize:'11px', color:'#94a3b8', margin:0, lineHeight:'1.4' }}>{m.description}</p>}
                        </div>
                      </div>
                      {m.arrivalDate && (
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'10px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span style={{ fontSize:'11px', color:'#94a3b8' }}>Arrivé le {formatDate(m.arrivalDate)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:'14px 18px' }}>
                      <div style={{ marginBottom:'14px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                          <span style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'500' }}>Disponible</span>
                          <span style={{ fontSize:'12px', fontWeight:'800', color:barColor }}>{available} / {m.quantity}</span>
                        </div>
                        <div style={{ height:'7px', background:'#f0eeff', borderRadius:'99px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${barColor},${barColor}cc)`, borderRadius:'99px', transition:'width 0.5s ease' }}/>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                          <span style={{ fontSize:'10px', color:'#c4b5fd' }}>{assigned} attribué{assigned>1?'s':''}</span>
                          <span style={{ fontSize:'10px', color:barColor, fontWeight:'600' }}>
                            {available===0?'Épuisé':available===m.quantity?'Disponible':'Partiel'}
                          </span>
                        </div>
                      </div>
                      {m.assignments && m.assignments.length > 0 && (
                        <div style={{ marginBottom:'12px', padding:'8px 10px', background:'#faf8ff', borderRadius:'8px', border:'1px solid rgba(124,58,237,0.08)' }}>
                          <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Dernières attributions</div>
                          {m.assignments.slice(-2).reverse().map((a, idx) => (
                            <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:idx<1?'4px':0 }}>
                              <span style={{ fontSize:'11px', color:'#2d1058', fontWeight:'600' }}>{a.member?`${a.member.firstName} ${a.member.lastName}`:'Inconnu'}</span>
                              <span style={{ fontSize:'10px', color:'#94a3b8' }}>x{a.quantity} · {formatDate(a.assignedAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:'8px' }}>
                        {canEdit && available > 0 && (
                          <button onClick={() => openAssign(m)} className="action-btn"
                            style={{ flex:1, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'8px', fontSize:'12px', boxShadow:'0 3px 10px rgba(124,58,237,0.25)' }}>
                            Attribuer
                          </button>
                        )}
                        <button onClick={() => openList(m)} className="action-btn"
                          style={{ flex:1, background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px', fontSize:'12px' }}>
                          Attributions ({m.assignments?.length || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab Demandes ── */}
      {activeTab === 'demandes' && (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.06)' }}>
          {requests.length === 0 ? (
            <div style={{ padding:'60px', textAlign:'center' }}>
              <p style={{ fontSize:'15px', fontWeight:'600', color:'#2d1058', marginBottom:'6px' }}>Aucune demande</p>
              <p style={{ fontSize:'13px', color:'#94a3b8' }}>Les demandes de matériel apparaîtront ici</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px' }}>
                <thead>
                  <tr style={{ background:'#f5f3ff', borderBottom:'2px solid rgba(124,58,237,0.1)' }}>
                    {['Demandeur','Équipement','Qté','Motif','Date','Statut','Actions'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="req-row" style={{ borderBottom:'1px solid #f5f3ff', background:'white' }}>
                      <td style={{ padding:'14px 16px', fontSize:'13px', fontWeight:'600', color:'#2d1058' }}>{r.requestedBy||'—'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', color:'#64748b' }}>{r.materialName||'—'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', fontWeight:'700', color:'#2d1058', textAlign:'center' }}>{r.quantity}</td>
                      <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b', maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reason||'—'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'12px', color:'#94a3b8', whiteSpace:'nowrap' }}>{formatDate(r.createdAt)}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', color:r.status==='VALIDE'?'#059669':r.status==='REJETE'?'#dc2626':'#d97706', background:r.status==='VALIDE'?'#ecfdf5':r.status==='REJETE'?'#fef2f2':'#fffbeb' }}>
                          {r.status==='VALIDE'?'Validée':r.status==='REJETE'?'Rejetée':'En attente'}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', gap:'4px' }}>
                          <button onClick={() => setShowReqDetail(r)} className="action-btn"
                            style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px' }}>
                            Voir
                          </button>
                          {canEdit && r.status==='EN_ATTENTE' && (
                            <>
                              <button onClick={() => materialService.validateRequest(r.id).then(fetchData)} className="action-btn"
                                style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'5px 10px', fontSize:'11px' }}>
                                Valider
                              </button>
                              <button onClick={() => materialService.rejectRequest(r.id).then(fetchData)} className="action-btn"
                                style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'5px 10px', fontSize:'11px' }}>
                                Rejeter
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Ajouter/Modifier ── */}
      {showAddModal && canEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'500px', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'22px', paddingBottom:'16px', borderBottom:'1px solid #f0eeff' }}>
              <div style={{ width:36, height:36, borderRadius:'10px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {editItem ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
                </svg>
              </div>
              <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#2d1058', margin:0 }}>
                {editItem ? "Modifier l'équipement" : 'Ajouter un équipement'}
              </h2>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Nom *</label>
              <input value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                placeholder="Ex: Ordinateur portable Dell XPS" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Modèle, caractéristiques..."
                style={{ ...inputStyle, height:'70px', resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'22px' }}>
              <div>
                <label style={labelStyle}>Quantité totale</label>
                <input type="number" min="1" value={form.quantity}
                  onChange={e => setForm({...form, quantity:parseInt(e.target.value)||1})}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
              <div>
                <label style={labelStyle}>Date d'arrivage</label>
                <input type="date" value={form.arrivalDate}
                  onChange={e => setForm({...form, arrivalDate:e.target.value})}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#7c3aed'}
                  onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button onClick={() => setShowAddModal(false)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Attribuer ── */}
      {showAssignModal && selectedMat && canEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'460px', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', marginBottom:'6px' }}>Attribuer l'équipement</h2>
            <div style={{ background:'#f5f3ff', borderRadius:'8px', padding:'10px 14px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#6d28d9' }}>{selectedMat.name}</span>
              <span style={{ fontSize:'11px', color:'#94a3b8', marginLeft:'auto' }}>{(selectedMat.quantity||0)-getAssigned(selectedMat)} disponible(s)</span>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Membre *</label>
              <select value={assignForm.memberId} onChange={e => setAssignForm({...assignForm, memberId:e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}>
                <option value="">-- Sélectionner un membre --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.status})</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={labelStyle}>Quantité</label>
                <input type="number" min="1" max={(selectedMat.quantity||0)-getAssigned(selectedMat)}
                  value={assignForm.quantity} onChange={e => setAssignForm({...assignForm, quantity:parseInt(e.target.value)||1})}
                  style={inputStyle} onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
              <div>
                <label style={labelStyle}>Date d'attribution</label>
                <input type="date" value={assignForm.assignedAt} onChange={e => setAssignForm({...assignForm, assignedAt:e.target.value})}
                  style={inputStyle} onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
              </div>
            </div>
            <div style={{ marginBottom:'22px' }}>
              <label style={labelStyle}>Notes <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none' }}>(optionnel)</span></label>
              <input value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes:e.target.value})}
                placeholder="Usage prévu, localisation..." style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleAssign} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? '...' : 'Attribuer'}
              </button>
              <button onClick={() => setShowAssignModal(false)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Liste attributions ── */}
      {showListModal && selectedMat && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', width:'480px', maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ padding:'20px 24px', borderBottom:'2px solid #f0eeff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h2 style={{ fontSize:'16px', fontWeight:'800', color:'#2d1058', margin:0 }}>Attributions</h2>
                <p style={{ fontSize:'12px', color:'#7c3aed', margin:'2px 0 0', fontWeight:'600' }}>{selectedMat.name}</p>
              </div>
              <span style={{ fontSize:'11px', fontWeight:'700', color:'#7c3aed', background:'#f5f3ff', padding:'4px 12px', borderRadius:'20px' }}>
                {assignments.length} attribution{assignments.length>1?'s':''}
              </span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
              {assignments.length === 0 ? (
                <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8' }}>
                  <p style={{ fontSize:'14px' }}>Aucune attribution pour cet équipement</p>
                </div>
              ) : assignments.map((a) => (
                <div key={a.id} className="assign-row"
                  style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 10px', borderRadius:'10px', marginBottom:'6px', background:'white', border:'1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'13px', fontWeight:'700', flexShrink:0, overflow:'hidden' }}>
                    {a.member?.photo
                      ? <img src={`http://localhost:8081${a.member.photo}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : a.member?.firstName?.charAt(0)||'?'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#2d1058' }}>
                      {a.member?`${a.member.firstName} ${a.member.lastName}`:'Inconnu'}
                    </div>
                    <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px', display:'flex', gap:'8px' }}>
                      <span>Qté : <b style={{ color:'#7c3aed' }}>{a.quantity}</b></span>
                      <span>·</span>
                      <span>{formatDate(a.assignedAt)}</span>
                      {a.notes && <><span>·</span><span style={{ fontStyle:'italic' }}>{a.notes}</span></>}
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => handleRemoveAssignment(a.id)} className="action-btn"
                      style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'4px 8px', fontSize:'11px', flexShrink:0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 24px', borderTop:'1px solid #f0eeff', display:'flex', gap:'8px' }}>
              {canEdit && (selectedMat.quantity-getAssigned(selectedMat))>0 && (
                <button onClick={() => { setShowListModal(false); openAssign(selectedMat) }}
                  style={{ flex:1, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                  + Nouvelle attribution
                </button>
              )}
              <button onClick={() => setShowListModal(false)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Demande ── */}
      {showReqModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'480px', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', marginBottom:'6px' }}>Soumettre une demande</h2>
            <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid #f0eeff' }}>
              La demande sera examinée par la direction.
            </p>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Votre nom *</label>
              <input value={reqForm.requestedBy} onChange={e => setReqForm({...reqForm, requestedBy:e.target.value})}
                placeholder="Dr. Alami Mohamed" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Équipement demandé *</label>
              <input value={reqForm.materialName} onChange={e => setReqForm({...reqForm, materialName:e.target.value})}
                placeholder="Ex: Ordinateur portable, Imprimante..." style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Quantité</label>
              <input type="number" min="1" value={reqForm.quantity}
                onChange={e => setReqForm({...reqForm, quantity:parseInt(e.target.value)||1})}
                style={inputStyle} onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ marginBottom:'22px' }}>
              <label style={labelStyle}>Motif *</label>
              <textarea value={reqForm.reason} onChange={e => setReqForm({...reqForm, reason:e.target.value})}
                placeholder="Expliquez pourquoi vous avez besoin de cet équipement..." rows={3}
                style={{ ...inputStyle, resize:'vertical', lineHeight:'1.6' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'} onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleRequest} disabled={saving}
                style={{ flex:2, background:saving?'#c4b5fd':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:saving?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {saving ? 'Envoi...' : 'Soumettre'}
              </button>
              <button onClick={() => setShowReqModal(false)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Détail demande ── */}
      {showReqDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'480px', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid #f0eeff' }}>
              <div>
                <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', margin:'0 0 4px' }}>Détail de la demande</h2>
                <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px',
                  color: showReqDetail.status==='VALIDE'?'#059669':showReqDetail.status==='REJETE'?'#dc2626':'#d97706',
                  background: showReqDetail.status==='VALIDE'?'#ecfdf5':showReqDetail.status==='REJETE'?'#fef2f2':'#fffbeb' }}>
                  {showReqDetail.status==='VALIDE'?'Validée':showReqDetail.status==='REJETE'?'Rejetée':'En attente'}
                </span>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <div style={labelStyle}>Demandeur</div>
                <p style={{ fontSize:'14px', color:'#2d1058', fontWeight:'600', margin:0 }}>{showReqDetail.requestedBy || '—'}</p>
              </div>
              <div>
                <div style={labelStyle}>Équipement demandé</div>
                <p style={{ fontSize:'14px', color:'#2d1058', fontWeight:'600', margin:0 }}>{showReqDetail.materialName || '—'}</p>
              </div>
              <div>
                <div style={labelStyle}>Quantité</div>
                <p style={{ fontSize:'14px', color:'#2d1058', fontWeight:'600', margin:0 }}>{showReqDetail.quantity}</p>
              </div>
              <div>
                <div style={labelStyle}>Motif</div>
                <p style={{ fontSize:'13px', color:'#64748b', margin:0, lineHeight:'1.6', background:'#faf8ff', padding:'12px', borderRadius:'8px', border:'1px solid rgba(124,58,237,0.08)' }}>
                  {showReqDetail.reason || '—'}
                </p>
              </div>
              <div>
                <div style={labelStyle}>Date de la demande</div>
                <p style={{ fontSize:'13px', color:'#94a3b8', margin:0 }}>{formatDate(showReqDetail.createdAt)}</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
              {canEdit && showReqDetail.status==='EN_ATTENTE' && (
                <>
                  <button onClick={() => { materialService.validateRequest(showReqDetail.id).then(fetchData); setShowReqDetail(null) }}
                    style={{ flex:1, background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                    Valider
                  </button>
                  <button onClick={() => { materialService.rejectRequest(showReqDetail.id).then(fetchData); setShowReqDetail(null) }}
                    style={{ flex:1, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px' }}>
                    Rejeter
                  </button>
                </>
              )}
              <button onClick={() => setShowReqDetail(null)}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}