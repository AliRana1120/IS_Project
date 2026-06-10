import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/*
  Lock & Key Animation
  States: idle → inserting → (success | fail) → idle
  - idle: lock closed, key resting on right side
  - inserting: key slides into keyhole
  - success: key turns, lock opens with green glow + particles
  - fail: key shakes out, red flash
*/
function LockKeyAnimation({ state }) {
  // Key position and rotation based on state
  const keyVariants = {
    idle: { x: 80, y: 0, rotate: 0, opacity: 0.85 },
    inserting: { x: 0, y: 0, rotate: 0, opacity: 1 },
    success: { x: 0, y: 0, rotate: 45, opacity: 1 },
    fail: { x: 80, y: 0, rotate: 0, opacity: 0.85 },
  }

  const keyTransition = {
    idle: { duration: 0.6, ease: 'easeOut' },
    inserting: { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] },
    success: { duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] },
    fail: { duration: 0.4, ease: 'easeOut', delay: 0.5 },
  }

  // Shackle open/close
  const shackleVariants = {
    idle: { rotate: 0, y: 0 },
    inserting: { rotate: 0, y: 0 },
    success: { rotate: -25, y: -5 },
    fail: { rotate: 0, y: 0 },
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
      {/* Background glow */}
      <motion.div
        className="absolute w-52 h-52 rounded-full"
        animate={{
          background: state === 'success'
            ? 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)'
            : state === 'fail'
            ? 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
          scale: state === 'success' ? 1.3 : state === 'fail' ? 0.95 : 1,
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Orbiting ring */}
      <motion.div
        className="absolute w-60 h-60 rounded-full border border-dashed"
        style={{ borderColor: state === 'success' ? '#22c55e25' : state === 'fail' ? '#ef444425' : '#f9731620' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Main SVG */}
      <svg viewBox="0 0 280 200" width="340" height="244" className="relative z-10">
        {/* === LOCK === */}
        <g>
          {/* Shackle (the U-shaped top) */}
          <motion.g
            style={{ transformOrigin: '100px 95px' }}
            variants={shackleVariants}
            animate={state}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: state === 'success' ? 0.6 : 0 }}
          >
            <motion.path
              d="M 82 95 L 82 62 C 82 40, 100 28, 100 28 C 100 28, 118 40, 118 62 L 118 95"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              animate={{
                stroke: state === 'success' ? '#22c55e' : state === 'fail' ? '#ef4444' : '#f97316',
              }}
              transition={{ duration: 0.4 }}
            />
            {/* Shackle glow */}
            <motion.path
              d="M 82 95 L 82 62 C 82 40, 100 28, 100 28 C 100 28, 118 40, 118 62 L 118 95"
              fill="none"
              strokeWidth="16"
              strokeLinecap="round"
              style={{ filter: 'blur(6px)' }}
              animate={{
                stroke: state === 'success' ? '#22c55e30' : state === 'fail' ? '#ef444430' : '#f9731620',
              }}
              transition={{ duration: 0.4 }}
            />
          </motion.g>

          {/* Lock body */}
          <motion.rect
            x="72" y="90" width="56" height="48" rx="6"
            animate={{
              fill: state === 'success' ? '#22c55e' : state === 'fail' ? '#ef4444' : '#f97316',
            }}
            transition={{ duration: 0.4 }}
          />
          {/* Lock body highlight */}
          <motion.rect
            x="72" y="90" width="56" height="16" rx="6"
            animate={{
              fill: state === 'success' ? 'rgba(74,222,128,0.3)' : state === 'fail' ? 'rgba(248,113,113,0.3)' : 'rgba(251,146,60,0.3)',
            }}
            transition={{ duration: 0.4 }}
          />
          {/* Lock shadow */}
          <rect x="72" y="125" width="56" height="13" rx="6" fill="rgba(0,0,0,0.15)" />
          {/* Shine */}
          <rect x="78" y="95" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.3)" />

          {/* Keyhole */}
          <circle cx="100" cy="110" r="6" fill="rgba(0,0,0,0.6)" />
          <rect x="97.5" y="110" width="5" height="14" rx="2.5" fill="rgba(0,0,0,0.6)" />
        </g>

        {/* === KEY === */}
        <motion.g
          style={{ transformOrigin: '100px 110px' }}
          variants={keyVariants}
          animate={state}
          transition={keyTransition[state]}
        >
          {/* Key shaft */}
          <motion.rect
            x="100" y="107" width="65" height="6" rx="3"
            animate={{
              fill: state === 'success' ? '#86efac' : state === 'fail' ? '#fca5a5' : '#fde047',
            }}
            transition={{ duration: 0.3 }}
          />
          {/* Key teeth */}
          <motion.rect x="145" y="107" width="4" height="11" rx="1.5"
            animate={{ fill: state === 'success' ? '#86efac' : state === 'fail' ? '#fca5a5' : '#fde047' }}
          />
          <motion.rect x="153" y="107" width="4" height="9" rx="1.5"
            animate={{ fill: state === 'success' ? '#86efac' : state === 'fail' ? '#fca5a5' : '#fde047' }}
          />
          <motion.rect x="138" y="107" width="3" height="8" rx="1"
            animate={{ fill: state === 'success' ? '#86efac' : state === 'fail' ? '#fca5a5' : '#fde047' }}
          />
          {/* Key handle (bow) */}
          <motion.circle
            cx="165" cy="110" r="14"
            fill="none"
            strokeWidth="5"
            animate={{
              stroke: state === 'success' ? '#86efac' : state === 'fail' ? '#fca5a5' : '#fde047',
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.circle
            cx="165" cy="110" r="6"
            animate={{
              fill: state === 'success' ? '#22c55e50' : state === 'fail' ? '#ef444450' : '#eab30840',
            }}
            transition={{ duration: 0.3 }}
          />
          {/* Key glow */}
          <motion.rect
            x="100" y="105" width="65" height="10" rx="5"
            style={{ filter: 'blur(4px)' }}
            animate={{
              fill: state === 'success' ? '#86efac20' : state === 'fail' ? '#fca5a520' : '#fde04715',
            }}
          />
        </motion.g>

        {/* === SUCCESS PARTICLES === */}
        <AnimatePresence>
          {state === 'success' && (
            <>
              {[
                { cx: 85, cy: 60, delay: 0.7 },
                { cx: 115, cy: 55, delay: 0.8 },
                { cx: 95, cy: 50, delay: 0.9 },
                { cx: 105, cy: 45, delay: 1.0 },
                { cx: 75, cy: 65, delay: 0.75 },
                { cx: 125, cy: 60, delay: 0.85 },
              ].map((p, i) => (
                <motion.circle
                  key={i}
                  cx={p.cx}
                  cy={p.cy}
                  r={2 + Math.random() * 2}
                  fill="#4ade80"
                  initial={{ opacity: 0, y: 20, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [20, -30], scale: [0, 1.5, 0] }}
                  transition={{ duration: 1, delay: p.delay, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* === FAIL FLASH === */}
        <AnimatePresence>
          {state === 'fail' && (
            <motion.rect
              x="70" y="88" width="60" height="52" rx="6"
              fill="rgba(239,68,68,0.3)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0, 0.4, 0] }}
              transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1] }}
            />
          )}
        </AnimatePresence>

        {/* Status badge */}
        <AnimatePresence>
          {state === 'success' && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <circle cx="100" cy="155" r="12" fill="#22c55e" />
              <path d="M 94 155 L 98 159 L 107 150" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.g>
          )}
          {state === 'fail' && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <circle cx="100" cy="155" r="12" fill="#ef4444" />
              <path d="M 95 150 L 105 160 M 105 150 L 95 160" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Status text */}
      <motion.p
        className="absolute bottom-4 text-sm font-medium"
        animate={{
          color: state === 'success' ? '#4ade80' : state === 'fail' ? '#f87171' : state === 'inserting' ? '#fb923c' : '#6b7280',
        }}
      >
        {state === 'idle' && 'Ready to authenticate'}
        {state === 'inserting' && 'Verifying credentials...'}
        {state === 'success' && 'Access granted'}
        {state === 'fail' && 'Access denied'}
      </motion.p>

      {/* Floating dots */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i,
            height: 4 + i,
            background: state === 'success' ? '#22c55e' : state === 'fail' ? '#ef4444' : '#f97316',
            top: `${25 + i * 15}%`,
            left: `${10 + i * 22}%`,
            opacity: 0.4,
          }}
          animate={{ y: [0, -8, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locked, setLocked] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [animState, setAnimState] = useState('idle')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (countdown <= 0) { setLocked(false); return }
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setLocked(false); setError(''); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  async function handleSubmit(e) {
    e.preventDefault()
    if (locked || loading) return
    setError('')
    setLoading(true)
    setAnimState('inserting')

    // Wait for key insertion animation
    await new Promise(r => setTimeout(r, 1300))

    try {
      const result = await login(username, password)
      if (result.success) {
        setAnimState('success')
        // Let the success animation play fully before navigating
        setTimeout(() => navigate('/'), 2200)
      } else {
        setAnimState('fail')
        if (result.locked) {
          setLocked(true)
          setCountdown(result.remaining_seconds || 60)
        }
        setError(result.error || 'Invalid credentials')
        // Let fail animation play then reset
        setTimeout(() => setAnimState('idle'), 2800)
      }
    } catch {
      setAnimState('fail')
      setError('Connection failed. Is the server running?')
      setTimeout(() => setAnimState('idle'), 2800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#080c15]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 60% 40%, #1a100005 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, #0a151a 0%, transparent 50%)'
      }}></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }}></div>

      {/* Left panel - Lock & Key animation */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <LockKeyAnimation state={animState} />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">CyberHouse</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Security System</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Sign in to your account</h2>
            <p className="text-gray-500 mt-1.5 text-sm">Enter your credentials to proceed</p>
          </div>

          {/* Mobile animation */}
          <div className="lg:hidden h-44 mb-4">
            <LockKeyAnimation state={animState} />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-5 p-4 rounded-xl flex items-start gap-3 overflow-hidden ${
                  locked ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/15'
                }`}
              >
                {locked ? <Timer className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className={`text-sm ${locked ? 'text-red-300' : 'text-orange-300'}`}>{error}</p>
                  {locked && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                          animate={{ width: `${(countdown / 60) * 100}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <span className="text-xs text-red-400 font-mono">{countdown}s</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all"
                placeholder="Enter username"
                required
                autoFocus
                disabled={locked}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all pr-10"
                  placeholder="Enter password"
                  required
                  disabled={locked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || locked}
              className={`w-full py-3.5 font-semibold rounded-xl text-white shadow-xl transition-colors disabled:cursor-not-allowed ${
                animState === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/15'
                  : animState === 'fail'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-red-500/10'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-500/15 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50'
              }`}
              whileHover={!locked && !loading ? { scale: 1.01 } : {}}
              whileTap={!locked && !loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                  Verifying...
                </span>
              ) : locked ? (
                <span className="flex items-center justify-center gap-2">
                  <Timer className="w-4 h-4" /> Locked ({countdown}s)
                </span>
              ) : animState === 'success' ? (
                '✓ Access Granted'
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-600">
            <span>Max 3 attempts • 60s lockout</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${locked ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
              {locked ? 'Locked' : 'Ready'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
