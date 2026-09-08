import { useState } from 'react'
import EditRaspaModal from './EditRaspaModal'
import ImageModal from '../ui/ImageModal'
import { useToast } from '../ui/ToastContext'
import { verificarRespuesta } from '../../services/raspas.service'
import type { RaspaData } from '../../types/raspa'

interface Props {
  raspas: RaspaData[]
  cargando: boolean
  total: number
  pagina: number
  totalPaginas: number
  onCambioPagina: (pagina: number) => void
  onRefresh: () => Promise<void>
}

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

export default function RaspaList({
  raspas,
  cargando,
  total,
  pagina,
  totalPaginas,
  onCambioPagina,
  onRefresh,
}: Props) {
  const { showToast } = useToast()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [verificandoId, setVerificandoId] = useState<number | null>(null)
  const [editando, setEditando] = useState<RaspaData | null>(null)

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

  const antiguedadHoras = (createdAt: string) =>
    Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3600000)

  const slaLabels: Array<{ min: number; label: string; class: string }> = [
    { min: 48, label: '⚠ +48h sin resolver', class: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
    { min: 24, label: '⏰ +24h sin resolver', class: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' },
  ]

  const bloqueSla = (r: RaspaData) => {
    if (r.estado !== 'PENDIENTE') return null
    const horas = antiguedadHoras(r.createdAt)
    const sla = slaLabels.find((s) => horas >= s.min)
    if (!sla) return null
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${sla.class}`}>
        {sla.label}
      </span>
    )
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

  const irAPagina = (p: number) => {
    onCambioPagina(Math.min(Math.max(1, p), totalPaginas))
  }

  const rangoPaginas = () => {
    const rango: number[] = []
    const desde = Math.max(1, pagina - 2)
    const hasta = Math.min(totalPaginas, pagina + 2)
    for (let p = desde; p <= hasta; p++) rango.push(p)
    return rango
  }

  if (cargando && raspas.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-20 h-20 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-20 h-20 rounded-xl bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">&#128444;</span>
        </div>
        <p className="text-slate-500 font-medium">No se encontraron raspas</p>
        <p className="text-sm text-slate-400 mt-1">Intenta ajustar los filtros de busqueda</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-medium">
          Mostrando {raspas.length} de {total} registro{total === 1 ? '' : 's'}
          {cargando && <span className="ml-2 text-indigo-400">refrescando...</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {raspas.map((r, index) => {
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
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${estado.class}`}>
                      {estado.icon} {r.estado}
                    </span>
                    {bloqueSla(r)}
                  </div>
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

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setEditando(r)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all duration-200 flex items-center gap-2"
                >
                  <span>&#9998;</span> Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => irAPagina(pagina - 1)}
            disabled={pagina === 1}
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
                p === pagina
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => irAPagina(pagina + 1)}
            disabled={pagina === totalPaginas}
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

      {editando && (
        <EditRaspaModal
          raspa={editando}
          onClose={() => setEditando(null)}
          onGuardado={onRefresh}
        />
      )}
    </div>
  )
}