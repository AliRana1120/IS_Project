import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  FileText, Users, ShieldCheck, ShieldX, TrendingUp,
  Clock, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

function StatCard({ icon: Icon, label, value, color, subtext }) {
  const colorMap = {
    orange: 'from-orange-500 to-red-600 shadow-orange-500/20',
    cyan: 'from-cyan-500 to-blue-600 shadow-cyan-500/20',
    green: 'from-green-500 to-emerald-600 shadow-green-500/20',
    red: 'from-red-500 to-pink-600 shadow-red-500/20',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444']

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await api.get('/dashboard/stats/')
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-gray-500">Failed to load dashboard data.</div>
  }

  const docPieData = [
    { name: 'Unclassified', value: stats.doc_level_distribution.unclassified },
    { name: 'Confidential', value: stats.doc_level_distribution.confidential },
    { name: 'Secret', value: stats.doc_level_distribution.secret },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, <span className="text-orange-400">{user?.first_name || user?.username}</span>
          . Your clearance: <span className="text-cyan-400">{user?.security_label}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Accessible Documents" value={stats.total_documents} color="orange" subtext="Based on your clearance" />
        <StatCard icon={Users} label="Total Users" value={stats.total_users} color="cyan" subtext="System-wide" />
        <StatCard icon={ShieldCheck} label="Access Granted" value={stats.access_granted_7d} color="green" subtext="Last 7 days" />
        <StatCard icon={ShieldX} label="Access Denied" value={stats.access_denied_7d} color="red" subtext="Last 7 days" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Access trend chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              Access Activity (7 Days)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="granted" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Granted" />
              <Area type="monotone" dataKey="denied" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Denied" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Document classification pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-500" />
            Document Classification
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={docPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {docPieData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {docPieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                <span className="text-xs text-gray-400">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Recent Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-3 font-medium">User</th>
                <th className="text-left pb-3 font-medium">Action</th>
                <th className="text-left pb-3 font-medium">Resource</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {stats.recent_activity.map((log) => (
                <tr key={log.id} className="text-sm">
                  <td className="py-2.5 text-gray-300">{log.username}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 max-w-[200px] truncate">{log.resource}</td>
                  <td className="py-2.5">
                    {log.success ? (
                      <span className="text-green-400 text-xs font-medium">✓ Success</span>
                    ) : (
                      <span className="text-red-400 text-xs font-medium">✗ Denied</span>
                    )}
                  </td>
                  <td className="py-2.5 text-gray-500 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
