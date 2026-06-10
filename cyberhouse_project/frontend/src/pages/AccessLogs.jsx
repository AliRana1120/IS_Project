import { useState, useEffect } from 'react'
import api from '../api/axios'
import { ScrollText, CheckCircle, XCircle } from 'lucide-react'

export default function AccessLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    try {
      const res = await api.get('/access-logs/')
      setLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = filter === 'all' ? logs
    : filter === 'granted' ? logs.filter(l => l.success)
    : logs.filter(l => !l.success)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Access Logs</h1>
          <p className="text-gray-500 mt-1">Audit trail of all security events</p>
        </div>
        <div className="flex gap-2">
          {['all', 'granted', 'denied'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              {f} ({f === 'all' ? logs.length : f === 'granted' ? logs.filter(l => l.success).length : logs.filter(l => !l.success).length})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
                <th className="text-left px-5 py-3 font-medium">Resource</th>
                <th className="text-left px-5 py-3 font-medium">Details</th>
                <th className="text-left px-5 py-3 font-medium">IP</th>
                <th className="text-left px-5 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    {log.success ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-300">{log.username}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.action === 'ACCESS_DENIED' ? 'bg-red-500/15 text-red-400' :
                      log.action === 'LOGIN' ? 'bg-blue-500/15 text-blue-400' :
                      log.action === 'CREATE' ? 'bg-purple-500/15 text-purple-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400 max-w-[200px] truncate">{log.resource}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-[250px] truncate">{log.details}</td>
                  <td className="px-5 py-3 text-xs text-gray-600 font-mono">{log.ip_address || '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-500">No logs found.</div>
        )}
      </div>
    </div>
  )
}
