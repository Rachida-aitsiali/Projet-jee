import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function Register() {
  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'',
    phone:'', institution:'', motivation:'',
    memberType:'PERMANENT'
  })
  const [cv, setCv]           = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const navigate              = useNavigate()
  const cvInputRef            = useRef()

  const handleChange = e => setForm({...form, [e.target.name]: e.target.value})

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.motivation) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (cv && cv.size > 5 * 1024 * 1024) {
      setError('Le CV ne doit pas dépasser 5MB')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Étape 1 — créer la demande
      const res = await API.post('/adhesion-requests', {
        firstName:   form.firstName,
        lastName:    form.lastName,
        email:       form.email,
        phone:       form.phone,
        institution: form.institution,
        motivation:  form.motivation,
        memberType:  form.memberType,
      })

      // Étape 2 — uploader le CV si présent
      if (cv && res.data?.id) {
        const fd = new FormData()
        fd.append('file', cv)
        await API.post(`/adhesion-requests/${res.data.id}/cv`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'string') setError(data)
      else if (data?.message) setError(data.message)
      else if (data?.error) setError(data.error)
      else setError("Erreur lors de la soumission. Vérifiez que cet email n'a pas déjà été utilisé.")
    } finally {
      setLoading(false)
    }
  }

  const typeDescriptions = {
    PERMANENT: 'Membre officiel du laboratoire LIAS — accès complet',
    ASSOCIE:   "Collaborateur d'un autre laboratoire — accès limité",
    DOCTORANT: 'Doctorant rattaché au LIAS — accès publications',
  }

  const icons = {
    PERMANENT: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    ASSOCIE: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    DOCTORANT: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  }

  if (success) return (
    <div style={{minHeight:'100vh', background:'#1a0a35', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Inter","Segoe UI",sans-serif'}}>
      <div style={{background:'#f0eeff', borderRadius:'16px', padding:'48px', width:'460px', textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.4)'}}>
        <div style={{width:'80px', height:'80px', background:'rgba(124,58,237,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 style={{fontSize:'22px', fontWeight:'800', color:'#120830', marginBottom:'12px'}}>Demande envoyée !</h2>
        <p style={{fontSize:'14px', color:'rgba(18,8,48,0.6)', lineHeight:'1.6', marginBottom:'28px'}}>
          Votre demande d'adhésion a été soumise avec succès. Le directeur du laboratoire LIAS l'examinera et vous contactera par email.
        </p>
        <button onClick={() => navigate('/login')}
          style={{width:'100%', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', padding:'14px', borderRadius:'10px', fontSize:'15px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 15px rgba(124,58,237,0.35)'}}>
          Retour à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#1a0a35', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Inter","Segoe UI",sans-serif', padding:'40px 20px'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .reg-input {
          width:100%; padding:12px 14px;
          border:1.5px solid rgba(124,58,237,0.2);
          border-radius:8px; font-size:14px;
          box-sizing:border-box; background:white;
          color:#1e1b4b; transition:all 0.2s;
          font-family:'Inter',sans-serif; outline:none;
        }
        .reg-input::placeholder { color:rgba(30,27,75,0.35); }
        .reg-input:focus {
          border-color:#7c3aed !important;
          box-shadow:0 0 0 4px rgba(124,58,237,0.12) !important;
        }
        .type-card {
          border:2px solid rgba(124,58,237,0.2);
          border-radius:10px; padding:18px 10px;
          cursor:pointer; transition:all 0.2s;
          background:white; text-align:center;
        }
        .type-card:hover { border-color:#7c3aed; background:#f5f3ff; }
        .cv-zone:hover { border-color:#7c3aed !important; }
      `}</style>

      <div style={{width:'580px', background:'#f0eeff', borderRadius:'16px', padding:'48px 44px', boxShadow:'0 25px 60px rgba(0,0,0,0.4)', animation:'fadeInUp 0.6s ease-out'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{width:'64px', height:'64px', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 20px rgba(124,58,237,0.3)'}}>
            <span style={{color:'white', fontSize:'18px', fontWeight:'900'}}>LIAS</span>
          </div>
          <h1 style={{fontSize:'24px', fontWeight:'800', color:'#120830', marginBottom:'6px'}}>Demande d'adhésion</h1>
          <p style={{fontSize:'14px', color:'rgba(18,8,48,0.5)'}}>Rejoignez le Laboratoire LIAS — FSBM · Hassan II</p>
        </div>

        {error && (
          <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderLeft:'4px solid #dc2626', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#dc2626', lineHeight:'1.5', display:'flex', alignItems:'center', gap:'8px'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Type de candidature */}
        <div style={{marginBottom:'24px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'700', color:'#1e1b4b', marginBottom:'12px'}}>
            Type de candidature *
          </label>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px'}}>
            {[
              { value:'PERMANENT', label:'Membre permanent' },
              { value:'ASSOCIE',   label:'Membre associé'   },
              { value:'DOCTORANT', label:'Doctorant'        },
            ].map(t => (
              <div key={t.value} className="type-card"
                onClick={() => setForm({...form, memberType: t.value})}
                style={{
                  border:`2px solid ${form.memberType===t.value ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`,
                  background: form.memberType===t.value ? '#ede9fe' : 'white',
                }}>
                <div style={{color: form.memberType===t.value ? '#7c3aed' : '#94a3b8', marginBottom:'8px', display:'flex', justifyContent:'center'}}>
                  {icons[t.value]}
                </div>
                <div style={{fontSize:'12px', fontWeight:'700', color: form.memberType===t.value ? '#7c3aed' : '#374151'}}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'10px', padding:'10px 14px', background:'rgba(124,58,237,0.08)', borderRadius:'8px', border:'1px solid rgba(124,58,237,0.15)'}}>
            <p style={{fontSize:'12px', color:'#6d28d9', margin:0, fontWeight:'500'}}>
              {typeDescriptions[form.memberType]}
            </p>
          </div>
        </div>

        {/* Prénom + Nom */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px'}}>
          {[
            {label:'Prénom *', name:'firstName', placeholder:'Votre prénom'},
            {label:'Nom *',    name:'lastName',  placeholder:'Votre nom'},
          ].map(f => (
            <div key={f.name}>
              <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>{f.label}</label>
              <input name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} className="reg-input"/>
            </div>
          ))}
        </div>

        {/* Email */}
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>Email *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="votre@email.com" className="reg-input"/>
        </div>

        {/* Téléphone */}
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>Téléphone</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+212 6XX-XXXXXX" className="reg-input"/>
        </div>

        {/* Établissement */}
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>Établissement d'origine</label>
          <input name="institution" value={form.institution} onChange={handleChange} placeholder="Université / Établissement" className="reg-input"/>
        </div>

        {/* Motivation */}
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>Lettre de motivation *</label>
          <textarea name="motivation" value={form.motivation} onChange={handleChange}
            placeholder="Expliquez votre motivation pour rejoindre le laboratoire LIAS..." rows={4}
            className="reg-input" style={{resize:'vertical', lineHeight:'1.6'}}/>
        </div>

        {/* Upload CV */}
        <div style={{marginBottom:'28px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>
            CV
            <span style={{fontSize:'11px', fontWeight:'400', color:'rgba(18,8,48,0.4)', marginLeft:'8px'}}>(optionnel — PDF, DOC, DOCX — Max 5MB)</span>
          </label>
          <div className="cv-zone"
            onClick={() => cvInputRef.current.click()}
            style={{padding:'20px', background: cv ? 'rgba(124,58,237,0.06)' : 'white', border:`2px dashed ${cv ? '#7c3aed' : 'rgba(124,58,237,0.25)'}`, borderRadius:'10px', cursor:'pointer', textAlign:'center', transition:'all 0.2s'}}>
            <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx"
              onChange={e => setCv(e.target.files[0])} style={{display:'none'}}/>
            {cv ? (
              <div>
                <div style={{width:'40px', height:'40px', borderRadius:'10px', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p style={{fontSize:'14px', color:'#7c3aed', fontWeight:'700', margin:'0 0 4px'}}>{cv.name}</p>
                <p style={{fontSize:'12px', color:'rgba(18,8,48,0.4)', margin:0}}>{(cv.size/1024/1024).toFixed(2)} MB · Cliquez pour changer</p>
              </div>
            ) : (
              <div style={{color:'rgba(18,8,48,0.35)'}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{margin:'0 auto 10px', display:'block'}}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{fontSize:'14px', margin:'0 0 4px', fontWeight:'600', color:'rgba(18,8,48,0.5)'}}>Cliquez pour joindre votre CV</p>
                <p style={{fontSize:'12px', margin:0}}>PDF, DOC, DOCX — Max 5MB</p>
              </div>
            )}
          </div>
          {cv && (
            <button onClick={e => { e.stopPropagation(); setCv(null) }}
              style={{marginTop:'8px', background:'none', border:'none', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px'}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Supprimer le CV
            </button>
          )}
        </div>

        {/* Bouton */}
        <button onClick={handleSubmit} disabled={loading}
          style={{width:'100%', padding:'14px', background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow:'0 4px 15px rgba(124,58,237,0.35)', marginBottom:'16px', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.background='linear-gradient(135deg,#6d28d9,#5b21b6)' }}
          onMouseLeave={e => { if(!loading) e.currentTarget.style.background='linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          {loading ? 'Envoi en cours...' : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Soumettre la demande
            </>
          )}
        </button>

        <div style={{textAlign:'center'}}>
          <a href="/login" style={{fontSize:'13px', color:'#7c3aed', fontWeight:'600', textDecoration:'none'}}
            onMouseEnter={e => e.currentTarget.style.color='#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.color='#7c3aed'}>
            Déjà membre ? Se connecter
          </a>
        </div>
      </div>
    </div>
  )
}