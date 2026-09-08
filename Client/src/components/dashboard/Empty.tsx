import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function Empty({ children }: Props) {
  return (
    <div className="py-10 text-center">
      <p className="text-slate-400 font-medium text-sm">{children}</p>
    </div>
  )
}