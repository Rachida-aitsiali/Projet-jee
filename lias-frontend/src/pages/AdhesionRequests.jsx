import { useState, useEffect } from 'react'
import API from '../services/api'

const statusColor = { EN_ATTENTE:'#d97706', ACCEPTEE:'#059669', REFUSEE:'#dc2626' }
const statusBg    = { EN_ATTENTE:'#fffbeb', ACCEPTEE:'#ecfdf5', REFUSEE:'#fef2f2' }
const statusLabel = { EN_ATTENTE:'En attente', ACCEPTEE:'Acceptée', REFUSEE:'Refusée' }

const memberTypeLabel = { PERMANENT:'Permanent', ASSOCIE:'Associé', DOCTORANT:'Doctorant' }
const memberTypeColor = { PERMANENT:'#059669', ASSOCIE:'#d97706', DOCTORANT:'#7c3aed' }
const memberTypeBg    = { PERMANENT:'#ecfdf5', ASSOCIE:'#fffbeb', DOCTORANT:'#f5f3ff' }
const memberTypeIcon  = {
  PERMANENT: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  ASSOCIE:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  DOCTORANT: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
}

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

export default function AdhesionRequests() {
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null)
  const [refusModal, setRefusModal]     = useState(null)
  const [refusReason, setRefusReason]   = useState('')
  const [actionMsg, setActionMsg]       = useState(null)
  const [filterStatus, setFilterStatus] = useState('Tous')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const r = await API.get('/adhesion-requests')
      setRequests(r.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAccept = async (id) => {
    try {
      await API.put(`/adhesion-requests/${id}/accept`)
      await fetchRequests()
      setSelected(null)
      setActionMsg({ type:'success', text:'Demande acceptée. Les identifiants ont été envoyés par email au candidat.' })
      setTimeout(() => setActionMsg(null), 5000)
    } catch {
      setActionMsg({ type:'error', text:"Erreur lors de l'acceptation." })
      setTimeout(() => setActionMsg(null), 4000)
    }
  }

  const openRefusModal = (id) => { setRefusReason(''); setRefusModal(id); setSelected(null) }

  const handleRefuse = async () => {
    try {
      await API.put(`/adhesion-requests/${refusModal}/refuse`, refusReason, { headers:{'Content-Type':'text/plain'} })
      await fetchRequests()
      setRefusModal(null); setRefusReason('')
      setActionMsg({ type:'success', text:'Demande refusée. Le candidat a été notifié par email.' })
      setTimeout(() => setActionMsg(null), 4000)
    } catch {
      setActionMsg({ type:'error', text:'Erreur lors du refus.' })
      setTimeout(() => setActionMsg(null), 4000)
    }
  }

  const filtered = requests.filter(r => filterStatus === 'Tous' || r.status === filterStatus)

  const enAttente = requests.filter(r => r.status === 'EN_ATTENTE').length
  const acceptees = requests.filter(r => r.status === 'ACCEPTEE').length
  const refusees  = requests.filter(r => r.status === 'REFUSEE').length

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
        .req-row { transition:all 0.15s ease; }
        .req-row:hover { background:#faf8ff !important; }
        .action-btn { transition:all 0.15s; border:none; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
        .filter-btn { transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1); cursor:pointer; border-radius:8px; font-weight:600; font-size:12px; }
        .filter-btn:hover { transform:translateY(-1px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:'24px', animation:'fadeUp 0.4s ease-out' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
          Demandes d'adhésion
        </h1>
        <p style={{ fontSize:'13px', color:'#94a3b8', margin:0 }}>
          {requests.length} demande{requests.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Message action */}
      {actionMsg && (
        <div style={{
          background: actionMsg.type==='success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${actionMsg.type==='success' ? '#a7f3d0' : '#fecaca'}`,
          borderLeft: `4px solid ${actionMsg.type==='success' ? '#059669' : '#dc2626'}`,
          borderRadius:'10px', padding:'12px 16px', marginBottom:'16px',
          fontSize:'13px', color: actionMsg.type==='success' ? '#065f46' : '#dc2626',
          display:'flex', alignItems:'center', gap:'8px', fontWeight:'500',
          animation:'popIn 0.3s ease-out',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {actionMsg.type==='success'
              ? <polyline points="20 6 9 17 4 12"/>
              : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
          </svg>
          {actionMsg.text}
        </div>
      )}

      {/* ── Barre filtre ── */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.1)', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.05s both' }}>
        <span style={{ fontSize:'13px', color:'#94a3b8' }}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
        <div style={{ display:'flex', gap:'6px' }}>
          {[
            { key:'Tous',       label:'Tous',       color:'#7c3aed', count: requests.length },
            { key:'EN_ATTENTE', label:'En attente', color:'#d97706', count: enAttente },
            { key:'ACCEPTEE',   label:'Acceptées',  color:'#059669', count: acceptees },
            { key:'REFUSEE',    label:'Refusées',   color:'#dc2626', count: refusees },
          ].map(f => (
            <button key={f.key} className="filter-btn"
              onClick={() => setFilterStatus(f.key)}
              style={{
                padding:'6px 14px',
                background: filterStatus === f.key ? f.color : '#f5f3ff',
                color: filterStatus === f.key ? 'white' : f.color,
                border: `1px solid ${filterStatus === f.key ? f.color : `${f.color}40`}`,
                display:'flex', alignItems:'center', gap:6,
                boxShadow: filterStatus === f.key ? `0 4px 12px ${f.color}35` : 'none',
              }}>
              {f.label}
              <span style={{
                fontSize:'10px', fontWeight:'800',
                background: filterStatus === f.key ? 'rgba(255,255,255,0.25)' : `${f.color}15`,
                padding:'1px 6px', borderRadius:'20px',
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(124,58,237,0.08)', padding:'80px 40px', textAlign:'center', animation:'popIn 0.4s ease-out', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucune demande</p>
          <p style={{ fontSize:'13px', color:'#94a3b8' }}>Aucune demande d'adhésion pour le moment</p>
          {filterStatus !== 'Tous' && (
            <button onClick={() => setFilterStatus('Tous')}
              style={{ marginTop:'16px', background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'8px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
              Voir toutes les demandes
            </button>
          )}
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.06)', animation:'fadeUp 0.4s ease-out 0.1s both' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f5f3ff', borderBottom:'2px solid rgba(124,58,237,0.1)' }}>
                {['Candidat','Email','Type','Établissement','Date','Statut','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="req-row"
                  style={{ borderBottom:'1px solid #f5f3ff', background:'white', animation:`fadeUp 0.3s ease-out ${i * 0.03}s both` }}>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:36, height:36, flexShrink:0, background:`linear-gradient(135deg,${memberTypeColor[r.memberType]||'#7c3aed'},#4c1d95)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'14px', fontWeight:'700', boxShadow:`0 2px 8px ${memberTypeColor[r.memberType]||'#7c3aed'}40` }}>
                        {r.firstName?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:'600', color:'#2d1058', whiteSpace:'nowrap' }}>{r.firstName} {r.lastName}</span>
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:'12px', color:'#7c3aed' }}>{r.email}</td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', color:memberTypeColor[r.memberType]||'#059669', background:memberTypeBg[r.memberType]||'#ecfdf5', display:'flex', alignItems:'center', gap:'4px', width:'fit-content', border:`1px solid ${memberTypeColor[r.memberType]||'#059669'}25` }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d={memberTypeIcon[r.memberType]||memberTypeIcon.PERMANENT}/>
                      </svg>
                      {memberTypeLabel[r.memberType]||'Permanent'}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b' }}>{r.institution||'—'}</td>
                  <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b', whiteSpace:'nowrap' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:statusColor[r.status], background:statusBg[r.status], padding:'3px 10px', borderRadius:'20px', whiteSpace:'nowrap', border:`1px solid ${statusColor[r.status]}25` }}>
                      {statusLabel[r.status]}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <button onClick={() => setSelected(r)} className="action-btn"
                        style={{ background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px' }}>
                        Voir
                      </button>
                      {r.status === 'EN_ATTENTE' && <>
                        <button onClick={() => handleAccept(r.id)} className="action-btn"
                          style={{ background:'#ecfdf5', color:'#059669', border:'1px solid #a7f3d0', padding:'5px 10px', fontSize:'11px' }}>
                          Accepter
                        </button>
                        <button onClick={() => openRefusModal(r.id)} className="action-btn"
                          style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'5px 10px', fontSize:'11px' }}>
                          Refuser
                        </button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal détail ── */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'540px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', paddingBottom:'14px', borderBottom:'2px solid #f0eeff' }}>
              <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', margin:0 }}>Détails de la demande</h2>
              <span style={{ fontSize:'11px', fontWeight:'700', color:statusColor[selected.status], background:statusBg[selected.status], padding:'4px 12px', borderRadius:'20px', border:`1px solid ${statusColor[selected.status]}25` }}>
                {statusLabel[selected.status]}
              </span>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px', padding:'14px', background:'#faf8ff', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.08)' }}>
              <div style={{ width:52, height:52, flexShrink:0, background:`linear-gradient(135deg,${memberTypeColor[selected.memberType]||'#7c3aed'},#4c1d95)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'20px', fontWeight:'700', boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>
                {selected.firstName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:'#2d1058' }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize:'13px', color:'#7c3aed', marginTop:'2px' }}>{selected.email}</div>
              </div>
            </div>

            <div style={{ marginBottom:'14px', padding:'12px 16px', background:memberTypeBg[selected.memberType]||'#f5f3ff', borderRadius:'10px', border:`1px solid ${memberTypeColor[selected.memberType]||'#7c3aed'}33` }}>
              <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Type de candidature</div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={memberTypeColor[selected.memberType]||'#7c3aed'} strokeWidth="2">
                  <path d={memberTypeIcon[selected.memberType]||memberTypeIcon.PERMANENT}/>
                </svg>
                <span style={{ fontSize:'14px', fontWeight:'700', color:memberTypeColor[selected.memberType]||'#7c3aed' }}>
                  {memberTypeLabel[selected.memberType]||'Permanent'}
                </span>
              </div>
              <p style={{ fontSize:'12px', color:'#64748b', margin:0 }}>
                {selected.memberType==='DOCTORANT' ? 'Accès limité : publications uniquement'
                  : selected.memberType==='ASSOCIE' ? 'Accès limité : consultation et publications'
                  : 'Accès complet au laboratoire'}
              </p>
            </div>

            <div style={{ background:'#faf8ff', borderRadius:'12px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(124,58,237,0.08)' }}>
              {[
                { label:'Téléphone',          val: selected.phone       || 'Non renseigné' },
                { label:'Établissement',      val: selected.institution || 'Non renseigné' },
                { label:'Date de soumission', val: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'}) : '—' },
              ].map((f, i, arr) => (
                <div key={f.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom: i < arr.length-1 ? '1px solid #f0eeff' : 'none', gap:'12px' }}>
                  <span style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'500', flexShrink:0 }}>{f.label}</span>
                  <span style={{ fontSize:'12px', fontWeight:f.val==='Non renseigné'?'400':'600', color:f.val==='Non renseigné'?'#c4b5fd':'#2d1058', fontStyle:f.val==='Non renseigné'?'italic':'normal', textAlign:'right' }}>
                    {f.val}
                  </span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', gap:'12px' }}>
                <span style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'500', flexShrink:0 }}>CV joint</span>
                {selected.cvUrl ? (
                  <a href={`http://localhost:8081${selected.cvUrl}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:'12px', fontWeight:'700', color:'#7c3aed', textDecoration:'none', display:'flex', alignItems:'center', gap:'6px', background:'#f5f3ff', padding:'5px 12px', borderRadius:'6px', border:'1px solid rgba(124,58,237,0.2)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Télécharger le CV
                  </a>
                ) : (
                  <span style={{ fontSize:'12px', color:'#c4b5fd', fontStyle:'italic', fontWeight:'400' }}>Non joint</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Lettre de motivation</label>
              <div style={{ fontSize:'13px', color:'#2d1058', lineHeight:'1.7', background:'#faf8ff', padding:'14px', borderRadius:'10px', border:'1px solid rgba(124,58,237,0.1)', minHeight:'60px' }}>
                {selected.motivation || <span style={{ color:'#c4b5fd', fontStyle:'italic' }}>Non renseignée</span>}
              </div>
            </div>

            {selected.status === 'REFUSEE' && selected.refusalReason && (
              <div style={{ marginBottom:'14px', background:'#fef2f2', borderRadius:'10px', padding:'14px', border:'1px solid #fecaca', borderLeft:'4px solid #dc2626' }}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Motif du refus</div>
                <p style={{ fontSize:'13px', color:'#991b1b', margin:0, lineHeight:'1.6' }}>{selected.refusalReason}</p>
              </div>
            )}

            <div style={{ display:'flex', gap:'10px' }}>
              {selected.status === 'EN_ATTENTE' && <>
                <button onClick={() => handleAccept(selected.id)}
                  style={{ flex:1, background:'linear-gradient(135deg,#059669,#047857)', color:'white', border:'none', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 12px rgba(5,150,105,0.3)' }}>
                  Accepter
                </button>
                <button onClick={() => openRefusModal(selected.id)}
                  style={{ flex:1, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                  Refuser
                </button>
              </>}
              <button onClick={() => setSelected(null)}
                style={{ flex:1, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal refus ── */}
      {refusModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:'20px', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'460px', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
              <div style={{ width:36, height:36, borderRadius:'10px', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#2d1058', margin:0 }}>Refuser la demande</h2>
            </div>
            <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid #f0eeff' }}>
              Un email sera envoyé automatiquement au candidat.
            </p>
            <label style={labelStyle}>
              Motif du refus
              <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>(optionnel)</span>
            </label>
            <textarea value={refusReason} onChange={e => setRefusReason(e.target.value)}
              placeholder="Expliquez la raison du refus..." rows={4}
              style={{ ...inputStyle, resize:'vertical', lineHeight:'1.6' }}
              onFocus={e => e.target.style.borderColor='#7c3aed'}
              onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'} />
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button onClick={handleRefuse}
                style={{ flex:1, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 12px rgba(220,38,38,0.3)' }}>
                Confirmer le refus
              </button>
              <button onClick={() => { setRefusModal(null); setRefusReason('') }}
                style={{ flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}