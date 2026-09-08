import type { EstadisticaEmbudo } from '../../types/raspa'

interface Props {
  datos: EstadisticaEmbudo[]
}

const ETIQUETAS: Record<string, string> = {
  SIN_REQUEST_ID: 'Sin ID de soporte',
  CON_REQUEST_ID: 'Con ID de soporte',
  RESUELTO: 'Resuelto',
  RECHAZADO: 'Rechazado',
}

const COLORES = [
  'from-slate-500/80 to-slate-400',
  'from-sky-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
]

export default function Embudo({ datos }: Props) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1)

  return (
    <div className="flex flex-col gap-3">
      {datos.map((d, i) => {
        const ancho = Math.max(12, Math.round((d.cantidad / max) * 100))
        return (
          <div key={d.grupo} className="flex items-center gap-3">
            <span className="w-32 text-right text-xs font-semibold text-slate-500 flex-shrink-0">
              {ETIQUETAS[d.grupo] ?? d.grupo}
            </span>
            <div className="flex-1 h-9 rounded-xl bg-slate-100/60 flex items-center justify-end px-2 overflow-hidden">
              {/* barra proporcional */}
              <div
                className={`flex items-center justify-end h-full rounded-xl bg-gradient-to-r ${COLORES[i % COLORES.length]} transition-all duration-700`}
                style={{ width: `${ancho}%`, minWidth: '36px' }}
              >
                <span className="text-white text-xs font-bold px-2 truncate">{d.cantidad}</span>
              </div>
            </div>
            {i < datos.length - 1 && (
              <div className="w-4 flex-shrink-0 text-slate-300 flex flex-col items-center justify-center">
                <span className="text-xs leading-none">⤵</span>
              </div>
            )}
          </div>
        )
      })}
      {datos.length === 0 && (
        <p className="text-sm text-slate-400">Sin datos para el embudo</p>
      )}
    </div>
  )
}