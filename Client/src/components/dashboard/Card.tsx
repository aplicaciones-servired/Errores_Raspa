import type { ReactNode } from 'react'

interface Props {
  titulo: string
  icon: string
  children: ReactNode
}

export default function Card({ titulo, icon, children }: Props) {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white text-base">{icon}</span>
        </div>
        <h3 className="font-bold text-slate-900 text-lg">{titulo}</h3>
      </div>
      {children}
    </div>
  )
}