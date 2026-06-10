import { useState, useEffect } from 'react'
import api from '../api/axios'
import { Users as UsersIcon, Shield, Plus, X, Eye, EyeOff, UserPlus } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPasswords, setShowPasswords] = useState({})
  const [createForm, setCreateForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', role: 'viewer', department: 'General'
  })
  const [createError, setCreateError] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    try {
      const res = await api.get('/users/')
      setUsers(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Admin access required to view users.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setCreateError('')
    try {
      await api.post('/users/create/', createForm)
      setShowCreate(false)
      setCreateForm({ username: '', email: '', first_name: '', last_name: '', password: '', role: 'viewer', department: 'General' })
      fetchUsers()
    } catch (err) {
      setCreateError(err.response?.data?.username?.[0] || err.response?.data?.error || 'Failed to create user')
    }
  }

  function togglePassword(id) {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  const roleColors = {
    admin: 'bg-red-500/15 text-red-400 border-red-500/30',
    analyst: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    viewer: 'bg-green-500/15 text-green-400 border-green-500/30',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} registered users • Admin Full Access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/20"
        >
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Clearance</th>
                <th className="text-left px-5 py-3 font-medium">Password</th>
                <th className="text-left px-5 py-3 font-medium">Department</th>
                <th className="text-left px-5 py-3 font-medium">Last Login</th>
                <th className="text-left px-5 py-3 font-medium">IP</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {u.first_name?.[0] || u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.username}</p>
                        <p className="text-xs text-gray-500">{u.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-300">{u.security_label}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded">
                        {showPasswords[u.id] ? (u.plain_password || '—') : '••••••••'}
                      </code>
                      <button onClick={() => togglePassword(u.id)} className="text-gray-600 hover:text-gray-300">
                        {showPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{u.department}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600 font-mono">{u.last_login_ip || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {u.is_active ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" /> Create New User
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username *</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password * (min 8 chars)</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none font-mono"
                  required
                  minLength={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  >
                    <option value="viewer">Viewer (Unclassified)</option>
                    <option value="analyst">Analyst (Confidential)</option>
                    <option value="admin">Admin (Secret)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Security clearance is automatically assigned based on role.
              </p>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all"
              >
                Create User Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
