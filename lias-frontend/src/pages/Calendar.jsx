import { useState, useEffect } from 'react'
import eventService from '../services/eventService'

const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const typeColor = {
  CONFERENCE: '#7c3aed',
  SEMINAIRE:  '#059669',
  WORKSHOP:   '#d97706',
}
const typeBg = {
  CONFERENCE: '#f5f3ff',
  SEMINAIRE:  '#ecfdf5',
  WORKSHOP:   '#fffbeb',
}
const typeLabel = {
  CONFERENCE: 'Conférence',
  SEMINAIRE:  'Séminaire',
  WORKSHOP:   'Workshop',
}

function formatDateFr(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function Calendar() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    eventService.getEvents()
      .then(res => setEvents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const year     = currentDate.getFullYear()
  const month    = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = firstDay === 0 ? 6 : firstDay - 1

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return events.filter(e => {
      if (!e.startDate) return false
      if (!e.endDate || e.endDate === e.startDate) return e.startDate === dateStr
      return e.startDate <= dateStr && dateStr <= e.endDate
    })
  }

  const todayStr = today.toISOString().split('T')[0]
  const upcoming = [...events]
    .filter(e => e.startDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 8)

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .day-cell:hover { background: #f5f3ff !important; border-color: #a78bfa !important; }
        .day-cell { transition: all 0.15s; }
        .upcoming-item:hover { background: #f5f3ff !important; }
        .upcoming-item { transition: background 0.15s; }
        .nav-btn:hover { background: rgba(167,139,250,0.25) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', marginBottom: '4px', letterSpacing: '-0.5px' }}>Calendrier</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Événements et réunions du laboratoire</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* ── Calendrier ── */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(124,58,237,0.08)', minWidth: 0 }}>
          {/* Header mois */}
          <div style={{ background: 'linear-gradient(135deg,#2d1058,#7c3aed)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <button className="nav-btn"
              onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null) }}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              ‹
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>{MONTHS[month]} {year}</h2>
            <button className="nav-btn"
              onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null) }}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              ›
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Jours de la semaine */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '4px', marginBottom: '6px' }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#7c3aed', padding: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
              ))}
            </div>

            {/* Grille jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '4px' }}>
              {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDay(day)
                const today_   = isToday(day)
                const selected = selectedDay === day
                return (
                  <div key={day} className="day-cell"
                    onClick={() => setSelectedDay(selected ? null : day)}
                    style={{
                      minHeight: '64px', padding: '6px', borderRadius: '10px',
                      minWidth: 0,
                      overflow: 'hidden',
                      border: `1.5px solid ${selected ? '#7c3aed' : today_ ? '#a78bfa' : 'rgba(124,58,237,0.08)'}`,
                      background: selected ? '#f5f3ff' : today_ ? '#faf8ff' : 'white',
                      cursor: 'pointer',
                    }}>
                    <div style={{
                      fontSize: '13px', fontWeight: today_ ? '800' : '500',
                      color: today_ ? 'white' : selected ? '#7c3aed' : '#2d1058',
                      marginBottom: '4px',
                      width: today_ ? '24px' : 'auto', height: today_ ? '24px' : 'auto',
                      background: today_ ? '#7c3aed' : 'transparent',
                      borderRadius: today_ ? '50%' : '0',
                      display: 'flex', alignItems: 'center', justifyContent: today_ ? 'center' : 'flex-start',
                    }}>{day}</div>
                    {dayEvents.slice(0, 2).map((e, j) => (
                      <div key={j} style={{
                        fontSize: '9px', fontWeight: '600',
                        background: typeColor[e.type] || '#7c3aed',
                        color: 'white', padding: '2px 5px', borderRadius: '4px',
                        marginBottom: '2px', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '9px', color: '#7c3aed', fontWeight: '700' }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Détail jour sélectionné */}
          {selectedDay && (
            <div style={{ margin: '0 20px 20px', background: '#faf8ff', borderRadius: '10px', padding: '14px', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                {selectedDay} {MONTHS[month]} {year}
              </div>
              {selectedEvents.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Aucun événement ce jour</p>
              ) : selectedEvents.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < selectedEvents.length - 1 ? '1px solid #f0eeff' : 'none' }}>
                  <div style={{ width: '4px', borderRadius: '4px', alignSelf: 'stretch', background: typeColor[e.type] || '#7c3aed', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#2d1058' }}>{e.title}</div>
                    <div style={{ fontSize: '11px', color: typeColor[e.type] || '#7c3aed', fontWeight: '600', marginTop: '2px' }}>{typeLabel[e.type] || e.type}</div>
                    {e.location && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{e.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Prochains événements (vrais données API) ── */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.1)', padding: '20px', boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #f0eeff', letterSpacing: '-0.3px' }}>
            Prochains événements
          </h3>

          {loading ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>
          ) : upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Aucun événement à venir</p>
            </div>
          ) : upcoming.map((e, i) => (
            <div key={e.id} className="upcoming-item"
              onClick={() => {
                const d = new Date(e.startDate)
                setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
                setSelectedDay(d.getDate())
              }}
              style={{ padding: '12px', borderRadius: '10px', marginBottom: '8px', borderLeft: `4px solid ${typeColor[e.type] || '#7c3aed'}`, background: '#faf8ff', cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#2d1058', marginBottom: '4px' }}>{e.title}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                {formatDateFr(e.startDate)}
                {e.endDate && e.endDate !== e.startDate && ` → ${formatDateFr(e.endDate)}`}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: typeColor[e.type] || '#7c3aed', background: typeBg[e.type] || '#f5f3ff', padding: '2px 8px', borderRadius: '20px' }}>
                  {typeLabel[e.type] || e.type}
                </span>
                {e.location && (
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{e.location}</span>
                )}
              </div>
            </div>
          ))}

          {/* Légende */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f0eeff' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Légende</div>
            {Object.entries(typeLabel).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: typeColor[key], flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}