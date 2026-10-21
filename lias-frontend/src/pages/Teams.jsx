import { useState, useEffect } from 'react'
import api from '../services/api'
import { getRole } from '../services/authService'

export default function Teams() {
  const [teams, setTeams]           = useState([])
  const [members, setMembers]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [editItem, setEditItem]     = useState(null)
  const [form, setForm]             = useState({ name:'', description:'', chiefId:'', active:true, memberIds:[] })

  const role    = getRole()
  const canEdit = ['ADMIN','DIRECTEUR'].includes(role)

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const r = await api.get('/teams')
      setTeams(r.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchMembers = async () => {
    try {
      const r = await api.get('/members')
      setMembers(r.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchTeams(); fetchMembers() }, [])

  const openAdd = () => {
    setForm({ name:'', description:'', chiefId:'', active:true, memberIds:[] })
    setEditItem(null)
    setShowModal(true)
  }

  const openEdit = (t) => {
    setForm({
      name: t.name,
      description: t.description || '',
      chiefId: t.chief?.id || '',
      active: t.active,
      memberIds: t.members?.map(m => m.id) || []
    })
    setEditItem(t.id)
    setShowModal(true)
  }

  const toggleMember = (memberId) => {
    const ids = form.memberIds || []
    setForm({
      ...form,
      memberIds: ids.includes(memberId)
        ? ids.filter(id => id !== memberId)
        : [...ids, memberId]
    })
  }

  const handleSave = async () => {
    if (!form.name) return alert('Le nom est obligatoire')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        chief: form.chiefId ? { id: Number(form.chiefId) } : null
      }
      let savedId = editItem
      if (editItem) {
        await api.put(`/teams/${editItem}`, payload)
      } else {
        const r = await api.post('/teams', payload)
        savedId = r.data.id
      }
      if (savedId) {
        const team = teams.find(t => t.id === editItem)
        const oldIds = team?.members?.map(m => m.id) || []
        const newIds = form.memberIds || []
        await Promise.all(oldIds.filter(id => !newIds.includes(id)).map(mid =>
          api.delete(`/teams/${savedId}/members/${mid}`).catch(() => {})
        ))
        await Promise.all(newIds.filter(id => !oldIds.includes(id)).map(mid =>
          api.put(`/teams/${savedId}/members/${mid}`).catch(() => {})
        ))
      }
      fetchTeams()
      setShowModal(false)
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette équipe ?')) {
      try { await api.delete(`/teams/${id}`); fetchTeams() }
      catch { alert('Erreur suppression') }
    }
  }

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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(124,58,237,0.2)', borderTop:'3px solid #7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ color:'#94a3b8', fontSize:13 }}>Chargement...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const totalMembers = teams.reduce((s, t) => s + (t.members?.length || 0), 0)
  const activeCount  = teams.filter(t => t.active).length

  return (
    <div style={{ padding:'28px', fontFamily:'"Inter","Segoe UI",sans-serif', background:'#f8f7ff', minHeight:'100vh', boxSizing:'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn    { 0%{opacity:0;transform:scale(0.94)} 60%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .team-card {
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          cursor: default;
        }
        .team-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 16px 40px rgba(124,58,237,0.14) !important;
          border-color: rgba(124,58,237,0.2) !important;
        }
        .member-item:hover { background:#ede9fe !important; }
        .action-btn { transition: all 0.15s ease !important; }
        .action-btn:hover { transform: translateY(-1px) !important; }
        .badge-member { transition: all 0.15s; }
        .badge-member:hover { transform: scale(1.05); background:#ede9fe !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px', animation:'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#2d1058', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
            Équipes de Recherche
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontSize:'13px', color:'#94a3b8' }}>
              {teams.length} équipe{teams.length > 1 ? 's' : ''}
            </span>
            {teams.length > 0 && <>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#059669', fontWeight:'600' }}>
                {activeCount} active{activeCount > 1 ? 's' : ''}
              </span>
              <span style={{ width:4, height:4, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }}/>
              <span style={{ fontSize:'13px', color:'#94a3b8' }}>
                {totalMembers} membre{totalMembers > 1 ? 's' : ''}
              </span>
            </>}
          </div>
        </div>
        {canEdit && (
          <button onClick={openAdd}
            style={{
              background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color:'white', border:'none', padding:'11px 22px',
              borderRadius:'10px', fontSize:'13px', fontWeight:'700',
              cursor:'pointer', boxShadow:'0 4px 16px rgba(124,58,237,0.35)',
              transition:'all 0.2s', whiteSpace:'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(124,58,237,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(124,58,237,0.35)' }}>
            + Créer une équipe
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {teams.length === 0 ? (
        <div style={{
          background:'white', borderRadius:'16px',
          border:'1px solid rgba(124,58,237,0.08)',
          boxShadow:'0 2px 12px rgba(124,58,237,0.06)',
          padding:'80px 40px', textAlign:'center',
          animation:'popIn 0.4s ease-out',
        }}>
          <div style={{ width:72, height:72, borderRadius:'20px', background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.05))', border:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#2d1058', marginBottom:'6px' }}>Aucune équipe enregistrée</p>
          <p style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'20px' }}>Créez votre première équipe de recherche pour commencer</p>
          {canEdit && (
            <button onClick={openAdd}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'11px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', boxShadow:'0 4px 16px rgba(124,58,237,0.3)' }}>
              Créer la première équipe
            </button>
          )}
        </div>
      ) : (
        /* ── Grid cards ── */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px' }}>
          {teams.map((team, i) => (
            <div key={team.id} className="team-card"
              style={{
                background:'white', borderRadius:'16px',
                border:'1px solid rgba(124,58,237,0.08)',
                overflow:'hidden',
                boxShadow:'0 2px 10px rgba(124,58,237,0.06)',
                animation:`fadeUp 0.4s ease-out ${i * 0.08}s both`,
              }}>

              {/* Header card gradient */}
              <div style={{ background:'linear-gradient(135deg,#1a0a35,#2d1058)', padding:'22px 24px', position:'relative', overflow:'hidden' }}>
                {/* Motif hexagonal décoratif */}
                <svg style={{ position:'absolute', right:0, top:0, width:'38%', height:'100%', opacity:0.07 }}
                  viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
                  {[...Array(6)].map((_,j) => {
                    const x=j%3*70-20, y=Math.floor(j/3)*60-10, s=30
                    const pts=[...Array(6)].map((_,k)=>{const a=(k*60-30)*Math.PI/180; return `${x+s*Math.cos(a)},${y+s*Math.sin(a)}`}).join(' ')
                    return <polygon key={j} points={pts} fill="none" stroke="white" strokeWidth="1.5"/>
                  })}
                </svg>
                {/* Orbe lumineux */}
                <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.3),transparent)', pointerEvents:'none' }}/>

                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <h3 style={{ fontSize:'16px', fontWeight:'800', color:'white', margin:0, letterSpacing:'-0.3px' }}>{team.name}</h3>
                    <span style={{
                      fontSize:'10px', fontWeight:'700',
                      background: team.active ? 'rgba(5,150,105,0.25)' : 'rgba(239,68,68,0.2)',
                      color: team.active ? '#86efac' : '#fca5a5',
                      padding:'3px 10px', borderRadius:'20px',
                      border:`1px solid ${team.active ? 'rgba(5,150,105,0.4)' : 'rgba(239,68,68,0.3)'}`,
                      whiteSpace:'nowrap', flexShrink:0,
                    }}>
                      {team.active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', margin:0, lineHeight:'1.55' }}>
                    {team.description || 'Aucune description'}
                  </p>
                </div>
              </div>

              {/* Corps */}
              <div style={{ padding:'18px 22px' }}>

                {/* Chef d'équipe */}
                <div style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  marginBottom:'16px', padding:'10px 12px',
                  background:'#faf8ff', borderRadius:'10px',
                  border:'1px solid rgba(124,58,237,0.1)',
                }}>
                  <div style={{
                    width:'34px', height:'34px', borderRadius:'50%',
                    background: team.chief
                      ? 'linear-gradient(135deg,#7c3aed,#4c1d95)'
                      : '#e2e8f0',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: team.chief ? 'white' : '#94a3b8',
                    fontSize:'13px', fontWeight:'700', flexShrink:0,
                  }}>
                    {team.chief ? team.chief.firstName?.charAt(0) : '?'}
                  </div>
                  <div>
                    <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px' }}>Chef d'équipe</div>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#2d1058' }}>
                      {team.chief ? `${team.chief.firstName} ${team.chief.lastName}` : 'Non assigné'}
                    </div>
                  </div>
                  {team.chief && (
                    <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:'#059669', boxShadow:'0 0 6px rgba(5,150,105,0.5)' }}/>
                  )}
                </div>

                {/* Membres */}
                <div style={{ marginBottom:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                    <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      Membres
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:'#7c3aed', background:'rgba(124,58,237,0.08)', padding:'2px 8px', borderRadius:'20px' }}>
                      {team.members?.length || 0}
                    </span>
                  </div>
                  {team.members && team.members.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {team.members.slice(0, 4).map((m, j) => (
                        <div key={j} className="badge-member"
                          style={{
                            display:'flex', alignItems:'center', gap:'5px',
                            background:'#f5f3ff', padding:'4px 10px',
                            borderRadius:'20px', border:'1px solid rgba(124,58,237,0.15)',
                          }}>
                          <div style={{
                            width:'18px', height:'18px', borderRadius:'50%',
                            background:'linear-gradient(135deg,#7c3aed,#4c1d95)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'white', fontSize:'9px', fontWeight:'700',
                          }}>
                            {m.firstName?.charAt(0)}
                          </div>
                          <span style={{ fontSize:'11px', color:'#6d28d9', fontWeight:'500' }}>
                            {m.firstName} {m.lastName}
                          </span>
                        </div>
                      ))}
                      {team.members.length > 4 && (
                        <span style={{
                          fontSize:'11px', color:'#94a3b8',
                          padding:'4px 10px', background:'#f5f3ff',
                          borderRadius:'20px', border:'1px solid rgba(124,58,237,0.1)',
                        }}>
                          +{team.members.length - 4} autres
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize:'12px', color:'#94a3b8', fontStyle:'italic', margin:0 }}>
                      Aucun membre dans cette équipe
                    </p>
                  )}
                </div>

                {/* Séparateur */}
                <div style={{ height:1, background:'rgba(124,58,237,0.06)', marginBottom:'14px' }}/>

                {/* Actions */}
                <div style={{ display:'flex', gap:'6px' }}>
                  <button className="action-btn" onClick={() => setShowDetail(team)}
                    style={{ flex:1, background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='#ede9fe'}
                    onMouseLeave={e => e.currentTarget.style.background='#f5f3ff'}>
                    Détails
                  </button>
                  {canEdit && <>
                    <button className="action-btn" onClick={() => openEdit(team)}
                      style={{ flex:1, background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='#ddd6fe'}
                      onMouseLeave={e => e.currentTarget.style.background='#ede9fe'}>
                      Modifier
                    </button>
                    <button className="action-btn" onClick={() => handleDelete(team.id)}
                      style={{ flex:1, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}>
                      Supprimer
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
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'32px', width:'500px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
            <div style={{ textAlign:'center', marginBottom:'24px' }}>
              <div style={{ width:64, height:64, background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(124,58,237,0.35)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#2d1058', margin:'0 0 8px' }}>{showDetail.name}</h2>
              <span style={{ fontSize:'11px', fontWeight:'700', color:showDetail.active?'#059669':'#dc2626', background:showDetail.active?'#ecfdf5':'#fef2f2', padding:'3px 12px', borderRadius:'20px', border:`1px solid ${showDetail.active?'#bbf7d0':'#fecaca'}` }}>
                {showDetail.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {showDetail.description && (
              <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'12px', border:'1px solid rgba(124,58,237,0.08)' }}>
                <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Description</div>
                <p style={{ fontSize:'13px', color:'#2d1058', lineHeight:'1.6', margin:0 }}>{showDetail.description}</p>
              </div>
            )}

            <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'12px', border:'1px solid rgba(124,58,237,0.08)' }}>
              <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>Chef d'équipe</div>
              {showDetail.chief ? (
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'14px', fontWeight:'700' }}>
                    {showDetail.chief.firstName?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'#2d1058' }}>{showDetail.chief.firstName} {showDetail.chief.lastName}</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8' }}>{showDetail.chief.email}</div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize:'13px', color:'#94a3b8', fontStyle:'italic', margin:0 }}>Non assigné</p>
              )}
            </div>

            <div style={{ background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'20px', border:'1px solid rgba(124,58,237,0.08)' }}>
              <div style={{ fontSize:'10px', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
                Membres ({showDetail.members?.length || 0})
              </div>
              {showDetail.members?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {showDetail.members.map((m, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', background:'white', borderRadius:'8px', border:'1px solid rgba(124,58,237,0.08)' }}>
                      <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>
                        {m.firstName?.charAt(0)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:'600', color:'#2d1058' }}>{m.firstName} {m.lastName}</div>
                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>{m.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize:'13px', color:'#94a3b8', fontStyle:'italic', margin:0 }}>Aucun membre</p>
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
      )}

      {/* ── Modal Créer/Modifier ── */}
      {showModal && canEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(18,8,48,0.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'28px', width:'520px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 30px 70px rgba(0,0,0,0.3)', animation:'popIn 0.3s ease-out' }}>
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
                {editItem ? "Modifier l'équipe" : 'Créer une équipe'}
              </h2>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Nom de l'équipe *</label>
              <input value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                placeholder="Ex: IA & Machine Learning"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})}
                rows={3} placeholder="Domaine de recherche, objectifs..."
                style={{ ...inputStyle, resize:'vertical', height:'80px' }}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>Chef d'équipe</label>
              <select value={form.chiefId} onChange={e => setForm({...form, chiefId:e.target.value})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="">-- Sélectionner un chef d'équipe --</option>
                {members.map(m => (
                  <option key={m.id} value={m.user?.id || m.id}>
                    {m.firstName} {m.lastName} — {m.status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={labelStyle}>
                Membres de l'équipe
                <span style={{ fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px' }}>
                  ({form.memberIds?.length || 0} sélectionné{form.memberIds?.length > 1 ? 's' : ''})
                </span>
              </label>
              <div style={{ background:'#faf8ff', borderRadius:'8px', border:'1.5px solid rgba(124,58,237,0.2)', padding:'8px', maxHeight:'200px', overflowY:'auto' }}>
                {members.length === 0 ? (
                  <p style={{ fontSize:'12px', color:'#94a3b8', textAlign:'center', padding:'16px 0', margin:0 }}>Aucun membre disponible</p>
                ) : members.map(m => {
                  const selected = form.memberIds?.includes(m.id)
                  return (
                    <div key={m.id} className="member-item"
                      onClick={() => toggleMember(m.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:'10px',
                        padding:'8px 10px', borderRadius:'6px', cursor:'pointer',
                        background: selected ? '#ede9fe' : 'transparent',
                        marginBottom:'2px', transition:'all 0.15s',
                      }}>
                      <div style={{ width:'20px', height:'20px', borderRadius:'4px', flexShrink:0, background:selected?'linear-gradient(135deg,#7c3aed,#4c1d95)':'white', border:selected?'none':'2px solid #d1d5db', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:selected?'linear-gradient(135deg,#7c3aed,#4c1d95)':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', color:selected?'white':'#94a3b8', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>
                        {m.firstName?.charAt(0)}
                      </div>
                      <span style={{ fontSize:'13px', color:selected?'#6d28d9':'#374151', fontWeight:selected?'600':'400', flex:1 }}>
                        {m.firstName} {m.lastName}
                      </span>
                      <span style={{ fontSize:'10px', color:'#94a3b8', background:'#f1f5f9', padding:'2px 8px', borderRadius:'10px', whiteSpace:'nowrap' }}>
                        {m.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom:'22px' }}>
              <label style={labelStyle}>Statut</label>
              <select value={String(form.active)} onChange={e => setForm({...form, active:e.target.value==='true'})}
                style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={handleSave}
                style={{ flex:2, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'14px', boxShadow:'0 4px 14px rgba(124,58,237,0.3)' }}>
                {editItem ? 'Enregistrer les modifications' : "Créer l'équipe"}
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