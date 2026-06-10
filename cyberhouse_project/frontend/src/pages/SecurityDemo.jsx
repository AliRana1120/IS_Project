import { useState, useEffect } from 'react'
import api from '../api/axios'
import { Shield, CheckCircle, XCircle, BookOpen, PenTool } from 'lucide-react'

export default function SecurityDemo() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDemo() }, [])

  async function fetchDemo() {
    try {
      const res = await api.get('/security-demo/')
      setData(res.data)
    } catch (err) {
      console.error(err)
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

  if (!data) return <div className="text-gray-500">Failed to load.</div>

  const levelColors = {
    0: 'border-green-500/30 bg-green-500/5',
    1: 'border-yellow-500/30 bg-yellow-500/5',
    2: 'border-red-500/30 bg-red-500/5',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bell-LaPadula Security Demo</h1>
        <p className="text-gray-500 mt-1">Live enforcement of access control policies</p>
      </div>

      {/* User info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-400">Your Clearance:</span>
            <span className="text-sm font-bold text-white">{data.user_label} (Level {data.user_clearance})</span>
          </div>
          <span className="text-gray-700">|</span>
          <div className="text-sm text-gray-400">
            Role: <span className="text-cyan-400 capitalize font-medium">{data.user_role}</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-400">Simple Security (No Read Up):</strong> You can only READ documents at or below your clearance level.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <strong className="text-gray-400">Star Property (No Write Down):</strong> You can only WRITE documents at or above your clearance level.
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {data.results.map((r) => (
          <div key={r.doc_id} className={`bg-gray-900 border rounded-xl p-5 ${levelColors[r.doc_level]}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{r.doc_title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Classification: {r.doc_label} (Level {r.doc_level})</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`flex items-start gap-2 p-3 rounded-lg ${r.can_read ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <BookOpen className="w-4 h-4 mt-0.5 shrink-0" style={{ color: r.can_read ? '#22c55e' : '#ef4444' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: r.can_read ? '#22c55e' : '#ef4444' }}>
                    READ: {r.can_read ? 'ALLOWED' : 'DENIED'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.read_reason}</p>
                </div>
              </div>
              <div className={`flex items-start gap-2 p-3 rounded-lg ${r.can_write ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <PenTool className="w-4 h-4 mt-0.5 shrink-0" style={{ color: r.can_write ? '#22c55e' : '#ef4444' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: r.can_write ? '#22c55e' : '#ef4444' }}>
                    WRITE: {r.can_write ? 'ALLOWED' : 'DENIED'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.write_reason}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
