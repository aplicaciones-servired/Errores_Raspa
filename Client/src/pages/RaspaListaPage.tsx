import RaspaList from '../components/raspa/RaspaList'
import type { RaspaData } from '../types/raspa'

interface Props {
  raspas: RaspaData[]
}

export default function RaspaListaPage({ raspas }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      <RaspaList raspas={raspas} />
    </div>
  )
}
