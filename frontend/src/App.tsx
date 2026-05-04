import { useEffect } from 'react'

import { Building2, LayoutGrid, MessageSquareText, Package, Settings, SquareCheckBig, Users } from 'lucide-react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { useLogoutMutation, useMeQuery } from './hooks'
import ChatPage from './pages/Chat'
import ContactsPage from './pages/Contacts'
import CRMPage from './pages/CRM'
import LoginPage from './pages/Login'
import ProductsPage from './pages/Products'
import SettingsPage from './pages/Settings'
import { useAuthStore } from './stores/authStore'
import TasksPage from './pages/Tasks'
import TeamsPage from './pages/Teams'

const navigation = [
  { to: '/crm', label: 'CRM', icon: LayoutGrid },
  { to: '/chat', label: 'Chat', icon: MessageSquareText },
  { to: '/contacts', label: 'Contatos', icon: Users },
  { to: '/tasks', label: 'Tarefas', icon: SquareCheckBig },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/teams', label: 'Equipes', icon: Building2 },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

function AppLayout() {
  const location = useLocation()
  const logoutStore = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } finally {
      logoutStore()
    }
  }

  return (
    <div className="app-grid min-h-screen bg-transparent text-ink">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-black/10 bg-white/70 p-5 shadow-panel backdrop-blur">
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-coral">Virtualizze</p>
            <h1 className="text-2xl font-bold tracking-tight">CRM Workspace</h1>
            <p className="text-sm leading-6 text-ink/65">Base inicial para CRM visual, atendimento WhatsApp e operação multi-tenant.</p>
          </div>

          <nav className="space-y-2">
            {navigation.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to

              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-ink text-white shadow-lg'
                      : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 space-y-3 rounded-xl border border-black/10 bg-white/70 p-3">
            <p className="text-xs text-ink/70">Logado como</p>
            <p className="truncate text-sm font-semibold text-ink">{user?.name ?? 'Usuário'}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-black/5"
            >
              Sair
            </button>
          </div>
        </aside>

        <main className="py-2">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function RequireAuth() {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}

function PublicOnly() {
  const token = useAuthStore((state) => state.token)

  if (token) {
    return <Navigate replace to="/crm" />
  }

  return <Outlet />
}

export default function App() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const syncProfile = useAuthStore((state) => state.syncProfile)
  const meQuery = useMeQuery(token)

  useEffect(() => {
    if (meQuery.data) {
      syncProfile(meQuery.data)
    }
  }, [meQuery.data, syncProfile])

  useEffect(() => {
    if (meQuery.isError) {
      logout()
    }
  }, [logout, meQuery.isError])

  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate replace to="/crm" />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate replace to="/crm" />} />
    </Routes>
  )
}