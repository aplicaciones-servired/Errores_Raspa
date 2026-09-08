import type { EstadisticaDiaria } from '../../types/raspa'

interface Props {
  datos: EstadisticaDiaria[]
  compacto?: boolean
}

export default function BarrasDiarias({ datos, compacto }: Props) {
  const max = Math.max(1, ...datos.map((d) => d.cantidad))
  const total = datos.reduce((acc, d) => acc + d.cantidad, 0)

  const mostrarDia = (fecha: string) => {
    const [mes, dia] = fecha.slice(5).split('-')
    return `${dia}/${mes}`
  }

  const mostrarNombreDia = (fecha: string, i: number) => {
    if (!compacto) return null
    if (datos.length - i <= 2) return mostrarDia(fecha)
    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'short' })
  }

  const anchoPorColumna = compacto ? 46 : 30

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-extrabold text-slate-900">{total}</span>
        <span className="text-sm text-slate-400 font-medium">inserciones en el periodo</span>
      </div>
      <div className="overflow-x-auto pb-1 -mb-1">
        <div
          className="flex items-end gap-1.5 h-44"
          style={{ minWidth: datos.length * anchoPorColumna }}
        >
          {datos.map((d, i) => {
            const altura = Math.max(4, Math.round((d.cantidad / max) * 100))
            return (
              <div
                key={d.fecha}
                className="flex-1 min-w-0 flex flex-col items-center justify-end"
                title={`${d.fecha}: ${d.cantidad} inserciones`}
              >
                <span className={`font-bold text-xs leading-tight ${d.cantidad > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {d.cantidad}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 shrink-0 ${
                    d.cantidad > 0
                      ? 'bg-gradient-to-t from-blue-600 to-indigo-400'
                      : 'bg-slate-100'
                  }`}
                  style={{ height: `${altura}%` }}
                />
                <span className={`text-[10px] font-semibold leading-tight mt-1 ${d.cantidad > 0 ? 'text-slate-600' : 'text-slate-400'}`}>
                  {mostrarNombreDia(d.fecha, i) ?? mostrarDia(d.fecha)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}