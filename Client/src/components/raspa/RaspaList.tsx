import { useEffect, useMemo, useState } from 'react'
import ImageModal from '../ui/ImageModal'
import { useToast } from '../ui/ToastContext'
import { verificarRespuesta } from '../../services/raspas.service'
import type { RaspaData } from '../../types/raspa'

interface Props {
  raspas: RaspaData[]
  onRefresh: () => Promise<void>
}

const ESTADOS = ['PENDIENTE', 'RESUELTO', 'RECHAZADO'] as const
const ITEMS_POR_PAGINA = 6

const estadoConfig: Record<string, { icon: string; class: string }> = {
  PENDIENTE: { icon: '⏳', class: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  RESUELTO: { icon: '✅', class: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  RECHAZADO: { icon: '❌', class: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
}

interface Preview {
  src: string
  alt: string
  title: string
}

export default function RaspaList({ raspas, onRefresh }: Props) {
  const { showToast } = useToast()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [verificandoId, setVerificandoId] = useState<number | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)

  const raspasFiltradas = useMemo(() => {
    return raspas.filter((r) => {
      if (filtroEstado && r.estado !== filtroEstado) return false
      if (filtroNombre && !r.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false
      if (filtroFecha) {
        const fechaRaspa = new Date(r.createdAt).toISOString().slice(0, 10)
        if (fechaRaspa !== filtroFecha) return false
      }
      return true
    })
  }, [raspas, filtroEstado, filtroNombre, filtroFecha])

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroEstado, filtroNombre, filtroFecha])

  const totalPaginas = Math.max(1, Math.ceil(raspasFiltradas.length / ITEMS_POR_PAGINA))
  const paginaSegura = Math.min(paginaActual, totalPaginas)
  const inicio = (paginaSegura - 1) * ITEMS_POR_PAGINA
  const raspasVisibles = raspasFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA)

  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.min(Math.max(1, pagina), totalPaginas))
  }

  const rangoPaginas = () => {
    const total = totalPaginas
    const actual = paginaSegura
    const rango: number[] = []
    const desde = Math.max(1, actual - 2)
    const hasta = Math.min(total, actual + 2)
    for (let p = desde; p <= hasta; p++) rango.push(p)
    return rango
  }

  const handleVerificar = async (id: number) => {
    setVerificandoId(id)
    showToast('Verificando respuesta de soporte...', 'info')
    try {
      const resultado = await verificarRespuesta(id)
      if (resultado.respondido) {
        showToast(`✔ ${resultado.mensaje}`, 'success')
        await onRefresh()
      } else {
        showToast(`${resultado.mensaje}`, 'info')
      }
    } catch (err) {
      console.error('Error al verificar respuesta:', err)
      showToast('Error al verificar la respuesta', 'error')
    } finally {
      setVerificandoId(null)
    }
  }

  const thumbnail = (src: string, alt: string, title: string) => (
    <button
      type="button"
      onClick={() => setPreview({ src, alt, title })}
      className="block group/thumb"
    >
      <img
        src={src}
        alt={alt}
        className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 hover:ring-2 hover:ring-indigo-400 transition-all duration-300"
      />
    </button>
  )

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white text-lg">&#128203;</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Raspas insertados</h2>
            <p className="text-sm text-slate-400 font-medium">
              Mostrando {inicio + 1}-{inicio + raspasVisibles.length} de {raspasFiltradas.length} registro{raspasFiltradas.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="">Todos</option>
            {ESTADOS.map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
          <input
            type="text"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            placeholder="Buscar por nombre..."
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        {(filtroEstado || filtroNombre || filtroFecha) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroEstado(''); setFiltroNombre(''); setFiltroFecha('') }}
              className="text-xs text-slate-500 hover:text-rose-500 px-4 py-2.5 rounded-xl hover:bg-rose-50 transition-all duration-200 font-semibold border border-slate-200 hover:border-rose-200"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {raspasFiltradas.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#128444;</span>
          </div>
          <p className="text-slate-500 font-medium">No se encontraron raspas</p>
          <p className="text-sm text-slate-400 mt-1">Intenta ajustar los filtros de busqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {raspasVisibles.map((r, index) => {
            const estado = estadoConfig[r.estado] ?? { icon: '❓', class: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200' }
            return (
              <div
                key={r.id}
                className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <span className="text-white text-sm font-bold">{r.empresa.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{r.empresa}</h3>
                      <p className="text-sm text-slate-500">{r.nombre}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${estado.class}`}>
                      {estado.icon} {r.estado}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(r.createdAt).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    {r.tipoRaspa}
                  </span>
                  <div className="flex gap-3">
                    {thumbnail(r.imagenFrenteUrl, `${r.tipoRaspa} frente`, `${r.tipoRaspa} - Frente`)}
                    {thumbnail(r.imagenReversoUrl, `${r.tipoRaspa} reverso`, `${r.tipoRaspa} - Reverso`)}
                    {thumbnail(r.imagenErrorUrl, `${r.tipoRaspa} error`, `${r.tipoRaspa} - Error`)}
                  </div>
                </div>

                {r.requestId && r.respuestaSoporte ? (
                  <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl p-5 border border-emerald-200/60">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">&#9989;</span>
                      </div>
                      <span className="font-mono text-sm text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg font-bold tracking-wide">
                        {r.requestId}
                      </span>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line" title={r.respuestaSoporte}>
                        {r.respuestaSoporte}
                      </p>
                    </div>
                  </div>
                ) : r.requestId ? (
                  <div className="bg-white rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">&#128196;</span>
                        </div>
                        <span className="font-mono text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg font-bold tracking-wide">
                          {r.requestId}
                        </span>
                      </div>
                      <button
                        onClick={() => handleVerificar(r.id)}
                        disabled={verificandoId === r.id}
                        className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 flex-shrink-0"
                      >
                        {verificandoId === r.id ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Verificando...
                          </>
                        ) : (
                          <>
                            <span>&#128260;</span>
                            Verificar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100/50 rounded-xl p-4 border border-dashed border-slate-200 text-center">
                    <span className="text-slate-400 text-sm">Sin respuesta de soporte</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => irAPagina(paginaSegura - 1)}
            disabled={paginaSegura === 1}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
          >
            <span>&#8592;</span>
            Anterior
          </button>

          {rangoPaginas().map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => irAPagina(p)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                p === paginaSegura
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => irAPagina(paginaSegura + 1)}
            disabled={paginaSegura === totalPaginas}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
          >
            Siguiente
            <span>&#8594;</span>
          </button>
        </div>
      )}

      {preview && (
        <ImageModal
          src={preview.src}
          alt={preview.alt}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
