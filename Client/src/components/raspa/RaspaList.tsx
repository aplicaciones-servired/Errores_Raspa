import { useState } from 'react'
import ImageModal from '../ui/ImageModal'
import type { RaspaData } from '../../types/raspa'

interface Props {
  raspas: RaspaData[]
}

const estadoClass: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  VALIDADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
}

interface Preview {
  src: string
  alt: string
  title: string
}

export default function RaspaList({ raspas }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null)

  if (raspas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
        <p className="text-gray-500">Aun no hay raspas registrados</p>
      </div>
    )
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
        className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:scale-105 hover:ring-2 hover:ring-blue-400 transition"
      />
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Raspas insertados</h2>
        <p className="text-sm text-gray-500">
          {raspas.length} registro{raspas.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Empresa</th>
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Tipo</th>
              <th className="py-2 pr-4">Frente</th>
              <th className="py-2 pr-4">Reverso</th>
              <th className="py-2 pr-4">Error</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Id raspa y Listo</th>
              <th className="py-2 pr-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {raspas.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 align-middle hover:bg-gray-50">
                <td className="py-3 pr-4 text-gray-700">{r.empresa}</td>
                <td className="py-3 pr-4 text-gray-700">{r.nombre}</td>
                <td className="py-3 pr-4 font-semibold text-gray-800">{r.tipoRaspa}</td>
                <td className="py-3 pr-4">
                  {thumbnail(r.imagenFrenteUrl, `${r.tipoRaspa} frente`, `${r.tipoRaspa} - Frente`)}
                </td>
                <td className="py-3 pr-4">
                  {thumbnail(r.imagenReversoUrl, `${r.tipoRaspa} reverso`, `${r.tipoRaspa} - Reverso`)}
                </td>
                <td className="py-3 pr-4">
                  {thumbnail(r.imagenErrorUrl, `${r.tipoRaspa} error`, `${r.tipoRaspa} - Error`)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      estadoClass[r.estado] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {r.estado}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-500">
                  {r.requestId ? (
                    <span className="font-mono text-gray-700">{r.requestId}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
