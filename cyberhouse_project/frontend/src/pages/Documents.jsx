import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { FileText, Plus, X, Shield, AlertTriangle } from 'lucide-react'

function LevelBadge({ level }) {
  const styles = {
    0: 'bg-green-500/15 text-green-400 border-green-500/30',
    1: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    2: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels = { 0: 'Unclassified', 1: 'Confidential', 2: 'Secret' }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

export default function Documents() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [deniedCount, setDeniedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', security_level: 0, category: '' })
  const [createError, setCreateError] = useState('')

  useEffect(() => { fetchDocuments() }, [])

  async function fetchDocuments() {
    try {
      const res = await api.get('/documents/')
      setDocuments(res.data.documents)
      setDeniedCount(res.data.denied_count)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    try {
      await api.post('/documents/create/', form)
      setShowCreate(false)
      setForm({ title: '', content: '', security_level: 0, category: '' })
      fetchDocuments()
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create document')
    }
  }

  async function viewDocument(id) {
    try {
      const res = await api.get(`/documents/${id}/`)
      setSelectedDoc(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setSelectedDoc({ error: true, ...err.response.data })
      }
    }
  }

  const canCreate = user?.role === 'admin' || user?.role === 'analyst'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-500 mt-1">
            {documents.length} accessible • {deniedCount} restricted by Bell-LaPadula
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> New Document
          </button>
        )}
      </div>

      {deniedCount > 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            {deniedCount} document(s) hidden due to Bell-LaPadula No-Read-Up policy
          </span>
        </div>
      )}

      {/* Document grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => viewDocument(doc.id)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 cursor-pointer transition-all hover:shadow-lg group"
          >
            <div className="flex items-start justify-between mb-3">
              <FileText className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
              <LevelBadge level={doc.security_level} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{doc.title}</h3>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{doc.content}</p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{doc.category}</span>
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Document detail modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {selectedDoc.error ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
                <p className="text-gray-400 text-sm">{selectedDoc.reason}</p>
                <p className="text-xs text-gray-600 mt-2">
                  Your clearance: {selectedDoc.user_clearance} | Required: {selectedDoc.required_clearance}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <LevelBadge level={selectedDoc.security_level} />
                  <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedDoc.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>By: {selectedDoc.created_by_name}</span>
                  <span>•</span>
                  <span>{selectedDoc.category}</span>
                  <span>•</span>
                  <span>{new Date(selectedDoc.created_at).toLocaleString()}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
                  {selectedDoc.content}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Create Document</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Security Level</label>
                  <select
                    value={form.security_level}
                    onChange={(e) => setForm({ ...form, security_level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  >
                    <option value={0}>Unclassified</option>
                    <option value={1}>Confidential</option>
                    <option value={2}>Secret</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                    placeholder="e.g. Policy"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                ⚠️ BLP Star Property: You can only write at your clearance level or above.
              </p>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all"
              >
                Create Document
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
