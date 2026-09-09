import { useState } from 'react'
import Menu from './components/ui/Menu'
import DashboardPage from './pages/DashboardPage'
import RegistrarRaspaPage from './pages/RegistrarRaspaPage'
import RaspaListaPage from './pages/RaspaListaPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

type View = 'registrar' | 'listado' | 'dashboard'

const menuItems: Array<{ key: View; label: string; icon: string }> = [
  { key: 'registrar', label: 'Registrar Raspa', icon: '✏️' },
  { key: 'listado', label: 'Raspas insertados', icon: '📋' },
  { key: 'dashboard', label: 'Dashboard', icon: '📈' },
]

function App() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<View>('registrar')

  if (!user) return <LoginPage />

  return (
    <div className="min-h-screen">
      <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 shadow-sm shadow-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white text-xl">&#127915;</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Validacion de Raspas
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Registra y consulta raspas con imagenes: frente, reverso y error
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium">
                {user.names} {user.lastnames}
              </span>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all duration-200"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex justify-center">
          <Menu items={menuItems} active={view} onChange={setView} />
        </div>

        <div className="animate-slide-up" key={view}>
          {view === 'registrar' ? (
            <RegistrarRaspaPage onCreated={() => setView('listado')} />
          ) : view === 'listado' ? (
            <RaspaListaPage />
          ) : (
            <DashboardPage />
          )}
        </div>
      </main>
    </div>
  )
}

export default App