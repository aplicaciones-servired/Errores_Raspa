import { useCallback, useEffect, useMemo, useState } from 'react'
import { obtenerEstadisticas } from '../services/raspas.service'
import { useToast } from '../components/ui/ToastContext'
import BarrasDiarias from '../components/dashboard/BarrasDiarias'
import BarrasHorizontales from '../components/dashboard/BarrasHorizontales'
import Card from '../components/dashboard/Card'
import DonutEstados from '../components/dashboard/DonutEstados'
import Embudo from '../components/dashboard/Embudo'
import SkeletonDashboard from '../components/dashboard/SkeletonDashboard'
import StatCards, { type StatCardData } from '../components/dashboard/StatCards'
import { EMPRESAS } from '../utils/const'
import type { DashboardStats, FiltrosEstadisticas } from '../types/raspa'

interface FiltrosUI {
  empresa: string
  desde: string
  hasta: string
}

const exportarCsv = (stats: DashboardStats) => {
  const filas: string[][] = [
    ['Metrica', 'Valor'],
    ['Total', String(stats.total)],
    ['Pendientes', String(stats.pendientes)],
    ['Resueltos', String(stats.resueltos)],
    ['Rechazados', String(stats.rechazados)],
    ['Con ID de soporte', String(stats.conRequestId)],
    ['Sin respuesta', String(stats.sinRespuesta)],
    ['% resolucion', `${stats.resolucionPct}`],
    ['Tiempo promedio (hs)', String(stats.tiempoPromedioResolucionHs)],
    ['Pendientes +24h', String(stats.pendientes24h)],
    ['Pendientes +48h', String(stats.pendientes48h)],
    ['', ''],
    ['Dia', 'Inserciones'],
    ...stats.ultimos30Dias.map((d) => [d.fecha, String(d.cantidad)]),
  ]
  const csv =
    '\uFEFF' +
    filas
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const aFiltrosApi = (f: FiltrosUI): FiltrosEstadisticas => {
  const api: FiltrosEstadisticas = {}
  if (f.empresa) api.empresa = f.empresa
  if (f.desde) api.desde = f.desde
  if (f.hasta) api.hasta = f.hasta
  return api
}

export default function DashboardPage() {
  const { showToast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosUI>({
    empresa: '',
    desde: '',
    hasta: '',
  })

  const loadStats = useCallback(
    async (filtrosLocales: FiltrosUI) => {
      setCargando(true)
      try {
        const data = await obtenerEstadisticas(aFiltrosApi(filtrosLocales))
        setStats(data)
      } catch (err) {
        console.error('Error al cargar estadisticas:', err)
        showToast('Error al cargar el dashboard', 'error')
      } finally {
        setCargando(false)
      }
    },
    [showToast],
  )

  useEffect(() => {
    loadStats(filtros)
  }, [filtros, loadStats])

  const cambia = (campo: keyof FiltrosUI) => (valor: string) =>
    setFiltros((prev) => ({ ...prev, [campo]: valor }))

  const hayFiltros = Boolean(filtros.empresa || filtros.desde || filtros.hasta)

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
        label: 'Tiempo promedio',
        value: `${stats.tiempoPromedioResolucionHs} hs`,
        icon: '⏱️',
        gradient: 'from-violet-500 to-purple-500',
        hint: 'hasta resolver',
      },
      {
        label: 'Rechazados',
        value: stats.rechazados,
        icon: '❌',
        gradient: 'from-rose-500 to-pink-500',
        hint: 'sin status valido',
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
      <div className="flex flex-wrap items-start justify-between gap-4">
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

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</label>
            <select
              value={filtros.empresa}
              onChange={(e) => cambia('empresa')(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="">Todas</option>
              {EMPRESAS.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => cambia('desde')(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => cambia('hasta')(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <button
            type="button"
            onClick={() => exportarCsv(stats)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all duration-200 flex items-center gap-2"
          >
            <span>📄</span> Exportar CSV
          </button>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => setFiltros({ empresa: '', desde: '', hasta: '' })}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {cargando && stats && (
        <p className="text-xs text-indigo-400 font-medium">actualizando...</p>
      )}

      <StatCards cards={cards} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card titulo="Inserciones ultimos 30 dias" icon="🗓️">
          <BarrasDiarias datos={stats.ultimos30Dias} />
        </Card>

        <Card titulo="Ultimos 7 dias" icon="📆">
          <BarrasDiarias datos={stats.ultimos7Dias} compacto />
        </Card>

        <Card titulo="Embudo de soporte" icon="🔻">
          <Embudo datos={stats.embudo} />
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