import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate                = useNavigate()

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch { setError('Email ou mot de passe incorrect') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      fontFamily:'"Inter","Segoe UI",sans-serif',
      background:'#1a0a35'
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }

        .login-input {
          width:100%; padding:13px 16px;
          background:white;
          border:1.5px solid rgba(124,58,237,0.25);
          border-radius:8px; font-size:14px;
          color:#1e1b4b; outline:none;
          transition:all 0.2s; box-sizing:border-box;
          font-family:'Inter',sans-serif;
        }
        .login-input::placeholder { color:rgba(30,27,75,0.35); }
        .login-input:focus {
          border-color:#7c3aed;
          background:#f5f3ff;
          box-shadow:0 0 0 4px rgba(124,58,237,0.12);
        }
      `}</style>

      {/* Card login */}
      <div style={{
        width:'440px',
        background:'#f0eeff',
        border:'1px solid rgba(124,58,237,0.2)',
        borderRadius:'16px',
        padding:'48px 44px',
        boxShadow:'0 25px 60px rgba(0,0,0,0.4)',
        animation:'fadeInUp 0.6s ease-out'
      }}>

        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:'36px'}}>
          <div style={{
            width:'64px', height:'64px',
            background:'linear-gradient(135deg,#7c3aed,#4c1d95)',
            borderRadius:'16px',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
            boxShadow:'0 8px 20px rgba(124,58,237,0.3)'
          }}>
            <span style={{color:'white', fontSize:'18px', fontWeight:'900', letterSpacing:'-0.5px'}}>LIAS</span>
          </div>
          <h1 style={{fontSize:'24px', fontWeight:'800', color:'#120830', marginBottom:'6px'}}>Bienvenue</h1>
          <p style={{fontSize:'14px', color:'rgba(18,8,48,0.5)'}}>Portail du Laboratoire LIAS — FSBM</p>
        </div>

        {error && (
          <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#dc2626'}}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{marginBottom:'18px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>
            Adresse email
          </label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="login-input"
          />
        </div>

        {/* Mot de passe */}
        <div style={{marginBottom:'28px'}}>
          <label style={{display:'block', fontSize:'13px', fontWeight:'600', color:'#1e1b4b', marginBottom:'8px'}}>
            Mot de passe
          </label>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="login-input"
          />
        </div>

        {/* Bouton connexion */}
        <button onClick={handleLogin} disabled={loading}
          style={{
            width:'100%', padding:'14px',
            background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            color:'white', border:'none', borderRadius:'8px',
            fontSize:'15px', fontWeight:'700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow:'0 4px 15px rgba(124,58,237,0.35)',
            marginBottom:'20px', transition:'all 0.2s'
          }}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.background='linear-gradient(135deg,#6d28d9,#5b21b6)' }}
          onMouseLeave={e => { if(!loading) e.currentTarget.style.background='linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>

        {/* Lien inscription */}
        <div style={{textAlign:'center', padding:'14px', background:'rgba(124,58,237,0.08)', borderRadius:'8px', border:'1px solid rgba(124,58,237,0.15)', marginBottom:'16px'}}>
          <span style={{fontSize:'13px', color:'rgba(18,8,48,0.5)'}}>Pas encore membre ? </span>
          <a href="/register" style={{fontSize:'13px', color:'#7c3aed', fontWeight:'700', textDecoration:'none'}}
            onMouseEnter={e => e.currentTarget.style.color='#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.color='#7c3aed'}>
            Soumettre une demande
          </a>
        </div>

        {/* Retour */}
        <div style={{textAlign:'center'}}>
          <a href="/" style={{fontSize:'12px', color:'rgba(18,8,48,0.35)', textDecoration:'none', transition:'color 0.2s'}}
            onMouseEnter={e => e.currentTarget.style.color='rgba(18,8,48,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(18,8,48,0.35)'}>
            ← Retour au site public
          </a>
        </div>
      </div>
    </div>
  )
}