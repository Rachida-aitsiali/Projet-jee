import { useState, useEffect } from 'react'
import api from '../services/api'

const YEAR = new Date().getFullYear()

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px', padding: '0 4px' }}>
      {data.map((d, i) => {
        const pct = max > 0 ? Math.max((d.value / max) * 100, d.value > 0 ? 6 : 0) : 0
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: d.value > 0 ? color : '#c4b5fd' }}>
              {d.value > 0 ? d.value : ''}
            </span>
            <div style={{ width: '100%', height: '90px', display: 'flex', alignItems: 'flex-end', background: `${color}12`, borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
              <div style={{
                width: '100%', borderRadius: '6px 6px 0 0',
                background: `linear-gradient(180deg,${color},${color}66)`,
                height: `${pct}%`,
                transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: d.value > 0 ? `0 -3px 12px ${color}44` : 'none'
              }} />
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ value, max, color, label }) {
  const pct  = max > 0 ? Math.min(value / max, 1) : 0
  const r    = 36
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: '90px', height: '90px' }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={r} fill="none" stroke={`${color}18`} strokeWidth="10"/>
          <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: '900', color, lineHeight: 1 }}>{value}</span>
        </div>
      </div>
      <span style={{ fontSize: '11px', fontWeight: '700', color: '#2d1058', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

export default function AnnualReport() {
  const [year, setYear]           = useState(YEAR)
  const [inputYear, setInputYear] = useState(String(YEAR))
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { fetchData() }, [year])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [membersRes, pubsRes, eventsRes, docsRes] = await Promise.all([
        api.get('/members').catch(()     => ({ data: [] })),
        api.get('/publications').catch(() => ({ data: [] })),
        api.get('/events').catch(()     => ({ data: [] })),
        api.get('/documents').catch(()  => ({ data: [] })),
      ])

      const members      = membersRes.data
      const publications = pubsRes.data
      const events       = eventsRes.data
      const documents    = docsRes.data

      const yearPubs   = publications.filter(p => parseInt(p.year) === year)
      const yearEvents = events.filter(e => e.startDate?.startsWith(String(year)))
      const yearDocs   = documents.filter(d => d.createdAt?.startsWith(String(year)))

      const pubByType = [
        { label: 'Articles',    value: yearPubs.filter(p => p.type === 'Article'    || p.type === 'ARTICLE').length },
        { label: 'Conférences', value: yearPubs.filter(p => p.type === 'Conférence' || p.type === 'CONFERENCE').length },
        { label: 'Thèses',      value: yearPubs.filter(p => p.type === 'Thèse'      || p.type === 'THESE').length },
        { label: 'Rapports',    value: yearPubs.filter(p => p.type === 'Rapport'    || p.type === 'RAPPORT').length },
      ]

      const evByType = [
        { label: 'Conférences', value: yearEvents.filter(e => e.type === 'CONFERENCE').length },
        { label: 'Séminaires',  value: yearEvents.filter(e => e.type === 'SEMINAIRE').length },
        { label: 'Workshops',   value: yearEvents.filter(e => e.type === 'WORKSHOP').length },
      ]

      const membersByStatus = [
        { label: 'Permanents', value: members.filter(m => m.status === 'PERMANENT').length, color: '#7c3aed' },
        { label: 'Doctorants', value: members.filter(m => m.status === 'DOCTORANT').length, color: '#2563eb' },
        { label: 'Associés',   value: members.filter(m => m.status === 'ASSOCIE').length,   color: '#d97706' },
        { label: 'Retraités',  value: members.filter(m => m.status === 'RETRAITE').length,  color: '#64748b' },
      ]

      const activeMembers = members.filter(m => m.status !== 'ANCIEN' && m.status !== 'RETRAITE').length

      setData({ members, publications, events, documents, yearPubs, yearEvents, yearDocs, pubByType, evByType, membersByStatus, activeMembers })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleYearInput = (e) => {
    const v = e.target.value
    setInputYear(v)
    if (/^\d{4}$/.test(v)) setYear(parseInt(v))
  }

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => { window.print(); setExporting(false) }, 300)
  }

  if (loading) return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#7c3aed', fontSize: '14px', fontWeight: '600' }}>
      Génération du rapport {year}...
    </div>
  )

  const highlights = [
    {
      color: '#7c3aed',
      title: 'Publications scientifiques',
      value: data?.yearPubs?.length ?? 0,
      unit: 'publication' + ((data?.yearPubs?.length ?? 0) !== 1 ? 's' : ''),
      detail: data?.yearPubs?.length > 0
        ? `dont ${data.yearPubs.filter(p => p.type === 'Article' || p.type === 'ARTICLE').length} articles · ${data.yearPubs.filter(p => p.type === 'Conférence' || p.type === 'CONFERENCE').length} conférences`
        : null,
    },
    {
      color: '#059669',
      title: 'Événements scientifiques',
      value: data?.yearEvents?.length ?? 0,
      unit: 'événement' + ((data?.yearEvents?.length ?? 0) !== 1 ? 's' : ''),
      detail: data?.yearEvents?.length > 0
        ? `${data.yearEvents.filter(e => e.type === 'CONFERENCE').length} conf. · ${data.yearEvents.filter(e => e.type === 'SEMINAIRE').length} sém. · ${data.yearEvents.filter(e => e.type === 'WORKSHOP').length} workshops`
        : null,
    },
    {
      color: '#2563eb',
      title: 'Membres du laboratoire',
      value: data?.activeMembers ?? 0,
      unit: 'membre' + ((data?.activeMembers ?? 0) !== 1 ? 's' : '') + ' actif' + ((data?.activeMembers ?? 0) !== 1 ? 's' : ''),
      detail: `${data?.membersByStatus?.[1]?.value ?? 0} doctorant${(data?.membersByStatus?.[1]?.value ?? 0) !== 1 ? 's' : ''} · ${data?.membersByStatus?.[2]?.value ?? 0} associé${(data?.membersByStatus?.[2]?.value ?? 0) !== 1 ? 's' : ''}`,
    },
    {
      color: '#d97706',
      title: 'Archivage documentaire',
      value: data?.yearDocs?.length ?? 0,
      unit: 'document' + ((data?.yearDocs?.length ?? 0) !== 1 ? 's' : '') + ' archivé' + ((data?.yearDocs?.length ?? 0) !== 1 ? 's' : ''),
      detail: `${data?.documents?.length ?? 0} documents au total dans le système`,
    },
  ]

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter","Segoe UI",sans-serif', background: '#f8f7ff', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @media print {
          body { background:white !important; }
          .no-print { display:none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', animation: 'fadeUp 0.4s ease-out' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d1058', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            Rapport d'activité annuel
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Laboratoire LIAS — FSBM Hassan II · Casablanca</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="no-print">
          <input
            type="number" value={inputYear}
            onChange={handleYearInput}
            min="2000" max="2100"
            style={{ width: '90px', padding: '9px 12px', border: '1.5px solid rgba(124,58,237,0.3)', borderRadius: '8px', fontSize: '14px', fontWeight: '700', outline: 'none', background: 'white', color: '#2d1058', textAlign: 'center' }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.3)'}
          />
          <button onClick={handleExport} disabled={exporting}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Export...' : 'Exporter PDF'}
          </button>
        </div>
      </div>

      {/* ── Hero — chiffres clés ── */}
      <div style={{ background: 'linear-gradient(135deg,#120830,#2d1058,#4c1d95)', borderRadius: '20px', padding: '32px 36px', marginBottom: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', right: 100, bottom: -40, width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', filter: 'blur(30px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
            Rapport d'activité
          </div>
          <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px', background: 'linear-gradient(135deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {year}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '28px' }}>
            Laboratoire d'Intelligence Artificielle et Systèmes · FSBM · Université Hassan II
          </div>
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            {[
              { val: data?.activeMembers ?? 0,     label: 'Membres actifs'    },
              { val: data?.yearPubs?.length ?? 0,   label: 'Publications'      },
              { val: data?.yearEvents?.length ?? 0, label: 'Événements'        },
              { val: data?.yearDocs?.length ?? 0,   label: 'Documents archivés'},
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none', padding: '0 16px' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', lineHeight: 1, marginBottom: '4px', color: i === 0 ? '#a78bfa' : 'white' }}>{s.val}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Graphiques ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '2px' }}>Publications par type</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '18px' }}>Année {year}</div>
          <BarChart data={data?.pubByType || []} color="#7c3aed" />
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '2px' }}>Événements par type</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '18px' }}>Année {year}</div>
          <BarChart data={data?.evByType || []} color="#059669" />
        </div>
      </div>

      {/* ── Membres + Faits marquants ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Répartition membres */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '2px' }}>Répartition des membres</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '20px' }}>Par statut · {data?.activeMembers ?? 0} actifs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
            {(data?.membersByStatus || []).map((s, i) => (
              <DonutChart key={i} value={s.value} max={data?.activeMembers || 1} color={s.color} label={s.label} />
            ))}
          </div>
        </div>

        {/* Faits marquants */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '2px' }}>Faits marquants</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '20px' }}>Bilan de l'année {year}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {highlights.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 0',
                borderBottom: i < highlights.length - 1 ? '1px solid #f0eeff' : 'none',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${h.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '13px', fontWeight: '900', color: h.color
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                    {h.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.detail
                      ? h.detail
                      : <span style={{ color: '#c4b5fd', fontStyle: 'italic', fontWeight: '400' }}>Aucun enregistrement</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: h.color, lineHeight: 1 }}>{h.value}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{h.unit}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '2px solid #f0eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Données extraites automatiquement</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed' }}>
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Publications de l'année ── */}
      {(data?.yearPubs?.length ?? 0) > 0 && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 2px 8px rgba(124,58,237,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid #f0eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Publications {year}
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', background: '#f5f3ff', padding: '3px 10px', borderRadius: '20px' }}>{data.yearPubs.length} au total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.yearPubs.slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: '#faf8ff', border: '1px solid rgba(124,58,237,0.06)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>{p.type}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1058', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                  {p.authors?.[0] ? `${p.authors[0].firstName} ${p.authors[0].lastName}` : ''}
                </span>
              </div>
            ))}
            {data.yearPubs.length > 5 && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '6px' }}>
                + {data.yearPubs.length - 5} autre{data.yearPubs.length - 5 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Événements de l'année ── */}
      {(data?.yearEvents?.length ?? 0) > 0 && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid rgba(124,58,237,0.08)', boxShadow: '0 2px 8px rgba(124,58,237,0.06)', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#2d1058', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid #f0eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Événements {year}
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: '20px' }}>{data.yearEvents.length} événements</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.yearEvents.slice(0, 5).map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid rgba(5,150,105,0.08)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>
                  {e.type === 'CONFERENCE' ? 'Conf.' : e.type === 'SEMINAIRE' ? 'Sém.' : 'Work.'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d1058', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{formatDate(e.startDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pied de page ── */}
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#94a3b8', padding: '16px 0', borderTop: '1px solid rgba(124,58,237,0.08)' }}>
        Rapport généré automatiquement · Laboratoire LIAS · FSBM Hassan II · {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}