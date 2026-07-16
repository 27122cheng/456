import { useState, useEffect } from 'react'
import { STOCKS } from '../App.jsx'
import { fetchStockHistory, fetchMarketIndex, fetchInstitutional } from '../utils/fetchData.js'
import { generateSignal } from '../utils/signals.js'
import StockCard from '../components/StockCard.jsx'
import SignalBox from '../components/SignalBox.jsx'

function IndexCard({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="card" style={{ padding: '16px 20px', minWidth: 200 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>加權指數 TWII</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8' }}>載入中…</div>
      </div>
    )
  }
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const change = latest.close - prev.close
  const changePct = (change / prev.close) * 100
  const isUp = change >= 0
  const color = isUp ? '#22c55e' : '#ef4444'

  return (
    <div className="card" style={{ padding: '16px 20px', minWidth: 220 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>加權指數 TWII</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: 'monospace' }}>
        {latest.close.toLocaleString()}
      </div>
      <div style={{ fontSize: 13, color, marginTop: 4 }}>
        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%)
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{latest.time}</div>
    </div>
  )
}

export default function Home() {
  const [indexData, setIndexData] = useState([])
  const [stockResults, setStockResults] = useState([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      const idx = await fetchMarketIndex()
      if (!cancelled) setIndexData(idx || [])

      const results = []
      for (const stock of STOCKS) {
        if (cancelled) break
        const [history, inst] = await Promise.all([
          fetchStockHistory(stock.id),
          fetchInstitutional(stock.id),
        ])
        const signal = history?.length >= 60 ? generateSignal(history, inst) : null
        results.push({ ...stock, history: history || [], inst, signal })
        if (!cancelled) {
          setStockResults([...results])
          setLoadedCount(results.length)
        }
      }

      if (!cancelled) {
        setLoading(false)
        const buySignals = results.filter(s => s.signal?.action === 'BUY')
        if (buySignals.length > 0) {
          const prev = JSON.parse(localStorage.getItem('signal_history') || '[]')
          const today = new Date().toISOString().slice(0, 10)
          const newEntries = buySignals.map(s => ({
            date: today,
            stockId: s.id,
            name: s.name,
            signal: s.signal,
          }))
          localStorage.setItem(
            'signal_history',
            JSON.stringify([...newEntries, ...prev].slice(0, 200)),
          )
        }
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  const buyStocks = stockResults.filter(s => s.signal?.action === 'BUY')

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Market Index */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          大盤指數
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <IndexCard data={indexData} />
          <div className="card" style={{ padding: '16px 20px', minWidth: 220, display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>今日掃描進度</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#00d4aa', fontFamily: 'monospace' }}>
                {loadedCount} / {STOCKS.length}
              </div>
              <div style={{ marginTop: 8, height: 4, width: 160, background: '#30363d', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(loadedCount / STOCKS.length) * 100}%`, background: '#00d4aa', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buy Signals */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          今日買進訊號
        </h2>
        {loading && buyStocks.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            掃描中，請稍候…（{loadedCount}/{STOCKS.length}）
          </div>
        ) : buyStocks.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👀</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>今日無明確買進訊號，建議觀望</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {buyStocks.map(s => (
              <SignalBox key={s.id} signal={s.signal} stockName={`${s.name} (${s.id})`} />
            ))}
          </div>
        )}
      </section>

      {/* All Stocks */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          監控股票池
        </h2>
        {stockResults.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {STOCKS.map(s => (
              <div key={s.id} className="card" style={{ padding: '14px 16px', opacity: 0.5 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.id}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>載入中…</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {stockResults.map(s => <StockCard key={s.id} stock={s} />)}
          </div>
        )}
      </section>
    </main>
  )
}
