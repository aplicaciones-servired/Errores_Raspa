import { useCallback, useEffect, useState } from 'react'
import RaspaList from '../components/raspa/RaspaList'
import { useToast } from '../components/ui/ToastContext'
import { EMPRESAS } from '../utils/const'
import { enviarReporteSemanal, listarRaspas } from '../services/raspas.service'
import { leerDigitosDeImagen, precalentarOcr, soloDigitos, type LadoImagen } from '../utils/ocr'
import type { FiltrosRaspa, RaspaData, RespuestaPaginada } from '../types/raspa'

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
const CONCURRENCIA_OCR = 3

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

  const [busquedaNumero, setBusquedaNumero] = useState('')
  const [buscandoNumero, setBuscandoNumero] = useState(false)
  const [progresoBusqueda, setProgresoBusqueda] = useState<string | null>(null)
  const [resultadoOcr, setResultadoOcr] = useState<RaspaData | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      void precalentarOcr().catch(() => undefined)
    }, 2500)
    return () => clearTimeout(id)
  }, [])

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
    if (!autoRefresh || buscandoNumero) return
    const id = setInterval(() => {
      void consultar(filtros, pagina)
    }, INTERVALO_REFRESH_MS)
    return () => clearInterval(id)
  }, [autoRefresh, buscandoNumero, filtros, pagina, consultar])

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

  const buscarEnLote = async (
    raspas: RaspaData[],
    lados: LadoImagen[],
    digitos: string,
    candidatas: RaspaData[] | null = null,
  ): Promise<RaspaData | null> => {
    for (let i = 0; i < raspas.length; i += CONCURRENCIA_OCR) {
      const lote = raspas.slice(i, i + CONCURRENCIA_OCR)
      const resultados = await Promise.all(
        lote.map(async (raspa) => {
          for (const lado of lados) {
            const digitosOcr = await leerDigitosDeImagen(raspa.id, lado)
            if (digitosOcr.length > 0 && digitosOcr.includes(digitos)) {
              return { raspa, match: true }
            }
          }
          return { raspa, match: false }
        }),
      )
      const match = resultados.find((res) => res.match)
      if (match) return match.raspa
      if (candidatas) {
        for (const res of resultados) {
          if (!res.match) candidatas.push(res.raspa)
        }
      }
    }
    return null
  }

  const buscarPorNumero = async () => {
    const digitos = soloDigitos(busquedaNumero)
    if (!digitos || digitos.length < 6) {
      showToast('Escribe el número impreso en la tarjeta (mínimo 6 dígitos)', 'error')
      return
    }
    setBuscandoNumero(true)
    setResultadoOcr(null)
    setProgresoBusqueda('Preparando OCR...')
    try {
      await precalentarOcr()
      const candidatas: RaspaData[] = []
      let encontrado: RaspaData | null = null
      let pagina = 1
      let procesados = 0
      let total = 0
      let agotado = false
      while (!encontrado && !agotado) {
        const r = await listarRaspas({ limite: 100, pagina })
        total = r.total
        procesados += r.datos.length
        setProgresoBusqueda(`Leyendo frentes... ${procesados}/${total}`)
        encontrado = await buscarEnLote(r.datos, ['frente'], digitos, candidatas)
        if (r.pagina >= r.totalPaginas) agotado = true
        pagina += 1
      }
      if (!encontrado && candidatas.length > 0) {
        for (const lado of ['reverso'] as const) {
          setProgresoBusqueda(`Revisando ${lado} de ${candidatas.length} candidatas...`)
          encontrado = await buscarEnLote(candidatas, [lado], digitos)
          if (encontrado) break
        }
      }
      setProgresoBusqueda(null)
      if (encontrado) {
        setResp({ datos: [encontrado], total: 1, pagina: 1, totalPaginas: 1 })
        setResultadoOcr(encontrado)
        setAutoRefresh(false)
        showToast('Raspa encontrada por número', 'success')
      } else {
        showToast('No se encontró ninguna raspa con ese número', 'info')
      }
    } catch (err) {
      console.error('Error en búsqueda por número:', err)
      setProgresoBusqueda(null)
      showToast('No se pudo completar la búsqueda (revisa la conexión a internet para el OCR)', 'error')
    } finally {
      setBuscandoNumero(false)
    }
  }

  const limpiarBusquedaNumero = () => {
    setBusquedaNumero('')
    setResultadoOcr(null)
    setAutoRefresh(true)
    void consultar(filtros, 1)
  }

  const filtrado = Boolean(
  filtros.estado || filtros.nombre || filtros.empresa || filtros.requestId || filtros.desde || filtros.hasta,
)

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-white text-lg">&#128269;</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Buscar por número impreso en la tarjeta</h2>
            <p className="text-sm text-slate-400 font-medium">
              Lee las imágenes y encuentra la raspa cuyo número coincida, sin esperar el correo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[260px]">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Número de la raspa
            </label>
            <input
              type="text"
              value={busquedaNumero}
              onChange={(e) => setBusquedaNumero(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void buscarPorNumero()
              }}
              placeholder="Número impreso en la tarjeta, ej. 19102340075004607060"
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={() => void buscarPorNumero()}
            disabled={buscandoNumero}
            className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-orange-500/20 flex items-center gap-2 flex-shrink-0"
          >
            {buscandoNumero ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Buscando...
              </>
            ) : (
              <>
                <span>&#128270;</span>
                Buscar por número
              </>
            )}
          </button>
        </div>

        {progresoBusqueda && (
          <p className="text-sm text-amber-600 font-medium">{progresoBusqueda}</p>
        )}

        {resultadoOcr && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-emerald-700 font-semibold">
              Mostrando la raspa encontrada por número impreso
            </span>
            <button
              type="button"
              onClick={limpiarBusquedaNumero}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 transition-all duration-200"
            >
              Volver a la lista
            </button>
          </div>
        )}
      </div>

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
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">No. raspa / ID</label>
          <input
            type="text"
            value={filtros.requestId}
            onChange={(e) => onChange('requestId')(e.target.value)}
            title="Pega el número completo (ej. 19102340075004607060) para búsqueda exacta rápida"
            placeholder="Número completo, ej. 19102340075004607060"
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