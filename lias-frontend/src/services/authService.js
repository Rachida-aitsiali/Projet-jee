import API from './api'

export const login = async (email, password) => {
  const response = await API.post('/auth/login', { email, password })
  localStorage.setItem('token', response.data.token)
  localStorage.setItem('user', JSON.stringify(response.data))
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const getRole = () => {
  const user = getUser()
  return user?.role || 'MEMBRE'
}

export const isDirecteur = () => {
  return getRole() === 'DIRECTEUR'
}

export const isAdmin = () => {
  return getRole() === 'ADMIN'
}

export const hasAccess = (requiredRoles = []) => {
  const role = getRole()
  return requiredRoles.includes(role)
}