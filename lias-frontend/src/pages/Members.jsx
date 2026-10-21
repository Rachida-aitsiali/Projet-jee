import { useState, useEffect, useRef } from 'react'
import memberService from '../services/memberService'
import { getRole } from '../services/authService'
import API from '../services/api'

const statusColor = { PERMANENT:'#059669', DOCTORANT:'#7c3aed', ASSOCIE:'#d97706', RETRAITE:'#64748b', ANCIEN:'#ef4444' }
const statusBg    = { PERMANENT:'#ecfdf5', DOCTORANT:'#f5f3ff', ASSOCIE:'#fffbeb', RETRAITE:'#f1f5f9', ANCIEN:'#fef2f2' }
const roleColor   = { DIRECTEUR:'#2d1058', VICE_DIRECTEUR:'#7c3aed', CHEF_EQUIPE:'#6d28d9', MEMBRE:'#059669', DOCTORANT:'#d97706', ADMIN:'#dc2626' }
const roleBg      = { DIRECTEUR:'#f5f3ff', VICE_DIRECTEUR:'#f5f3ff', CHEF_EQUIPE:'#ede9fe', MEMBRE:'#ecfdf5', DOCTORANT:'#fffbeb', ADMIN:'#fef2f2' }
const emptyForm   = { firstName:'', lastName:'', status:'PERMANENT', biography:'', establishment:'', researchInterests:'', hireDate:'', affiliationDate:'', email:'', role:'', birthDate:'', photo:'' }

