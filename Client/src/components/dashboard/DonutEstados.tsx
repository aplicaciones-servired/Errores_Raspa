import Empty from './Empty'
import { ESTADO_COLORS, ESTADO_ICONS } from './constants'
import type { DashboardStats } from '../../types/raspa'

interface Props {
  stats: DashboardStats
}

export default function DonutEstados({ stats }: Props) {
  const datos = stats.porEstado
  const total = Math.max(1, datos.reduce((acc, d) => acc + d.cantidad, 0))

  if (datos.length === 0) {
    return <Empty>No hay registros todavia</Empty>
  }

  let acumulado = 0
  const segmentos = datos.map((d) => {
    const inicio = (acumulado / total) * 360
    acumulado += d.cantidad
    const fin = (acumulado / total) * 360
    return { ...d, inicio, fin }
  })

  const radio = 80
  const circunferencia = 2 * Math.PI * radio

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-8">
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r={radio} fill="none" stroke="#f1f5f9" strokeWidth="28" />
            {segmentos.map((d) => {
              const largo = ((d.fin - d.inicio) / 360) * circunferencia
              return (
                <circle
                  key={d.estado}
                  cx="100"
                  cy="100"
                  r={radio}
                  fill="none"
                  stroke={ESTADO_COLORS[d.estado] ?? '#64748b'}
                  strokeWidth="28"
                  strokeDasharray={`${largo} ${circunferencia - largo}`}
                  strokeDashoffset={-((d.inicio / 360) * circunferencia)}
                  strokeLinecap="butt"
                  className="transition-all duration-500"
                >
                  <title>{`${d.estado}: ${d.cantidad}`}</title>
                </circle>
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">total</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {datos.map((d) => (
            <div key={d.estado} className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ESTADO_COLORS[d.estado] ?? '#64748b' }}
              />
              <span className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                {ESTADO_ICONS[d.estado] ?? ''} {d.estado}
              </span>
              <span className="text-sm font-extrabold text-slate-900">{d.cantidad}</span>
              <span className="text-xs text-slate-400">
                {Math.round((d.cantidad / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl p-4 border border-emerald-200/60">
        <p className="text-sm text-slate-700 font-medium">
          <span className="font-extrabold text-emerald-700">{stats.resolucionPct}%</span>{' '}
          de las raspas han sido resueltas
        </p>
      </div>
    </div>
  )
}