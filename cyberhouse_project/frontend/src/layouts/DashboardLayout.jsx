import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FileText, Users, Shield, Hash,
  ScrollText, LogOut, Menu, X, ChevronDown, Lock, UserCircle
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Users', path: '/users', icon: Users, adminOnly: true },
  { name: 'Access Logs', path: '/access-logs', icon: ScrollText },
  { name: 'My Profile', path: '/profile', icon: UserCircle },
  { name: 'BLP Demo', path: '/security-demo', icon: Shield },
  { name: 'Hash Demo', path: '/hash-demo', icon: Hash },
]

function ClearanceBadge({ level }) {
  const styles = {
    Unclassified: 'bg-green-500/20 text-green-400 border-green-500/30',
    Confidential: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Secret: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[level] || styles.Unclassified}`}>
      {level}
    </span>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">CyberHouse</h1>
                <p className="text-xs text-gray-500">Security System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User card */}
          <div className="p-4 border-t border-gray-800">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <ClearanceBadge level={user?.security_label} />
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-orange-500" />
              <span>Bell-LaPadula + RBAC Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ClearanceBadge level={user?.security_label} />
            <span className="text-sm text-gray-300">{user?.first_name || user?.username}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
