import Empty from './Empty'

export interface DatosBarra {
  etiqueta: string
  cantidad: number
}

interface Props {
  datos: DatosBarra[]
  color: string
}

const MAX_VISIBLES = 6

export default function BarrasHorizontales({ datos, color }: Props) {
  const max = Math.max(1, ...datos.map((d) => d.cantidad))

  if (datos.length === 0) {
    return <Empty>Sin datos</Empty>
  }

  const visibles = datos.slice(0, MAX_VISIBLES)

  return (
    <div className="flex flex-col gap-3">
      {visibles.map((d) => {
        const ancho = Math.max(4, Math.round((d.cantidad / max) * 100))
        return (
          <div key={d.etiqueta} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-600 truncate">{d.etiqueta}</span>
              <span className="text-sm font-extrabold text-slate-900">{d.cantidad}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                style={{ width: `${ancho}%` }}
              />
            </div>
          </div>
        )
      })}
      {datos.length > visibles.length && (
        <p className="text-xs text-slate-400 font-medium text-center mt-1">
          +{datos.length - visibles.length} tipos mas
        </p>
      )}
    </div>
  )
}