import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    const id = code.trim()
    if (id) {
      navigate(`/stock/${id}`)
      setCode('')
    }
  }

  return (
    <nav style={{ background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 24, height: 56 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#00d4aa', letterSpacing: '-0.5px' }}>📡 台股雷達</span>
        </Link>

        <div style={{ flex: 1 }} />

        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
          onMouseEnter={e => e.target.style.color = '#e2e8f0'}
          onMouseLeave={e => e.target.style.color = '#94a3b8'}>
          首頁
        </Link>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="輸入股票代號…"
            style={{
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#e2e8f0',
              fontSize: 14,
              width: 160,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#00d4aa',
              color: '#0d1117',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
            查詢
          </button>
        </form>

        <Link to="/performance" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
          onMouseEnter={e => e.target.style.color = '#e2e8f0'}
          onMouseLeave={e => e.target.style.color = '#94a3b8'}>
          績效
        </Link>
      </div>
    </nav>
  )
}
