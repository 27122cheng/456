export default function SignalBox({ signal, stockName }) {
  if (!signal) return null

  const isBuy = signal.action === 'BUY'
  const actionColor = isBuy ? '#22c55e' : '#64748b'

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
          {stockName ? `${stockName} — ` : ''}交易訊號
        </span>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: actionColor,
          background: `${actionColor}18`,
          border: `1px solid ${actionColor}44`,
          borderRadius: 8,
          padding: '4px 16px',
          letterSpacing: 1,
        }}>
          {isBuy ? '✦ BUY' : '◎ HOLD'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <PriceRow label="進場價" value={signal.entry?.toFixed(2)} color="#e2e8f0" />
        <PriceRow label="停損" value={signal.stopLoss?.toFixed(2)} color="#ef4444" />
        <PriceRow label="目標一" value={signal.target1?.toFixed(2)} color="#22c55e" />
        <PriceRow label="目標二" value={signal.target2?.toFixed(2)} color="#00d4aa" />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#0d1117', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>R/R 比率</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4aa', fontFamily: 'monospace' }}>
            {signal.rrRatio?.toFixed(1)}x
          </div>
        </div>
        <div style={{ flex: 1, background: '#0d1117', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>信心分數</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: '#30363d', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${signal.confidence}%`,
                background: signal.confidence >= 70 ? '#22c55e' : signal.confidence >= 55 ? '#f59e0b' : '#64748b',
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace', minWidth: 32 }}>
              {signal.confidence}
            </span>
          </div>
        </div>
      </div>

      {signal.reasons.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>成立條件</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {signal.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#22c55e', fontSize: 10 }}>✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PriceRow({ label, value, color }) {
  return (
    <div style={{ background: '#0d1117', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'monospace' }}>{value ?? '—'}</div>
    </div>
  )
}
