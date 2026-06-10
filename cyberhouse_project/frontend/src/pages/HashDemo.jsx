import { useState } from 'react'
import api from '../api/axios'
import { Hash, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function HashDemo() {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleHash(e) {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/hash-demo/', { password })
      setResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">bcrypt Hash Demo</h1>
        <p className="text-gray-500 mt-1">Demonstrates password hashing with bcrypt (12 rounds) vs SHA-256</p>
      </div>

      {/* Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <form onSubmit={handleHash} className="flex gap-3">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a password to hash..."
            className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
            Hash
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-orange-500" />
              Hash Results
            </h3>

            <div className="space-y-4">
              {/* bcrypt */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">bcrypt (12 rounds, salted)</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400">Verified</span>
                  </div>
                </div>
                <code className="text-xs text-gray-300 break-all font-mono leading-relaxed block">
                  {result.bcrypt_hash}
                </code>
              </div>

              {/* SHA-256 */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">SHA-256 (no salt, fast)</span>
                  <span className="text-xs text-yellow-400">⚠ Not for passwords</span>
                </div>
                <code className="text-xs text-gray-300 break-all font-mono leading-relaxed block">
                  {result.sha256_hash}
                </code>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Why bcrypt?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <h4 className="text-xs font-bold text-green-400 mb-2">✓ bcrypt</h4>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• Adaptive cost (12 rounds = 4096 iterations)</li>
                  <li>• Built-in salt (unique per hash)</li>
                  <li>• Slow by design (resistant to brute force)</li>
                  <li>• Same password → different hash each time</li>
                </ul>
              </div>
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <h4 className="text-xs font-bold text-red-400 mb-2">✗ SHA-256</h4>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• No cost factor (instant computation)</li>
                  <li>• No salt (vulnerable to rainbow tables)</li>
                  <li>• Fast (billions of hashes per second)</li>
                  <li>• Same password → same hash always</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
