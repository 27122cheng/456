import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ margin: '0 0 8px', color: '#94a3b8' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '3px 0', color: p.color }}>
          {p.name}: <span style={{ fontFamily: 'monospace' }}>{p.value?.toLocaleString()}</span> 張
        </p>
      ))}
    </div>
  )
}

export default function InstitutionalChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
        法人資料載入中…
      </div>
    )
  }

  const shortenDate = d => d ? d.slice(5) : ''
  const chartData = data.map(d => ({ ...d, date: shortenDate(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v === 0 ? '0' : v > 0 ? `+${(v / 1000).toFixed(0)}K` : `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={name => <span style={{ color: '#94a3b8' }}>{name}</span>}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
        <Bar dataKey="foreign" name="外資" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={16} />
        <Bar dataKey="investment" name="投信" fill="#22c55e" radius={[2, 2, 0, 0]} maxBarSize={16} />
        <Bar dataKey="dealer" name="自營商" fill="#f97316" radius={[2, 2, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
