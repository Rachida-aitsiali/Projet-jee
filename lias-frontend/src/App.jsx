import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Publications from './pages/Publications'
import Events from './pages/Events'
import Documents from './pages/Documents'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import AdhesionRequests from './pages/AdhesionRequests'
import Teams from './pages/Teams'
import Calendar from './pages/Calendar'
import AnnualReport from './pages/AnnualReport'
import Materials from './pages/Materials'
import Conventions from './pages/Conventions'
import PV from './pages/PV'
import MemberHistory from './pages/MemberHistory'
import Mandates from './pages/Mandates'
import Search from './pages/Search'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Messages from './pages/Messages'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Pages publiques ─────────────────────────────────────── */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Pages accessibles à tous les membres connectés ──────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/members" element={
          <ProtectedRoute>
            <Layout><Members /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/teams" element={
          <ProtectedRoute>
            <Layout><Teams /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/publications" element={
          <ProtectedRoute>
            <Layout><Publications /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/events" element={
          <ProtectedRoute>
            <Layout><Events /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/calendar" element={
          <ProtectedRoute>
            <Layout><Calendar /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/documents" element={
          <ProtectedRoute>
            <Layout><Documents /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/conventions" element={
          <ProtectedRoute>
            <Layout><Conventions /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/materials" element={
          <ProtectedRoute>
            <Layout><Materials /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/search" element={
          <ProtectedRoute>
            <Layout><Search /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <Layout><Notifications /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />

        {/* ── Pages Directeur + Admin seulement ───────────────────── */}
        <Route path="/adhesion-requests" element={
          <ProtectedRoute roles={['DIRECTEUR', 'ADMIN']}>
            <Layout><AdhesionRequests /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/member-history" element={
          <ProtectedRoute roles={['DIRECTEUR', 'ADMIN']}>
            <Layout><MemberHistory /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/mandates" element={
          <ProtectedRoute roles={['DIRECTEUR', 'ADMIN']}>
            <Layout><Mandates /></Layout>
          </ProtectedRoute>
        } />

        {/* ── Pages Directeur + Admin + Chef d'équipe ─────────────── */}
        <Route path="/annual-report" element={
          <ProtectedRoute roles={['DIRECTEUR', 'ADMIN', 'CHEF_EQUIPE']}>
            <Layout><AnnualReport /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/pv" element={
          <ProtectedRoute roles={['DIRECTEUR', 'ADMIN', 'CHEF_EQUIPE']}>
            <Layout><PV /></Layout>
          </ProtectedRoute>
        } />
        // Dans les routes :
        <Route path="/messages" element={
           <ProtectedRoute>
             <Layout><Messages /></Layout>
           </ProtectedRoute>
        } />


      </Routes>
    </BrowserRouter>
  )
}

export default App