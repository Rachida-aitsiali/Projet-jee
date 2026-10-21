export default function Pagination({ total, page, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const pages = Array.from({length: totalPages}, (_, i) => i+1)
    .filter(p => p===1 || p===totalPages || Math.abs(p-page)<=1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx-1] > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', background:'white', borderTop:'1px solid #e2e8f0'}}>
      <p style={{fontSize:'13px', color:'#64748b', margin:0}}>
        Affichage {Math.min((page-1)*perPage+1, total)}–{Math.min(page*perPage, total)} sur <strong>{total}</strong>
      </p>
      <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
        <button onClick={() => onPage(page-1)} disabled={page===1}
          style={{padding:'6px 14px', border:'1.5px solid #e2e8f0', borderRadius:'6px', fontSize:'13px', fontWeight:'600', cursor:page===1?'not-allowed':'pointer', background:page===1?'#f8fafc':'white', color:page===1?'#94a3b8':'#374151'}}>
          ← Précédent
        </button>
        {pages.map((p, i) => p === '...' ? (
          <span key={i} style={{padding:'6px 8px', color:'#94a3b8', fontSize:'13px'}}>...</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            style={{padding:'6px 12px', border:`1.5px solid ${p===page?'#2563eb':'#e2e8f0'}`, borderRadius:'6px', fontSize:'13px', fontWeight:'600', cursor:'pointer', background:p===page?'#2563eb':'white', color:p===page?'white':'#374151'}}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page+1)} disabled={page===totalPages}
          style={{padding:'6px 14px', border:'1.5px solid #e2e8f0', borderRadius:'6px', fontSize:'13px', fontWeight:'600', cursor:page===totalPages?'not-allowed':'pointer', background:page===totalPages?'#f8fafc':'white', color:page===totalPages?'#94a3b8':'#374151'}}>
          Suivant →
        </button>
      </div>
    </div>
  )
}