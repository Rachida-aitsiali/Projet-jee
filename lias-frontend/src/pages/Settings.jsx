import { useState, useEffect, useRef } from 'react'
import { getUser } from '../services/authService'
import api from '../services/api'

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

export default function Settings() {
  const user                            = getUser()
  const [member, setMember]             = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [savingPwd, setSavingPwd]       = useState(false)
  const [message, setMessage]           = useState(null)
  const [form, setForm]                 = useState({ firstName: '', lastName: '', email: '' })
  const [pwdForm, setPwdForm]           = useState({ current: '', newPwd: '', confirm: '' })
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [showPhoto, setShowPhoto]       = useState(false)
  const fileInputRef                    = useRef()

  useEffect(() => {
    api.get('/members').then(r => {
      const found = r.data.find(m =>
        m.firstName === user?.firstName && m.lastName === user?.lastName
      )
      if (found) {
        setMember(found)
        setForm({ firstName: found.firstName || '', lastName: found.lastName || '', email: user?.email || '' })
        setPhotoPreview(buildPhotoUrl(found.photo))
      } else {
        setForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' })
        setPhotoPreview(null)
      }
    }).catch(() => {
      setForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' })
    })
  }, [])

  const buildPhotoUrl = (photo) => {
    if (!photo) return null
    if (photo.startsWith('http')) return photo
    return `http://localhost:8081${photo}`
  }

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3500)
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showMsg('Veuillez sélectionner une image', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { showMsg('Image trop grande (max 5MB)', 'error'); return }
    if (!member) { showMsg('Profil membre non trouvé', 'error'); return }

    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/members/${member.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const res = await api.get('/members')
      const updated = res.data.find(m => m.id === member.id)
      if (updated) {
        setMember(updated)
        setPhotoPreview(buildPhotoUrl(updated.photo))
      }
      showMsg('Photo mise à jour avec succès !')
    } catch { showMsg("Erreur lors de l'upload de la photo", 'error') }
    finally { setUploading(false) }
  }

  const handleDeletePhoto = async () => {
    if (!member) return
    try {
      setDeleting(true)
      await api.delete(`/members/${member.id}/photo`)
      setPhotoPreview(null)
      setMember({ ...member, photo: null })
      showMsg('Photo supprimée avec succès !')
    } catch { showMsg('Erreur lors de la suppression', 'error') }
    finally { setDeleting(false) }
  }

  const handleSaveProfil = async () => {
    if (!form.firstName || !form.lastName) { showMsg('Prénom et nom obligatoires', 'error'); return }
    try {
      setSaving(true)
      if (member) {
        await api.put(`/members/${member.id}`, { ...member, firstName: form.firstName, lastName: form.lastName })
      }
      showMsg('Profil mis à jour avec succès !')
    } catch { showMsg('Erreur lors de la sauvegarde', 'error') }
    finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) { showMsg('Tous les champs sont obligatoires', 'error'); return }
    if (pwdForm.newPwd !== pwdForm.confirm) { showMsg('Les mots de passe ne correspondent pas', 'error'); return }
    if (pwdForm.newPwd.length < 6) { showMsg('Minimum 6 caractères', 'error'); return }
    try {
      setSavingPwd(true)
      await api.put('/auth/change-password', { currentPassword: pwdForm.current, newPassword: pwdForm.newPwd })
      setPwdForm({ current: '', newPwd: '', confirm: '' })
      showMsg('Mot de passe modifié avec succès !')
    } catch { showMsg('Mot de passe actuel incorrect', 'error') }
    finally { setSavingPwd(false) }
  }

  const pwdStrength = (pwd) => {
    if (!pwd) return null
    if (pwd.length < 6)  return { label: 'Trop court', color: '#dc2626', width: '20%' }
    if (pwd.length < 8)  return { label: 'Faible',     color: '#d97706', width: '40%' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Moyen', color: '#d97706', width: '60%' }
    if (pwd.length >= 10) return { label: 'Fort',      color: '#059669', width: '100%' }
    return { label: 'Bien', color: '#059669', width: '80%' }
  }
  const strength = pwdStrength(pwdForm.newPwd)

  const EyeIcon = ({ show }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {show
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    </svg>
  )

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', animation: 'fadeUp 0.4s ease-out' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', marginBottom: '4px', letterSpacing: '-0.5px' }}>
          Paramètres
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Gérez votre profil et votre sécurité</p>
      </div>

      {/* ── Message feedback ── */}
      {message && (
        <div style={{ marginBottom: '20px', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideIn 0.3s ease-out',
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color:      message.type === 'success' ? '#059669' : '#dc2626',
          border:     `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {message.type === 'success'
              ? <polyline points="20 6 9 17 4 12"/>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
          {message.text}
        </div>
      )}

      {/* ── Photo de profil ── */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#2d1058', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #f0eeff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }} />
          Photo de profil
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photoPreview ? (
              <div
                onClick={() => setShowPhoto(true)}
                style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(124,58,237,0.2)', boxShadow: '0 4px 16px rgba(124,58,237,0.15)', cursor: 'zoom-in' }}>
                <img
                  src={photoPreview}
                  alt="profil"
                  onError={() => setPhotoPreview(null)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: '900', boxShadow: '0 4px 16px rgba(124,58,237,0.25)' }}>
                {form.firstName?.charAt(0)}{form.lastName?.charAt(0)}
              </div>
            )}

            {/* Spinner upload/delete */}
            {(uploading || deleting) && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(18,8,48,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </div>
            )}

            {/* Badge loupe */}
            {photoPreview && !uploading && !deleting && (
              <div
                onClick={() => setShowPhoto(true)}
                style={{ position: 'absolute', bottom: '2px', right: '2px', width: '26px', height: '26px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(124,58,237,0.4)', cursor: 'zoom-in', border: '2px solid white' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            )}
          </div>

          {/* Infos + boutons */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#2d1058', marginBottom: '2px' }}>
              {form.firstName} {form.lastName}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }}/>
              <button onClick={() => fileInputRef.current.click()} disabled={uploading || deleting}
                style={{ background: uploading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(124,58,237,0.25)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                {uploading ? 'Upload...' : 'Changer la photo'}
              </button>
              {photoPreview && (
                <button onClick={handleDeletePhoto} disabled={deleting || uploading}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  </svg>
                  {deleting ? '...' : 'Supprimer'}
                </button>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
              JPG, PNG — Max 5MB · Cliquez sur la photo pour l'agrandir
            </p>
          </div>
        </div>
      </div>

      {/* ── Grille Profil + Mot de passe ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Mon profil */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', padding: '28px', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#2d1058', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #f0eeff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }} />
            Mon profil
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Prénom</label>
            <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Nom</label>
            <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Email</label>
            <input value={form.email} disabled
              style={{ ...inputStyle, background: '#f5f3ff', color: '#94a3b8', cursor: 'not-allowed' }} />
            <p style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '4px' }}>
              L'email ne peut pas être modifié
            </p>
          </div>

          <button onClick={handleSaveProfil} disabled={saving}
            style={{ background: saving ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {saving ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Sauvegarde...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Sauvegarder les modifications
              </>
            )}
          </button>
        </div>

        {/* Mot de passe */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.08)', padding: '28px', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#2d1058', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #f0eeff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed' }} />
            Changer le mot de passe
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Mot de passe actuel</label>
            <div style={{ position: 'relative' }}>
              <input type={showCurrent ? 'text' : 'password'} value={pwdForm.current}
                onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })}
                placeholder="••••••••" style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
              <button onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}>
                <EyeIcon show={showCurrent} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={pwdForm.newPwd}
                onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                placeholder="••••••••" style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.2)'} />
              <button onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}>
                <EyeIcon show={showNew} />
              </button>
            </div>
          </div>

          {/* Barre de force */}
          {pwdForm.newPwd && strength && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ height: '4px', background: '#f0eeff', borderRadius: '99px', overflow: 'hidden', marginBottom: '4px' }}>
                <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: strength.color }}>{strength.label}</span>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Confirmer le mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} value={pwdForm.confirm}
                onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '44px', borderColor: pwdForm.confirm && pwdForm.newPwd !== pwdForm.confirm ? '#dc2626' : 'rgba(124,58,237,0.2)' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = pwdForm.confirm && pwdForm.newPwd !== pwdForm.confirm ? '#dc2626' : 'rgba(124,58,237,0.2)'} />
              <button onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
            {pwdForm.confirm && pwdForm.newPwd !== pwdForm.confirm && (
              <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>
                Les mots de passe ne correspondent pas
              </p>
            )}
            {pwdForm.confirm && pwdForm.newPwd === pwdForm.confirm && pwdForm.confirm.length > 0 && (
              <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                Les mots de passe correspondent ✓
              </p>
            )}
          </div>

          <button onClick={handleChangePassword} disabled={savingPwd}
            style={{ background: savingPwd ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: savingPwd ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {savingPwd ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Modification...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Modifier le mot de passe
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Lightbox photo ── */}
      {showPhoto && photoPreview && (
        <div onClick={() => setShowPhoto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(18,8,48,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', animation: 'fadeIn 0.2s ease-out' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

            {/* Cercle fixe 300x300 */}
            <div style={{ width: '300px', height: '300px', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(124,58,237,0.5)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
              <img
                src={photoPreview}
                alt="profil agrandi"
                onError={() => setShowPhoto(false)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* Bouton fermer */}
            <button onClick={() => setShowPhoto(false)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.4)', fontWeight: '700', lineHeight: 1 }}>
              ×
            </button>

            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              Cliquez en dehors pour fermer
            </span>
          </div>
        </div>
      )}
    </div>
  )
}