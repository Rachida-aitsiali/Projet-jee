import { Navigate } from 'react-router-dom'
import { getRole, getUser } from '../services/authService'

export default function ProtectedRoute({ children, roles = [] }) {
  const token  = localStorage.getItem('token')
  const user   = getUser()
  const role   = getRole()
  const statut = user?.status

  if (!token) return <Navigate to="/login" replace />

  // Comptes gelés (Retraité) ou désactivés (Ancien) → pas d'accès
  if (statut === 'RETRAITE' || statut === 'ANCIEN') {
    return <Navigate to="/login" replace />
  }

  // Vérification rôle si requis
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}