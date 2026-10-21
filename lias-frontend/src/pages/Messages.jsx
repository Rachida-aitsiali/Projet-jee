import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { getUser } from '../services/authService'

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}
function getInitials(firstName, lastName) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

const PURPLE = '#7c3aed'
const DARK   = '#2d1058'

export default function Messages() {
  const user                              = getUser()
  const [members, setMembers]             = useState([])
  const [teams, setTeams]                 = useState([])
  const [events, setEvents]               = useState([])
  const [currentMember, setCurrentMember] = useState(null)
  const [activeTab, setActiveTab]         = useState('all')
  const [activeChat, setActiveChat]       = useState(null)
  const [messages, setMessages]           = useState([])
  const [newMessage, setNewMessage]       = useState('')
  const [sending, setSending]             = useState(false)
  const [search, setSearch]               = useState('')
  const [previews, setPreviews]           = useState({})
  const [loadingChat, setLoadingChat]     = useState(false)
  const messagesEndRef                    = useRef(null)
  const textareaRef                       = useRef(null)
  const activeChatRef                     = useRef(null)

  useEffect(() => { activeChatRef.current = activeChat }, [activeChat])
  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Polling messages 3s ──
  useEffect(() => {
    if (!activeChat || !currentMember || loadingChat) return
    const poll = async () => {
      try {
        let res
        if (activeChat.type === 'direct')
          res = await api.get(`/messages/direct/${currentMember.id}/${activeChat.target.id}`)
        else if (activeChat.type === 'team')
          res = await api.get(`/messages/team/${activeChat.target.id}`)
        else
          res = await api.get(`/messages/event/${activeChat.target.id}`)
        setMessages(res.data)
      } catch {}
    }
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [activeChat?.type, activeChat?.target?.id, currentMember?.id, loadingChat])

  // ── Polling previews 8s séquentiel ──
  useEffect(() => {
    if (!currentMember || members.length === 0) return
    const pollPreviews = async () => {
      if (loadingChat) return
      const newPreviews = {}
      const otherMems = members.filter(m => m.id !== currentMember.id)
      for (const m of otherMems) {
        try {
          const res = await api.get(`/messages/direct/${currentMember.id}/${m.id}`)
          if (res.data && res.data.length > 0) {
            const last = res.data[res.data.length - 1]
            if (!last) continue
            const isActive = activeChatRef.current?.type === 'direct' &&
                             activeChatRef.current?.target?.id === m.id
            const unread = isActive ? 0 : res.data.filter(msg =>
              msg?.sender?.id !== currentMember.id && !msg?.read
            ).length
            newPreviews[m.id] = { last, unread }
          }
        } catch {}
      }
      setPreviews(newPreviews)
    }
    pollPreviews()
    const interval = setInterval(pollPreviews, 8000)
    return () => clearInterval(interval)
  }, [currentMember?.id, members.length])

  const fetchData = async () => {
    try {
      const [membersRes, teamsRes, eventsRes] = await Promise.all([
        api.get('/members'),
        api.get('/teams'),
        api.get('/events'),
      ])
      setMembers(membersRes.data)
      setTeams(teamsRes.data)
      setEvents(eventsRes.data)
      const found = membersRes.data.find(m =>
        m.firstName === user?.firstName && m.lastName === user?.lastName
      )
      setCurrentMember(found)
    } catch (err) { console.error(err) }
  }

  const openChat = async (type, target) => {
    setLoadingChat(true)
    setActiveChat({ type, target })
    setMessages([])
    if (type === 'direct') {
      setPreviews(prev => ({
        ...prev,
        [target.id]: { ...prev[target.id], unread: 0 }
      }))
    }
    try {
      let res
      if (type === 'direct')
        res = await api.get(`/messages/direct/${currentMember.id}/${target.id}`)
      else if (type === 'team')
        res = await api.get(`/messages/team/${target.id}`)
      else
        res = await api.get(`/messages/event/${target.id}`)
      setMessages(res.data || [])
      if (type === 'direct' && res.data) {
        const unreadMsgs = res.data.filter(msg =>
          msg?.sender?.id !== currentMember.id && !msg?.read
        )
        for (const msg of unreadMsgs) {
          api.put(`/messages/${msg.id}/read`).catch(() => {})
        }
      }
    } catch { setMessages([]) }
    finally {
      setLoadingChat(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentMember || sending) return
    setSending(true)
    const optimistic = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      sender: currentMember,
      createdAt: new Date().toISOString(),
      _sending: true
    }
    setMessages(prev => [...prev, optimistic])
    setNewMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try {
      let res
      if (activeChat.type === 'direct')
        res = await api.post('/messages/direct', { senderId: currentMember.id, receiverId: activeChat.target.id, content: optimistic.content })
      else if (activeChat.type === 'team')
        res = await api.post('/messages/team', { senderId: currentMember.id, teamId: activeChat.target.id, content: optimistic.content })
      else
        res = await api.post('/messages/event', { senderId: currentMember.id, eventId: activeChat.target.id, content: optimistic.content })
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m))
      if (activeChat.type === 'direct' && res.data) {
        setPreviews(prev => ({
          ...prev,
          [activeChat.target.id]: { last: res.data, unread: 0 }
        }))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally { setSending(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`)
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch {}
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const isMyMessage = (msg) => msg?.sender?.id === currentMember?.id

  const otherMembers = members.filter(m =>
    !(m.firstName === user?.firstName && m.lastName === user?.lastName)
  )

  // ── Protégé contre undefined ──
  const membersWithConv = otherMembers.filter(m => previews[m.id]?.last != null)
  const membersUnread   = membersWithConv.filter(m => (previews[m.id]?.unread || 0) > 0)
  const membersNoConv   = otherMembers.filter(m => previews[m.id]?.last == null)

  const sortByLastMsg = (arr) => [...arr].sort((a, b) => {
    const pa = previews[a.id]
    const pb = previews[b.id]
    if (!pa?.last && !pb?.last) return 0
    if (!pa?.last) return 1
    if (!pb?.last) return -1
    try {
      return new Date(pb.last.createdAt) - new Date(pa.last.createdAt)
    } catch { return 0 }
  })

  const totalUnread = Object.values(previews).reduce((s, p) => s + (p?.unread || 0), 0)

  const getFilteredMembers = () => {
    let base = otherMembers
    if (activeTab === 'unread') base = membersUnread
    else if (activeTab === 'conv') base = membersWithConv
    return sortByLastMsg(base).filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
    )
  }

  const filteredMembers = getFilteredMembers()
  const filteredTeams   = teams.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()))
  const filteredEvents  = events.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()))

  const Avatar = ({ firstName, lastName, photo, size = 40 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg,${PURPLE},#4c1d95)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size * 0.35, fontWeight: '800' }}>
      {photo
        ? <img src={photo.startsWith('http') ? photo : `http://localhost:8081${photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'}/>
        : getInitials(firstName, lastName)}
    </div>
  )

  const chatName = activeChat
    ? activeChat.type === 'direct'
      ? `${activeChat.target.firstName} ${activeChat.target.lastName}`
      : activeChat.target.name || activeChat.target.title
    : ''
  const chatSub = activeChat
    ? activeChat.type === 'direct'  ? activeChat.target.status
    : activeChat.type === 'team'    ? `${activeChat.target.members?.length || 0} membres`
    : activeChat.target.type || 'Événement'
    : ''

  function renderMemberItem(member) {
    const isActive  = activeChat?.target?.id === member.id && activeChat?.type === 'direct'
    const preview   = previews[member.id]
    const hasUnread = (preview?.unread || 0) > 0

    return (
      <div key={member.id} className="chat-item"
        onClick={() => openChat('direct', member)}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(124,58,237,0.04)', background: isActive ? 'rgba(124,58,237,0.08)' : hasUnread ? 'rgba(220,38,38,0.03)' : 'transparent', borderLeft: isActive ? `3px solid ${PURPLE}` : hasUnread ? '3px solid #dc2626' : '3px solid transparent' }}>
        <div style={{ position: 'relative' }}>
          <Avatar firstName={member.firstName} lastName={member.lastName} photo={member.photo} size={40} />
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#059669', border: '2px solid white' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
            <div style={{ fontSize: '13px', fontWeight: hasUnread ? '800' : isActive ? '700' : '600', color: isActive ? PURPLE : hasUnread ? '#1e293b' : DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {member.firstName} {member.lastName}
            </div>
            {preview?.last?.createdAt && (
              <span style={{ fontSize: '10px', color: hasUnread ? '#dc2626' : '#94a3b8', fontWeight: hasUnread ? '700' : '400', flexShrink: 0 }}>
                {formatTime(preview.last.createdAt)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '11px', color: hasUnread ? '#dc2626' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontWeight: hasUnread ? '600' : '400' }}>
              {preview?.last?.content
                ? (preview.last.sender?.id === currentMember?.id ? 'Vous : ' : '') + preview.last.content
                : <span style={{ color: '#c4b5fd', fontStyle: 'italic' }}>{member.status}</span>}
            </div>
            {hasUnread && (
              <span style={{ background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: '800', minWidth: '18px', height: '18px', borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                {preview.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .chat-item { transition:background 0.15s; }
        .chat-item:hover { background:rgba(124,58,237,0.06) !important; }
        .del-btn { opacity:0 !important; transition:opacity 0.15s; }
        .msg-wrap:hover .del-btn { opacity:1 !important; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.2); border-radius:99px; }
      `}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: '300px', background: 'white', borderRight: '1px solid rgba(124,58,237,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '2px 0 12px rgba(124,58,237,0.06)' }}>

        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: DARK, letterSpacing: '-0.5px', margin: 0 }}>Messages</h2>
            {totalUnread > 0 && (
              <span style={{ background: `linear-gradient(135deg,${PURPLE},#6d28d9)`, color: 'white', fontSize: '11px', fontWeight: '800', minWidth: '20px', height: '20px', borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', animation: 'pulse 2s infinite' }}>
                {totalUnread}
              </span>
            )}
          </div>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{ width: '100%', padding: '7px 10px 7px 28px', border: '1.5px solid rgba(124,58,237,0.15)', borderRadius: '8px', fontSize: '12px', outline: 'none', background: '#faf8ff', color: DARK, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = PURPLE}
              onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.15)'} />
          </div>

          {/* Filtres rapides */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'all',    label: 'Tous',          count: otherMembers.length },
              { key: 'unread', label: 'Non lus',       count: membersUnread.length, red: true },
              { key: 'conv',   label: 'Conversations', count: membersWithConv.length },
            ].map(f => (
              <button key={f.key} onClick={() => setActiveTab(f.key)}
                style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
                  border: `1px solid ${activeTab === f.key ? (f.red ? '#dc2626' : PURPLE) : 'rgba(124,58,237,0.15)'}`,
                  background: activeTab === f.key ? (f.red ? '#fef2f2' : PURPLE) : 'transparent',
                  color: activeTab === f.key ? (f.red ? '#dc2626' : 'white') : '#94a3b8'
                }}>
                {f.label}
                {f.count > 0 && (
                  <span style={{ fontSize: '10px', background: activeTab === f.key ? 'rgba(255,255,255,0.25)' : '#f0eeff', color: activeTab === f.key ? (f.red ? '#dc2626' : 'white') : PURPLE, padding: '1px 5px', borderRadius: '99px', fontWeight: '800' }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs type */}
        <div style={{ display: 'flex', background: '#f5f3ff', margin: '8px', borderRadius: '8px', padding: '3px' }}>
          {[
            { key: 'members', label: 'Membres' },
            { key: 'teams',   label: 'Équipes' },
            { key: 'events',  label: 'Événements' },
          ].map(tab => {
            const isActive = (tab.key === 'members' && ['all','unread','conv'].includes(activeTab)) || activeTab === tab.key
            return (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key === 'members' ? 'all' : tab.key)}
                style={{ flex: 1, padding: '5px 4px', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? 'white' : 'transparent',
                  color:      isActive ? PURPLE   : '#94a3b8',
                  boxShadow:  isActive ? '0 2px 8px rgba(124,58,237,0.15)' : 'none' }}>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Membres ── */}
          {['all','unread','conv'].includes(activeTab) && (
            <>
              {/* Non lus en haut */}
              {activeTab === 'all' && membersUnread.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px 4px', fontSize: '10px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
                    Non lus ({membersUnread.length})
                  </div>
                  {sortByLastMsg(membersUnread)
                    .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()))
                    .map(m => renderMemberItem(m))}
                  <div style={{ height: '1px', background: 'rgba(124,58,237,0.08)', margin: '8px 0' }} />
                </>
              )}

              {/* Récents */}
              {activeTab === 'all' && sortByLastMsg(membersWithConv.filter(m => (previews[m.id]?.unread || 0) === 0))
                .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                <>
                  <div style={{ padding: '8px 16px 4px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Récents
                  </div>
                  {sortByLastMsg(membersWithConv.filter(m => (previews[m.id]?.unread || 0) === 0))
                    .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()))
                    .map(m => renderMemberItem(m))}
                  {membersNoConv.length > 0 && <div style={{ height: '1px', background: 'rgba(124,58,237,0.08)', margin: '8px 0' }} />}
                </>
              )}

              {/* Autres membres sans conv */}
              {activeTab === 'all' && membersNoConv
                .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                <>
                  <div style={{ padding: '8px 16px 4px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Membres
                  </div>
                  {membersNoConv
                    .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()))
                    .map(m => renderMemberItem(m))}
                </>
              )}

              {/* Vue Non lus */}
              {activeTab === 'unread' && (
                filteredMembers.length === 0
                  ? <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>Tout est lu !</div>
                    </div>
                  : filteredMembers.map(m => renderMemberItem(m))
              )}

              {/* Vue Conversations */}
              {activeTab === 'conv' && (
                filteredMembers.length === 0
                  ? <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Aucune conversation</div>
                  : filteredMembers.map(m => renderMemberItem(m))
              )}
            </>
          )}

          {/* ── Équipes ── */}
          {activeTab === 'teams' && (
            filteredTeams.length === 0
              ? <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Aucune équipe</div>
              : filteredTeams.map(team => {
                const isActive = activeChat?.target?.id === team.id && activeChat?.type === 'team'
                return (
                  <div key={team.id} className="chat-item"
                    onClick={() => openChat('team', team)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(124,58,237,0.04)', background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent', borderLeft: isActive ? `3px solid ${PURPLE}` : '3px solid transparent' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isActive ? `linear-gradient(135deg,${PURPLE},#4c1d95)` : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? 'white' : PURPLE} strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '600', color: isActive ? PURPLE : DARK }}>{team.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{team.members?.length || 0} membres</div>
                    </div>
                  </div>
                )
              })
          )}

          {/* ── Événements ── */}
          {activeTab === 'events' && (
            filteredEvents.length === 0
              ? <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Aucun événement</div>
              : filteredEvents.map(event => {
                const isActive = activeChat?.target?.id === event.id && activeChat?.type === 'event'
                return (
                  <div key={event.id} className="chat-item"
                    onClick={() => openChat('event', event)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(124,58,237,0.04)', background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent', borderLeft: isActive ? `3px solid ${PURPLE}` : '3px solid transparent' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isActive ? 'linear-gradient(135deg,#059669,#065f46)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? 'white' : '#059669'} strokeWidth="2">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: isActive ? '700' : '600', color: isActive ? PURPLE : DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{event.type}</div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* ── Zone chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,58,237,0.12)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: DARK, marginBottom: '6px' }}>Sélectionnez une conversation</p>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Choisissez un membre, une équipe ou un événement</p>
            </div>
            {totalUnread > 0 && (
              <button onClick={() => setActiveTab('unread')}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
                {totalUnread} message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''} — Voir
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid rgba(124,58,237,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
              {activeChat.type === 'direct' ? (
                <div style={{ position: 'relative' }}>
                  <Avatar firstName={activeChat.target.firstName} lastName={activeChat.target.lastName} photo={activeChat.target.photo} size={40} />
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#059669', border: '2px solid white' }} />
                </div>
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg,${PURPLE},#4c1d95)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    {activeChat.type === 'team'
                      ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
                      : <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>}
                  </svg>
                </div>
              )}
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: DARK }}>{chatName}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{chatSub}</div>
              </div>
            </div>

            {/* Spinner ou messages */}
            {loadingChat ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7ff' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Chargement...</span>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8f7ff' }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#c4b5fd' }}>Aucun message</p>
                    <p style={{ fontSize: '12px', color: '#d8b4fe', marginTop: '4px' }}>Soyez le premier à écrire !</p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  if (!msg) return null
                  const mine        = isMyMessage(msg)
                  const prevMsg     = messages[i - 1]
                  const showDate    = i === 0 || formatDate(msg.createdAt) !== formatDate(prevMsg?.createdAt)
                  const showAvatar  = !mine && (i === 0 || messages[i-1]?.sender?.id !== msg.sender?.id || showDate)
                  const isSameGroup = i > 0 && messages[i-1]?.sender?.id === msg.sender?.id && !showDate

                  return (
                    <div key={msg.id || i}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', background: 'white', padding: '4px 14px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.1)', fontWeight: '600' }}>
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className="msg-wrap"
                        style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', marginTop: isSameGroup ? '2px' : '10px', animation: 'fadeUp 0.2s ease-out' }}>
                        {!mine && (
                          <div style={{ width: '32px', flexShrink: 0 }}>
                            {showAvatar
                              ? <Avatar firstName={msg.sender?.firstName} lastName={msg.sender?.lastName} photo={msg.sender?.photo} size={32} />
                              : <div style={{ width: 32 }} />}
                          </div>
                        )}
                        <div style={{ maxWidth: '62%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          {!mine && showAvatar && (
                            <span style={{ fontSize: '11px', color: PURPLE, fontWeight: '700', marginBottom: '4px', paddingLeft: '4px' }}>
                              {msg.sender?.firstName} {msg.sender?.lastName}
                            </span>
                          )}
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', flexDirection: mine ? 'row-reverse' : 'row' }}>
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              background: mine ? (msg._sending ? '#c4b5fd' : `linear-gradient(135deg,${PURPLE},#6d28d9)`) : 'white',
                              color: mine ? 'white' : DARK,
                              fontSize: '14px', lineHeight: '1.55',
                              border: mine ? 'none' : '1px solid rgba(124,58,237,0.1)',
                              boxShadow: mine ? '0 4px 12px rgba(124,58,237,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                              wordBreak: 'break-word', animation: 'popIn 0.2s ease-out',
                              opacity: msg._sending ? 0.7 : 1,
                            }}>
                              {msg.content}
                            </div>
                            {mine && !msg._sending && (
                              <button className="del-btn" onClick={() => handleDelete(msg.id)}
                                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                </svg>
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', paddingLeft: mine ? 0 : '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {formatTime(msg.createdAt)}
                            {mine && !msg._sending && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                            {mine && msg._sending && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Zone saisie */}
            <div style={{ background: 'white', borderTop: '1px solid rgba(124,58,237,0.08)', padding: '14px 20px', boxShadow: '0 -2px 12px rgba(124,58,237,0.06)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#faf8ff', borderRadius: '14px', border: '1.5px solid rgba(124,58,237,0.2)', padding: '10px 14px' }}>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => {
                    setNewMessage(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message..."
                  rows={1}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: DARK, resize: 'none', fontFamily: 'Inter,sans-serif', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto' }}
                />
                <button onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', background: !newMessage.trim() ? '#ede9fe' : `linear-gradient(135deg,${PURPLE},#6d28d9)`, color: !newMessage.trim() ? '#c4b5fd' : 'white', cursor: !newMessage.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: newMessage.trim() ? '0 4px 12px rgba(124,58,237,0.3)' : 'none' }}>
                  {sending
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}