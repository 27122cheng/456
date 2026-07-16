import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import StockDetail from './pages/StockDetail.jsx'
import Performance from './pages/Performance.jsx'

export const STOCKS = [
  { id: '2330', name: '台積電' },
  { id: '2317', name: '鴻海' },
  { id: '2454', name: '聯發科' },
  { id: '2382', name: '廣達' },
  { id: '3008', name: '大立光' },
  { id: '2308', name: '台達電' },
  { id: '6669', name: '緯穎' },
  { id: '3711', name: '日月光投控' },
  { id: '2881', name: '富邦金' },
  { id: '2412', name: '中華電' },
]

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock/:id" element={<StockDetail />} />
        <Route path="/performance" element={<Performance />} />
      </Routes>
    </div>
  )
}