export default function Members() {
  const [members, setMembers]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole]     = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [showDetail, setShowDetail]     = useState(null)
  const [editItem, setEditItem]         = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [photoFile, setPhotoFile]       = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const photoInputRef                   = useRef()

  const role    = getRole()
  const canEdit = ['ADMIN','DIRECTEUR'].includes(role)

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await memberService.getMembers()
      setMembers(response.data)
    } catch (error) { console.error("Erreur API:", error) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMembers() }, [])

  const filtered = members.filter(m => {
    const name = `${m.firstName||''} ${m.lastName||''}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const matchStatus = filterStatus ? m.status === filterStatus : true
    const matchRole   = filterRole   ? getRoleFromMember(m) === filterRole : true
    return matchSearch && matchStatus && matchRole
  })

  function getRoleFromMember(m) {
    if (m.user?.roles && m.user.roles.length > 0) return m.user.roles[0].name
    return null
  }

  const openAdd = () => {
    setForm(emptyForm); setPhotoFile(null); setPhotoPreview(null); setEditItem(null); setShowModal(true)
  }

  const openEdit = (m) => {
    setForm({
      ...m,
      researchInterests: m.researchInterests ? m.researchInterests.join(', ') : '',
      hireDate: m.hireDate||'', affiliationDate: m.affiliationDate||'',
      email: m.email||'', role: getRoleFromMember(m)||'', birthDate: m.birthDate||''
    })
    setPhotoFile(null); setPhotoPreview(null); setEditItem(m.id); setShowModal(true)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)) }
  }

  const handleUploadPhoto = async (memberId) => {
    if (!photoFile) return
    const formData = new FormData()
    formData.append('file', photoFile)
    await API.post(`/members/${memberId}/photo`, formData, { headers:{'Content-Type':'multipart/form-data'} })
  }

  const handleDeletePhoto = async (memberId) => {
    if (window.confirm('Supprimer la photo ?')) {
      try {
        await API.delete(`/members/${memberId}/photo`)
        setMembers(prev => prev.map(m => m.id===memberId ? {...m,photo:null} : m))
        if (showDetail?.id===memberId) setShowDetail({...showDetail,photo:null})
        setForm(prev => ({...prev,photo:null}))
      } catch { alert('Erreur suppression photo') }
    }
  }

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) return
    const dataToSend = {
      ...form,
      researchInterests: typeof form.researchInterests==='string'
        ? form.researchInterests.split(',').map(s=>s.trim()).filter(s=>s!=='')
        : form.researchInterests
    }
    try {
      if (editItem) {
        await memberService.updateMember(editItem, dataToSend)
        if (form.role) await memberService.updateRole(editItem, form.role)
        if (photoFile) await handleUploadPhoto(editItem)
      } else {
        const res = await memberService.createMember(dataToSend)
        if (form.role) await memberService.updateRole(res.data.id, form.role)
        if (photoFile) await handleUploadPhoto(res.data.id)
      }
      setPhotoFile(null); setPhotoPreview(null); fetchMembers(); setShowModal(false)
    } catch (err) {
      console.error('ERREUR DÉTAILLÉE:', err)
      console.error('Réponse serveur:', err.response?.data)
      alert("Erreur : " + JSON.stringify(err.response?.data || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Archiver ce membre ? (Les données sont conservées)")) {
      try { await memberService.deleteMember(id); fetchMembers() }
      catch { alert("Erreur") }
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
    <div style={{padding:'24px', textAlign:'center', color:'#7c3aed'}}>Chargement...</div>
  )

  return (
    <div style={{
      padding:'24px',
      fontFamily:'"Inter","Segoe UI",sans-serif',
      background:'#f8f7ff',
      minHeight:'100vh',
      overflowX:'hidden',
      boxSizing:'border-box'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .member-row:hover { background:#faf8ff !important; }
        .action-btn { transition:all 0.15s; border:none; cursor:pointer; border-radius:6px; font-weight:600; }
        .action-btn:hover { transform:translateY(-1px); opacity:0.85; }
      `}</style>

      {/* ── Header ── */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', animation:'fadeUp 0.4s ease-out'}}>
        <div>
          <h1 style={{fontSize:'22px', fontWeight:'800', color:'#2d1058', marginBottom:'4px', letterSpacing:'-0.5px'}}>
            Gestion des Membres
          </h1>
          <p style={{fontSize:'13px', color:'#94a3b8'}}>
            {members.length} membres · {filtered.length} résultat{filtered.length>1?'s':''}
          </p>
        </div>
        {canEdit && (
          <button onClick={openAdd}
            style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'10px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 15px rgba(124,58,237,0.3)', whiteSpace:'nowrap'}}>
            + Ajouter un membre
          </button>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{background:'white', borderRadius:'12px', border:'1px solid rgba(124,58,237,0.1)', padding:'12px 16px', marginBottom:'16px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'10px', boxShadow:'0 2px 8px rgba(124,58,237,0.06)'}}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom..."
          style={{...inputStyle, padding:'8px 12px', fontSize:'13px'}}
          onFocus={e => e.target.style.borderColor='#7c3aed'}
          onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{...inputStyle, padding:'8px 12px', fontSize:'13px', cursor:'pointer'}}>
          <option value="">Tous les statuts</option>
          <option value="PERMANENT">Permanent</option>
          <option value="DOCTORANT">Doctorant</option>
          <option value="ASSOCIE">Associé</option>
          <option value="RETRAITE">Retraité</option>
          <option value="ANCIEN">Ancien</option>
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{...inputStyle, padding:'8px 12px', fontSize:'13px', cursor:'pointer'}}>
          <option value="">Tous les rôles</option>
          <option value="DIRECTEUR">Directeur</option>
          <option value="VICE_DIRECTEUR">Vice-Directeur</option>
          <option value="CHEF_EQUIPE">Chef d'équipe</option>
          <option value="MEMBRE">Membre</option>
          <option value="DOCTORANT">Doctorant</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{background:'white', borderRadius:'14px', border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden', boxShadow:'0 2px 8px rgba(124,58,237,0.06)'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', minWidth:'700px'}}>
            <thead>
              <tr style={{background:'#f5f3ff', borderBottom:'2px solid rgba(124,58,237,0.1)'}}>
                {['Membre','Email','Rôle','Statut','Actions'].map(h => (
                  <th key={h} style={{padding:'12px 14px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const memberRole = getRoleFromMember(m)
                return (
                  <tr key={m.id} className="member-row"
                    style={{borderBottom:'1px solid #f5f3ff', background:'white', transition:'background 0.15s'}}>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{width:'36px', height:'36px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'13px', fontWeight:'700', flexShrink:0}}>
                          {m.photo
                            ? <img src={'http://localhost:8081'+m.photo} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                            : m.firstName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{fontSize:'13px', fontWeight:'600', color:'#2d1058', whiteSpace:'nowrap'}}>{m.firstName} {m.lastName}</div>
                          {m.establishment && <div style={{fontSize:'11px', color:'#94a3b8'}}>{m.establishment}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px', fontSize:'12px', color:'#7c3aed', whiteSpace:'nowrap'}}>{m.email || '—'}</td>
                    <td style={{padding:'12px 14px'}}>
                      {memberRole
                        ? <span style={{fontSize:'10px', fontWeight:'700', color:roleColor[memberRole]||'#2d1058', background:roleBg[memberRole]||'#f5f3ff', padding:'3px 8px', borderRadius:'20px', whiteSpace:'nowrap'}}>{memberRole}</span>
                        : <span style={{fontSize:'12px', color:'#94a3b8'}}>—</span>}
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <span style={{fontSize:'10px', fontWeight:'700', color:statusColor[m.status], background:statusBg[m.status], padding:'3px 8px', borderRadius:'20px', whiteSpace:'nowrap'}}>{m.status}</span>
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex', gap:'4px', flexWrap:'nowrap'}}>
                        <button onClick={() => setShowDetail(m)} className="action-btn"
                          style={{background:'#f5f3ff', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px'}}>
                          Voir
                        </button>
                        {canEdit && <>
                          <button onClick={() => openEdit(m)} className="action-btn"
                            style={{background:'#ede9fe', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'5px 10px', fontSize:'11px'}}>
                            Modifier
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="action-btn"
                            style={{background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'5px 10px', fontSize:'11px'}}>
                            Archiver
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>
                    <div style={{fontSize:'14px', fontWeight:'500'}}>Aucun membre trouvé</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Détail ── */}
      {showDetail && (
        <div style={{position:'fixed', inset:0, background:'rgba(18,8,48,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
          <div style={{background:'white', borderRadius:'16px', padding:'32px', width:'460px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
            <div style={{textAlign:'center', marginBottom:'24px'}}>
              <div style={{width:'80px', height:'80px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'28px', fontWeight:'800', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(124,58,237,0.3)'}}>
                {showDetail.photo
                  ? <img src={'http://localhost:8081'+showDetail.photo} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                  : showDetail.firstName?.charAt(0)}
              </div>
              <h2 style={{fontSize:'18px', fontWeight:'800', color:'#2d1058', margin:'0 0 8px'}}>
                {showDetail.firstName} {showDetail.lastName}
              </h2>
              {getRoleFromMember(showDetail) && (
                <span style={{fontSize:'12px', fontWeight:'700', color:roleColor[getRoleFromMember(showDetail)]||'#2d1058', background:roleBg[getRoleFromMember(showDetail)]||'#f5f3ff', padding:'4px 14px', borderRadius:'20px', display:'inline-block'}}>
                  {getRoleFromMember(showDetail)}
                </span>
              )}
            </div>

            <div style={{background:'#faf8ff', borderRadius:'10px', padding:'14px', marginBottom:'14px'}}>
              {[
                {label:'Email',               val: showDetail.email               || 'Non renseigné'},
                {label:'Établissement',       val: showDetail.establishment       || 'Non renseigné'},
                {label:'Statut',              val: showDetail.status, badge:true},
                {label:"Date d'affiliation",  val: showDetail.affiliationDate     || 'Non renseigné'},
                {label:"Date d'embauche",     val: showDetail.hireDate            || 'Non renseigné'},
                {label:'Thèmes de recherche', val: showDetail.researchInterests?.join(', ') || 'Non renseigné'},
                {label:'Biographie',          val: showDetail.biography           || 'Non renseignée'},
              ].map((item,i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:i<6?'1px solid #f0eeff':'none', gap:'12px'}}>
                  <span style={{fontSize:'12px', color:'#94a3b8', fontWeight:'500', flexShrink:0}}>{item.label}</span>
                  {item.badge ? (
                    <span style={{fontSize:'11px', fontWeight:'700', color:statusColor[item.val], background:statusBg[item.val], padding:'3px 10px', borderRadius:'20px'}}>{item.val}</span>
                  ) : (
                    <span style={{fontSize:'12px', fontWeight: item.val.includes('Non')?'400':'600', color: item.val.includes('Non')?'#c4b5fd':'#2d1058', textAlign:'right', fontStyle: item.val.includes('Non')?'italic':'normal', wordBreak:'break-word'}}>
                      {item.val}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {canEdit && showDetail.birthDate && (
              <div style={{background:'#fef2f2', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12px', color:'#dc2626'}}>
                <b>Date de naissance (confidentielle) :</b> {showDetail.birthDate}
              </div>
            )}

            <div style={{display:'flex', gap:'8px'}}>
              {canEdit && showDetail.photo && (
                <button onClick={() => handleDeletePhoto(showDetail.id)}
                  style={{flex:1, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px'}}>
                  Supprimer photo
                </button>
              )}
              {canEdit && (
                <button onClick={() => { setShowDetail(null); openEdit(showDetail) }}
                  style={{flex:1, background:'#ede9fe', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'12px'}}>
                  Modifier
                </button>
              )}
              <button onClick={() => setShowDetail(null)}
                style={{flex:2, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'13px'}}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Ajout/Édition ── */}
      {showModal && canEdit && (
        <div style={{position:'fixed', inset:0, background:'rgba(18,8,48,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'white', borderRadius:'16px', padding:'28px', width:'560px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
            <h2 style={{fontSize:'17px', fontWeight:'800', color:'#2d1058', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1px solid #f0eeff'}}>
              {editItem ? 'Modifier le Profil' : 'Ajouter un Membre'}
            </h2>

            {/* Photo */}
            <div style={{marginBottom:'16px', padding:'14px', background:'#faf8ff', borderRadius:'10px', border:'1px solid rgba(124,58,237,0.1)'}}>
              <label style={labelStyle}>Photo de profil</label>
              <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'20px', fontWeight:'700', flexShrink:0}}>
                  {photoPreview
                    ? <img src={photoPreview} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                    : form.photo
                      ? <img src={'http://localhost:8081'+form.photo} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                      : form.firstName?.charAt(0) || '?'}
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}}/>
                  <button type="button" onClick={() => photoInputRef.current.click()}
                    style={{background:'#ede9fe', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.2)', padding:'7px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>
                    {form.photo || photoPreview ? 'Changer' : 'Ajouter photo'}
                  </button>
                  {(form.photo || photoPreview) && (
                    <button type="button"
                      onClick={() => {
                        if (photoPreview) { setPhotoFile(null); setPhotoPreview(null) }
                        else if (editItem && form.photo) { handleDeletePhoto(editItem); setForm({...form, photo:null}) }
                      }}
                      style={{background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'7px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Prénom + Nom */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
              {[{label:'Prénom *', key:'firstName'},{label:'Nom *', key:'lastName'}].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                    style={{...inputStyle}}
                    onFocus={e => e.target.style.borderColor='#7c3aed'}
                    onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
                </div>
              ))}
            </div>

            {/* Email */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email||''} onChange={e => setForm({...form, email:e.target.value})}
                style={{...inputStyle}}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            {/* Établissement */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>Établissement</label>
              <input value={form.establishment||''} onChange={e => setForm({...form, establishment:e.target.value})}
                style={{...inputStyle}}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            {/* Thèmes */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>Thèmes de recherche (séparés par virgule)</label>
              <input value={form.researchInterests||''} onChange={e => setForm({...form, researchInterests:e.target.value})}
                placeholder="ex: IA, Machine Learning, Big Data"
                style={{...inputStyle}}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            {/* Biographie */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>Biographie</label>
              <textarea value={form.biography||''} onChange={e => setForm({...form, biography:e.target.value})}
                style={{...inputStyle, height:'70px', resize:'vertical'}}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            {/* Dates embauche + affiliation */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
              {[{label:"Date d'embauche", key:'hireDate'},{label:"Date d'affiliation", key:'affiliationDate'}].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type="date" value={form[f.key]||''} onChange={e => setForm({...form,[f.key]:e.target.value})}
                    style={{...inputStyle}}
                    onFocus={e => e.target.style.borderColor='#7c3aed'}
                    onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
                </div>
              ))}
            </div>

            {/* Date naissance */}
            <div style={{marginBottom:'12px'}}>
              <label style={labelStyle}>
                Date de naissance
                <span style={{fontWeight:'400', color:'#94a3b8', textTransform:'none', marginLeft:'6px'}}>(confidentielle)</span>
              </label>
              <input type="date" value={form.birthDate||''} onChange={e => setForm({...form, birthDate:e.target.value})}
                style={{...inputStyle}}
                onFocus={e => e.target.style.borderColor='#7c3aed'}
                onBlur={e => e.target.style.borderColor='rgba(124,58,237,0.2)'}/>
            </div>

            {/* Statut + Rôle */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px'}}>
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}
                  style={{...inputStyle, cursor:'pointer'}}>
                  <option value="PERMANENT">Permanent</option>
                  <option value="DOCTORANT">Doctorant</option>
                  <option value="ASSOCIE">Associé</option>
                  <option value="RETRAITE">Retraité</option>
                  <option value="ANCIEN">Ancien Membre</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Rôle</label>
                <select value={form.role||''} onChange={e => setForm({...form, role:e.target.value})}
                  style={{...inputStyle, cursor:'pointer'}}>
                  <option value="">-- Aucun rôle --</option>
                  <option value="DIRECTEUR">Directeur</option>
                  <option value="VICE_DIRECTEUR">Vice-Directeur</option>
                  <option value="CHEF_EQUIPE">Chef d'équipe</option>
                  <option value="MEMBRE">Membre</option>
                  <option value="DOCTORANT">Doctorant</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
            </div>

            {/* Boutons */}
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={handleSave}
                style={{flex:2, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'12px', borderRadius:'8px', fontWeight:'700', cursor:'pointer', fontSize:'14px', boxShadow:'0 4px 12px rgba(124,58,237,0.3)'}}>
                {editItem ? 'Enregistrer les modifications' : 'Ajouter le membre'}
              </button>
              <button onClick={() => setShowModal(false)}
                style={{flex:1, background:'#f5f3ff', color:'#6d28d9', border:'1px solid rgba(124,58,237,0.2)', padding:'12px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px'}}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}