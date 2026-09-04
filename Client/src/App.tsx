import { useCallback, useEffect, useState } from 'react'
import Menu from './components/ui/Menu'
import { useToast } from './components/ui/ToastContext'
import RegistrarRaspaPage from './pages/RegistrarRaspaPage'
import RaspaListaPage from './pages/RaspaListaPage'
import { listarRaspas } from './services/raspas.service'
import type { RaspaData } from './types/raspa'

type View = 'registrar' | 'listado'

const menuItems = [
  { key: 'registrar' as const, label: 'Registrar Raspa', icon: '✏️' },
  { key: 'listado' as const, label: 'Raspas insertados', icon: '📋' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white text-lg">&#127915;</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Validacion de Raspas
              </h1>
              <p className="text-xs text-gray-500">
                Registra y consulta raspas con imagenes: frente, reverso y error
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex justify-center">
          <Menu items={menuItems} active={view} onChange={setView} />
        </div>

        <div className="animate-slide-up">
          {view === 'registrar' ? (
            <RegistrarRaspaPage onCreated={handleCreated} />
          ) : (
            <RaspaListaPage raspas={raspas} onRefresh={loadRaspas} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
