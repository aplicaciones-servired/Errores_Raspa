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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-6">
      <header className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">
          🎟️ Validación de Raspas
        </h1>
        <p className="text-gray-500 mt-1">
          Registra y consulta los raspas con sus imagenes: frente, reverso y error
        </p>
      </header>

      <div className="max-w-5xl mx-auto mb-6 flex">
        <div className="mx-auto">
          <Menu items={menuItems} active={view} onChange={setView} />
        </div>
      </div>

      {view === 'registrar' ? (
        <RegistrarRaspaPage onCreated={handleCreated} />
      ) : (
        <RaspaListaPage raspas={raspas} onRefresh={loadRaspas} />
      )}
    </div>
  )
}

export default App
