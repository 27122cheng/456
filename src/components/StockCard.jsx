import { useNavigate } from 'react-router-dom'

export default function StockCard({ stock }) {
  const navigate = useNavigate()
  const { id, name, history, signal } = stock

  const latest = history?.[history.length - 1]
  const prev = history?.[history.length - 2]
  const close = latest?.close
  const change = close && prev?.close ? close - prev.close : null
  const changePct = change && prev?.close ? (change / prev.close) * 100 : null
  const isUp = change > 0
  const priceColor = change === null ? '#94a3b8' : isUp ? '#22c55e' : '#ef4444'

  const actionColor = signal?.action === 'BUY' ? '#22c55e' : '#64748b'

  return (
    <div
      onClick={() => navigate(`/stock/${id}`)}
      className="card"
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        borderColor: signal?.action === 'BUY' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#00d4aa55'}
      onMouseLeave={e => e.currentTarget.style.borderColor = signal?.action === 'BUY' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{id}</div>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: actionColor,
          background: `${actionColor}18`,
          border: `1px solid ${actionColor}44`,
          borderRadius: 6,
          padding: '2px 8px',
        }}>
          {signal?.action ?? '—'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: priceColor, fontFamily: 'monospace' }}>
            {close != null ? close.toFixed(2) : '載入中…'}
          </div>
          {changePct != null && (
            <div style={{ fontSize: 12, color: priceColor, marginTop: 2 }}>
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%)
            </div>
          )}
        </div>
        {signal && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>信心</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#00d4aa', fontFamily: 'monospace' }}>
              {signal.confidence}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
