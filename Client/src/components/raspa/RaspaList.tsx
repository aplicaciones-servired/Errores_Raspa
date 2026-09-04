import { useMemo, useState } from 'react'
import ImageModal from '../ui/ImageModal'
import { useToast } from '../ui/ToastContext'
import { verificarRespuesta } from '../../services/raspas.service'
import type { RaspaData } from '../../types/raspa'

interface Props {
  raspas: RaspaData[]
  onRefresh: () => Promise<void>
}

const ESTADOS = ['PENDIENTE', 'RESPONDIDO', 'VALIDADO', 'RECHAZADO'] as const

const estadoClass: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  RESPONDIDO: 'bg-blue-100 text-blue-800',
  VALIDADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
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

  const handleVerificar = async (id: number) => {
    setVerificandoId(id)
    showToast('Verificando respuesta de soporte...', 'info')
    try {
      const resultado = await verificarRespuesta(id)
      if (resultado.respondido) {
        showToast(`Respuesta encontrada: ${resultado.mensaje}`, 'success')
        await onRefresh()
      } else {
        showToast(resultado.mensaje, 'info')
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
      className="block"
    >
      <img
        src={src}
        alt={alt}
        className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:scale-105 hover:ring-2 hover:ring-blue-400 transition"
      />
    </button>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Raspas insertados</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {raspasFiltradas.length} de {raspas.length} registro{raspas.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">Todos</option>
            {ESTADOS.map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</label>
          <input
            type="text"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            placeholder="Buscar por nombre..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {(filtroEstado || filtroNombre || filtroFecha) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroEstado(''); setFiltroNombre(''); setFiltroFecha('') }}
              className="text-xs text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {raspasFiltradas.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-400">No se encontraron raspas con los filtros aplicados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 font-semibold">Empresa</th>
                <th className="py-3 px-4 font-semibold">Nombre</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Frente</th>
                <th className="py-3 px-4 font-semibold">Reverso</th>
                <th className="py-3 px-4 font-semibold">Error</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Ticket / Respuesta</th>
                <th className="py-3 px-4 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {raspasFiltradas.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 align-middle hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 text-gray-700 font-medium">{r.empresa}</td>
                  <td className="py-3.5 px-4 text-gray-600">{r.nombre}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                      {r.tipoRaspa}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {thumbnail(r.imagenFrenteUrl, `${r.tipoRaspa} frente`, `${r.tipoRaspa} - Frente`)}
                  </td>
                  <td className="py-3.5 px-4">
                    {thumbnail(r.imagenReversoUrl, `${r.tipoRaspa} reverso`, `${r.tipoRaspa} - Reverso`)}
                  </td>
                  <td className="py-3.5 px-4">
                    {thumbnail(r.imagenErrorUrl, `${r.tipoRaspa} error`, `${r.tipoRaspa} - Error`)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        estadoClass[r.estado] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    {r.requestId && r.respuestaSoporte ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded inline-block w-fit">
                          {r.requestId}
                        </span>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3" title={r.respuestaSoporte}>
                          {r.respuestaSoporte}
                        </p>
                      </div>
                    ) : r.requestId ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded inline-block w-fit">
                          {r.requestId}
                        </span>
                        <button
                          onClick={() => handleVerificar(r.id)}
                          disabled={verificandoId === r.id}
                          className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-blue-200"
                        >
                          {verificandoId === r.id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Verificando...
                            </span>
                          ) : (
                            'Verificar respuesta'
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
