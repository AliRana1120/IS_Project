import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { User, Shield, Eye, EyeOff, Save, CheckCircle, Key } from 'lucide-react'

export default function Profile() {
  const { user: authUser, checkAuth } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '', department: '',
    current_password: '', new_password: ''
  })

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    try {
      const res = await api.get('/profile/')
      setProfile(res.data)
      setForm({
        email: res.data.email || '',
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        department: res.data.department || '',
        current_password: '',
        new_password: '',
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.new_password) {
        delete payload.new_password
        delete payload.current_password
      }
      const res = await api.put('/profile/', payload)
      if (res.data.success) {
        setSuccess('Profile updated successfully')
        setForm(prev => ({ ...prev, current_password: '', new_password: '' }))
        fetchProfile()
        checkAuth()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const clearanceColors = {
    Unclassified: 'from-green-500 to-emerald-600',
    Confidential: 'from-yellow-500 to-amber-600',
    Secret: 'from-red-500 to-pink-600',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-500 mt-1">View and update your account credentials</p>
      </div>

      {/* Profile header card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${clearanceColors[profile?.security_label] || clearanceColors.Unclassified} rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
            {profile?.first_name?.[0] || profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{profile?.username}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 capitalize bg-gray-800 px-2 py-0.5 rounded">{profile?.role}</span>
              <span className="text-xs text-gray-500">Clearance: {profile?.security_label}</span>
            </div>
          </div>
        </div>

        {/* Show current password */}
        <div className="mt-5 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-400">Current Password</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white font-mono bg-gray-900 px-3 py-1 rounded">
                {showPassword ? (profile?.plain_password || '—') : '••••••••'}
              </code>
              <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Update Profile</h3>

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
            />
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Change Password (optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Password (min 8)</label>
                <input
                  type="password"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
