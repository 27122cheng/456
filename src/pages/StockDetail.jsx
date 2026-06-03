import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createChart } from 'lightweight-charts'
import { fetchStockHistory, fetchInstitutional, fetchRecentInstitutional } from '../utils/fetchData.js'
import { calcEMA } from '../utils/indicators.js'
import { generateSignal } from '../utils/signals.js'
import SignalBox from '../components/SignalBox.jsx'
import InstitutionalChart from '../components/InstitutionalChart.jsx'
import TradingViewWidget from '../components/TradingViewWidget.jsx'
import { STOCKS } from '../App.jsx'

function LWChart({ history }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !history.length) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#0d1117' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: true },
    })
    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeries.setData(history.map(h => ({
      time: h.time,
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
    })))

    const closes = history.map(h => h.close)
    const ema20Vals = calcEMA(closes, 20)
    const ema60Vals = calcEMA(closes, 60)

    const ema20Data = history
      .map((h, i) => ({ time: h.time, value: ema20Vals[i] }))
      .filter(d => d.value !== null)
    const ema60Data = history
      .map((h, i) => ({ time: h.time, value: ema60Vals[i] }))
      .filter(d => d.value !== null)

    const ema20Series = chart.addLineSeries({ color: '#f97316', lineWidth: 1, title: 'EMA20' })
    ema20Series.setData(ema20Data)
    const ema60Series = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, title: 'EMA60' })
    ema60Series.setData(ema60Data)

    chart.timeScale().fitContent()

    const observer = new ResizeObserver(() => {
      chart.resize(containerRef.current.clientWidth, 400)
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [history])

  return (
    <div ref={containerRef} style={{ width: '100%', height: 400, borderRadius: 10, overflow: 'hidden' }} />
  )
}

export default function StockDetail() {
  const { id } = useParams()
  const stockMeta = STOCKS.find(s => s.id === id) || { id, name: id }

  const [history, setHistory] = useState([])
  const [inst, setInst] = useState(null)
  const [recentInst, setRecentInst] = useState([])
  const [signal, setSignal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [instLoading, setInstLoading] = useState(true)
  const [chartMode, setChartMode] = useState('lw') // 'lw' | 'tv'

  useEffect(() => {
    setLoading(true)
    setInstLoading(true)
    setHistory([])
    setInst(null)
    setRecentInst([])
    setSignal(null)

    async function load() {
      const [hist, todayInst] = await Promise.all([
        fetchStockHistory(id),
        fetchInstitutional(id),
      ])
      setHistory(hist || [])
      setInst(todayInst)
      if (hist?.length >= 60) setSignal(generateSignal(hist, todayInst))
      setLoading(false)

      const recent = await fetchRecentInstitutional(id)
      setRecentInst(recent || [])
      setInstLoading(false)
    }
    load()
  }, [id])

  const latest = history[history.length - 1]
  const prev = history[history.length - 2]
  const change = latest && prev ? latest.close - prev.close : null
  const changePct = change && prev ? (change / prev.close) * 100 : null
  const isUp = change > 0
  const priceColor = change === null ? '#e2e8f0' : isUp ? '#22c55e' : '#ef4444'

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
        <Link to="/" style={{ color: '#00d4aa', textDecoration: 'none' }}>首頁</Link>
        <span>/</span>
        <span>{stockMeta.name} ({id})</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#e2e8f0' }}>{stockMeta.name}</h1>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{id} · 台灣上市</div>
        </div>
        {!loading && latest && (
          <div>
            <span style={{ fontSize: 32, fontWeight: 700, color: priceColor, fontFamily: 'monospace' }}>
              {latest.close.toFixed(2)}
            </span>
            {changePct != null && (
              <span style={{ fontSize: 15, color: priceColor, marginLeft: 10 }}>
                {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            )}
          </div>
        )}
        {loading && <div style={{ color: '#64748b', fontSize: 14 }}>資料載入中…</div>}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Chart Toggle */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>K 線圖</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['lw', '技術指標'], ['tv', 'TradingView']].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: `1px solid ${chartMode === mode ? '#00d4aa' : 'rgba(255,255,255,0.12)'}`,
                      background: chartMode === mode ? '#00d4aa18' : 'transparent',
                      color: chartMode === mode ? '#00d4aa' : '#64748b',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
                載入歷史資料中…
              </div>
            ) : chartMode === 'lw' ? (
              <LWChart history={history} />
            ) : (
              <TradingViewWidget stockId={id} />
            )}
          </div>

          {/* Institutional Chart */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
              三大法人買賣超（近20日，單位：張）
              {instLoading && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>載入中…</span>}
            </h3>
            <InstitutionalChart data={recentInst} />
          </div>
        </div>

        {/* Right: Signal + Today Institutional */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>訊號計算中…</div>
          ) : (
            <SignalBox signal={signal} />
          )}

          {inst && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>今日三大法人（張）</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['外資', inst.foreign, '#3b82f6'],
                  ['投信', inst.investment, '#22c55e'],
                  ['自營商', inst.dealer, '#f97316'],
                  ['合計', inst.total, '#00d4aa'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: val > 0 ? color : '#ef4444', fontFamily: 'monospace' }}>
                      {val > 0 ? '+' : ''}{val?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>最新 OHLCV</div>
            {latest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['開', latest.open], ['高', latest.high], ['低', latest.low], ['收', latest.close]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{k}</span>
                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{v?.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>量</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{latest.volume?.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: 13 }}>—</div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
