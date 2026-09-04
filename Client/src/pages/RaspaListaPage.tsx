import RaspaList from '../components/raspa/RaspaList'
import type { RaspaData } from '../types/raspa'

interface Props {
  raspas: RaspaData[]
  onRefresh: () => Promise<void>
}

export default function RaspaListaPage({ raspas, onRefresh }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      <RaspaList raspas={raspas} onRefresh={onRefresh} />
    </div>
  )
}
