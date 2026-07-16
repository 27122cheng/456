import { useEffect, useRef } from 'react'

export default function TradingViewWidget({ stockId }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !stockId) return

    containerRef.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.textContent = JSON.stringify({
      symbol: `TWSE:${stockId}`,
      interval: 'D',
      theme: 'dark',
      style: '1',
      locale: 'zh_TW',
      width: '100%',
      height: '480',
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_top_toolbar: false,
      hide_side_toolbar: true,
    })
    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [stockId])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', height: 480, borderRadius: 10, overflow: 'hidden' }}
    />
  )
}
