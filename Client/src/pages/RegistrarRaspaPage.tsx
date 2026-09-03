import RaspaForm from '../components/raspa/RaspaForm'
import type { RaspaData } from '../types/raspa'

interface Props {
  onCreated: (raspa: RaspaData) => void
}

export default function RegistrarRaspaPage({ onCreated }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      <RaspaForm onCreated={onCreated} />
    </div>
  )
}
