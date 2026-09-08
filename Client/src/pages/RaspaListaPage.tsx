import { useCallback, useEffect, useState } from 'react'
import RaspaList from '../components/raspa/RaspaList'
import { useToast } from '../components/ui/ToastContext'
import { EMPRESAS } from '../utils/const'
import { enviarReporteSemanal, listarRaspas } from '../services/raspas.service'
import type { FiltrosRaspa, RespuestaPaginada } from '../types/raspa'

interface FiltrosUI {
  estado: string
  nombre: string
  empresa: string
  requestId: string
  desde: string
  hasta: string
}

const FILTROS_INICIAL: FiltrosUI = {
  estado: '',
  nombre: '',
  empresa: '',
  requestId: '',
  desde: '',
  hasta: '',
}

const ESTADOS_OPCIONES = ['PENDIENTE', 'RESUELTO', 'RECHAZADO'] as const
const LIMITE = 6
const INTERVALO_REFRESH_MS = 30000

const aFiltrosApi = (f: FiltrosUI): FiltrosRaspa => {
  const api: FiltrosRaspa = { limite: LIMITE }
  if (f.estado) api.estado = f.estado
  if (f.nombre) api.nombre = f.nombre
  if (f.empresa) api.empresa = f.empresa
  if (f.requestId) api.requestId = f.requestId
  if (f.desde) api.desde = f.desde
  if (f.hasta) api.hasta = f.hasta
  return api
}

export default function RaspaListaPage() {
  const { showToast } = useToast()
  const [filtros, setFiltros] = useState<FiltrosUI>(FILTROS_INICIAL)
  const [pagina, setPagina] = useState(1)
  const [resp, setResp] = useState<RespuestaPaginada | null>(null)
  const [cargando, setCargando] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const consultar = useCallback(async (filtrosLocales: FiltrosUI, paginaLocal: number) => {
    setCargando(true)
    try {
      const r = await listarRaspas({ ...aFiltrosApi(filtrosLocales), pagina: paginaLocal })
      setResp(r)
    } catch (err) {
      console.error('Error al listar raspas:', err)
      showToast('Error al cargar los raspas', 'error')
    } finally {
      setCargando(false)
    }
  }, [showToast])

  useEffect(() => {
    void consultar(filtros, pagina)
  }, [filtros, pagina, consultar])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      void consultar(filtros, pagina)
    }, INTERVALO_REFRESH_MS)
    return () => clearInterval(id)
  }, [autoRefresh, filtros, pagina, consultar])

  const cambia = (campo: keyof FiltrosUI) =>
    (valor: string) => {
      setFiltros((prev) => ({ ...prev, [campo]: valor }))
      setPagina(1)
    }

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIAL)
    setPagina(1)
  }

  const exportarCsv = async () => {
    try {
      const r = await listarRaspas({ ...aFiltrosApi(filtros), limite: 10000 })
      const encabezado = ['ID', 'Fecha', 'Empresa', 'Nombre', 'Tipo de raspa', 'Estado', 'Request ID', 'Respuesta']
      const formatearFecha = (iso: string) => {
        const d = new Date(iso)
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      const limpiar = (txt: string) => txt.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
      const filas = r.datos.map((x) => [
        x.id,
        formatearFecha(x.createdAt),
        x.empresa,
        x.nombre,
        x.tipoRaspa,
        x.estado,
        x.requestId ?? '',
        limpiar(x.respuestaSoporte ?? ''),
      ])
      const csv =
        '\uFEFF' +
        [encabezado, ...filas]
          .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
          .join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `raspas-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Listado exportado a CSV', 'success')
    } catch (err) {
      console.error('Error al exportar CSV:', err)
      showToast('Error al exportar CSV', 'error')
    }
  }

  const enviarReporte = async () => {
    try {
      await enviarReporteSemanal()
      showToast('Reporte semanal enviado por correo', 'success')
    } catch (err) {
      console.error('Error al enviar reporte:', err)
      showToast('Error al enviar el reporte', 'error')
    }
  }

  const filtrado = Boolean(
  filtros.estado || filtros.nombre || filtros.empresa || filtros.requestId || filtros.desde || filtros.hasta,
)

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <FiltersBar
        filtros={filtros}
        onChange={cambia}
        onLimpiar={limpiarFiltros}
        hayFiltros={filtrado}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
        onExportar={exportarCsv}
        onReporte={enviarReporte}
      />
      <RaspaList
        raspas={resp?.datos ?? []}
        cargando={cargando}
        total={resp?.total ?? 0}
        pagina={resp?.pagina ?? 1}
        totalPaginas={resp?.totalPaginas ?? 1}
        onCambioPagina={setPagina}
        onRefresh={() => consultar(filtros, pagina)}
      />
    </div>
  )
}

interface FiltersBarProps {
  filtros: FiltrosUI
  onChange: (campo: keyof FiltrosUI) => (valor: string) => void
  onLimpiar: () => void
  hayFiltros: boolean
  autoRefresh: boolean
  onToggleAutoRefresh: () => void
  onExportar: () => void
  onReporte: () => void
}

function FiltersBar({
  filtros,
  onChange,
  onLimpiar,
  hayFiltros,
  autoRefresh,
  onToggleAutoRefresh,
  onExportar,
  onReporte,
}: FiltersBarProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white text-lg">&#128203;</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Raspas insertados</h2>
            <p className="text-sm text-slate-400 font-medium">
              Filtra, verifica, edita y exporta los registros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReporte}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-all duration-200 flex items-center gap-2"
          >
            <span>&#128231;</span> Reporte semanal
          </button>
          <button
            type="button"
            onClick={onExportar}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all duration-200 flex items-center gap-2"
          >
            <span>&#128196;</span> Exportar CSV
          </button>
          <button
            type="button"
            onClick={onToggleAutoRefresh}
            title="Refresca la lista automaticamente cada 30s"
            className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              autoRefresh
                ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{autoRefresh ? '🔄' : '⏸'}</span>
            Auto-refresco 30s: {autoRefresh ? 'activo' : 'pausado'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</label>
          <select
            value={filtros.estado}
            onChange={(e) => onChange('estado')(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="">Todos</option>
            {ESTADOS_OPCIONES.map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
          <input
            type="text"
            value={filtros.nombre}
            onChange={(e) => onChange('nombre')(e.target.value)}
            placeholder="Buscar por nombre..."
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</label>
          <select
            value={filtros.empresa}
            onChange={(e) => onChange('empresa')(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
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
            onChange={(e) => onChange('desde')(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasta</label>
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => onChange('hasta')(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID RASPA Y LISTO</label>
          <input
            type="text"
            value={filtros.requestId}
            onChange={(e) => onChange('requestId')(e.target.value)}
            placeholder="Buscar por ID..."
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        {hayFiltros && (
          <div className="flex items-end">
            <button
              onClick={onLimpiar}
              className="text-xs text-slate-500 hover:text-rose-500 px-4 py-2.5 rounded-xl hover:bg-rose-50 transition-all duration-200 font-semibold border border-slate-200 hover:border-rose-200"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}