import { useCallback, useEffect, useMemo, useState } from 'react'
import { obtenerEstadisticas } from '../services/raspas.service'
import { useToast } from '../components/ui/ToastContext'
import BarrasDiarias from '../components/dashboard/BarrasDiarias'
import BarrasHorizontales from '../components/dashboard/BarrasHorizontales'
import Card from '../components/dashboard/Card'
import DonutEstados from '../components/dashboard/DonutEstados'
import SkeletonDashboard from '../components/dashboard/SkeletonDashboard'
import StatCards, { type StatCardData } from '../components/dashboard/StatCards'
import type { DashboardStats } from '../types/raspa'

export default function DashboardPage() {
  const { showToast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [cargando, setCargando] = useState(true)

  const loadStats = useCallback(async () => {
    setCargando(true)
    try {
      const data = await obtenerEstadisticas()
      setStats(data)
    } catch (err) {
      console.error('Error al cargar estadisticas:', err)
      showToast('Error al cargar el dashboard', 'error')
    } finally {
      setCargando(false)
    }
  }, [showToast])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const cards = useMemo<StatCardData[]>(() => {
    if (!stats) return []
    return [
      {
        label: 'Total registros',
        value: stats.total,
        icon: '📊',
        gradient: 'from-blue-500 via-indigo-500 to-purple-500',
        hint: 'raspas insertados',
      },
      {
        label: 'Resueltos',
        value: stats.resueltos,
        icon: '✅',
        gradient: 'from-emerald-500 to-teal-500',
        hint: `${stats.resolucionPct}% de resolucion`,
      },
      {
        label: 'Pendientes',
        value: stats.pendientes,
        icon: '⏳',
        gradient: 'from-amber-500 to-orange-500',
        hint: 'esperando respuesta',
      },
      {
        label: 'con ID de RASPA Y LISTO',
        value: stats.conRequestId,
        icon: '🎫',
        gradient: 'from-sky-500 to-cyan-500',
        hint: 'respuesta capturada',
      },
      {
        label: 'Sin respuesta',
        value: stats.sinRespuesta,
        icon: '🔔',
        gradient: 'from-rose-500 to-pink-500',
        hint: 'aun sin status de soporte',
      },
    ]
  }, [stats])

  if (cargando && !stats) {
    return <SkeletonDashboard />
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-slate-500 font-medium">No se pudieron cargar las estadisticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <span className="text-white text-lg">📈</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-400 font-medium">
            Resumen de registros, estados e inserciones de raspas
          </p>
        </div>
      </div>

      <StatCards cards={cards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card titulo="Inserciones ultimos 30 dias" icon="🗓️">
          <BarrasDiarias datos={stats.ultimos30Dias} />
        </Card>

        <Card titulo="Ultimos 7 dias" icon="📆">
          <BarrasDiarias datos={stats.ultimos7Dias} compacto />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card titulo="Por estado" icon="🧩">
          <DonutEstados stats={stats} />
        </Card>

        <Card titulo="Por empresa" icon="🏢">
          <BarrasHorizontales
            datos={stats.porEmpresa.map((e) => ({ etiqueta: e.empresa, cantidad: e.cantidad }))}
            color="from-indigo-500 to-blue-500"
          />
        </Card>

        <Card titulo="Top raspas por tipo" icon="🎰">
          <BarrasHorizontales
            datos={stats.porTipo.map((t) => ({ etiqueta: t.tipoRaspa, cantidad: t.cantidad }))}
            color="from-purple-500 to-fuchsia-500"
          />
        </Card>
      </div>
    </div>
  )
}