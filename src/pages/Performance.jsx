import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Performance() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('signal_history') || '[]')
    setHistory(data)
  }, [])

  const buyCount = history.filter(h => h.signal?.action === 'BUY').length
  const stockFreq = history.reduce((acc, h) => {
    acc[h.stockId] = (acc[h.stockId] || { count: 0, name: h.name })
    acc[h.stockId].count++
    return acc
  }, {})
  const topStocks = Object.entries(stockFreq).sort((a, b) => b[1].count - a[1].count).slice(0, 5)

  function clearHistory() {
    if (confirm('確定要清除所有歷史紀錄？')) {
      localStorage.removeItem('signal_history')
      setHistory([])
    }
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
        <Link to="/" style={{ color: '#00d4aa', textDecoration: 'none' }}>首頁</Link>
        <span>/</span>
        <span>績效紀錄</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>歷史訊號紀錄</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{ fontSize: 12, color: '#ef4444', background: '#ef444418', border: '1px solid #ef444444', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
          >
            清除全部
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="總建議次數" value={history.length} color="#e2e8f0" />
        <StatCard label="BUY 訊號" value={buyCount} color="#22c55e" />
        <StatCard label="掃描天數" value={[...new Set(history.map(h => h.date))].length} color="#00d4aa" />
      </div>

      {/* Top stocks */}
      {topStocks.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>出現頻率 Top 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topStocks.map(([id, { count, name }]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to={`/stock/${id}`} style={{ color: '#00d4aa', textDecoration: 'none', fontSize: 14, minWidth: 100 }}>
                  {name} ({id})
                </Link>
                <div style={{ flex: 1, height: 6, background: '#30363d', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / history.length) * 100}%`, background: '#00d4aa', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', minWidth: 24 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>尚無歷史紀錄。回首頁掃描後會自動儲存 BUY 訊號。</div>
          <Link to="/" style={{ display: 'inline-block', marginTop: 16, color: '#00d4aa', textDecoration: 'none', fontSize: 14 }}>
            前往掃描 →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...history].reverse().map((h, i) => (
            <HistoryRow key={i} entry={h} />
          ))}
        </div>
      )}
    </main>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}

function HistoryRow({ entry }) {
  const s = entry.signal
  if (!s) return null
  return (
    <div className="card" style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '100px 1fr repeat(4, minmax(80px, auto)) 60px', gap: 12, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{entry.date}</span>
      <Link to={`/stock/${entry.stockId}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
        {entry.name} <span style={{ color: '#64748b', fontWeight: 400 }}>({entry.stockId})</span>
      </Link>
      <PriceCell label="進場" value={s.entry?.toFixed(2)} />
      <PriceCell label="停損" value={s.stopLoss?.toFixed(2)} color="#ef4444" />
      <PriceCell label="目標一" value={s.target1?.toFixed(2)} color="#22c55e" />
      <PriceCell label="R/R" value={`${s.rrRatio?.toFixed(1)}x`} color="#00d4aa" />
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>信心</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#00d4aa', fontFamily: 'monospace' }}>{s.confidence}</span>
      </div>
    </div>
  )
}

function PriceCell({ label, value, color = '#e2e8f0' }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color, fontFamily: 'monospace' }}>{value ?? '—'}</div>
    </div>
  )
}
