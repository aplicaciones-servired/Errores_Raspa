export interface StatCardData {
  label: string
  value: number | string
  icon: string
  gradient: string
  hint?: string
}

interface Props {
  cards: StatCardData[]
}

export default function StatCards({ cards }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 relative overflow-hidden animate-slide-up"
        >
          <div
            className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-4`}
          >
            <span className="text-white text-2xl">{card.icon}</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {card.value}
          </p>
          <p className="text-sm font-semibold text-slate-500 mt-1">{card.label}</p>
          {card.hint && (
            <p className="text-xs text-slate-400 mt-0.5">{card.hint}</p>
          )}
          <div
            className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${card.gradient} opacity-60`}
          />
        </div>
      ))}
    </div>
  )
}