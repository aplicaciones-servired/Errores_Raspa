import { useCallback, useEffect, useState } from 'react'
import Menu from './components/ui/Menu'
import { useToast } from './components/ui/ToastContext'
import DashboardPage from './pages/DashboardPage'
import RegistrarRaspaPage from './pages/RegistrarRaspaPage'
import RaspaListaPage from './pages/RaspaListaPage'
import { listarRaspas } from './services/raspas.service'
import type { RaspaData } from './types/raspa'

type View = 'registrar' | 'listado' | 'dashboard'

const menuItems: Array<{ key: View; label: string; icon: string }> = [
  { key: 'registrar', label: 'Registrar Raspa', icon: '✏️' },
  { key: 'listado', label: 'Raspas insertados', icon: '📋' },
  { key: 'dashboard', label: 'Dashboard', icon: '📈' },
]

function App() {
  const { showToast } = useToast()
  const [view, setView] = useState<View>('registrar')
  const [raspas, setRaspas] = useState<RaspaData[]>([])

  const loadRaspas = useCallback(async () => {
    try {
      const data = await listarRaspas()
      setRaspas(data)
    } catch (err) {
      console.error('Error al cargar raspas:', err)
      showToast('Error al cargar los raspas', 'error')
    }
  }, [showToast])

  useEffect(() => {
    loadRaspas()
  }, [loadRaspas])

  const handleCreated = (raspa: RaspaData) => {
    setRaspas((prev) => [raspa, ...prev])
    setView('listado')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 shadow-sm shadow-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex justify-center">
          <Menu items={menuItems} active={view} onChange={setView} />
        </div>

        <div className="animate-slide-up">
          {view === 'registrar' ? (
            <RegistrarRaspaPage onCreated={handleCreated} />
          ) : view === 'listado' ? (
            <RaspaListaPage raspas={raspas} onRefresh={loadRaspas} />
          ) : (
            <DashboardPage />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
