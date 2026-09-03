import { useState } from 'react'
import ImageUploader from '../ui/ImageUploader'
import { useToast } from '../ui/ToastContext'
import { crearRaspa } from '../../services/raspas.service'
import { EMPRESAS, TIPO_RASPAS } from '../../utils/const'
import type { RaspaData } from '../../types/raspa'

interface Props {
  onCreated: (raspa: RaspaData) => void
}

export default function RaspaForm({ onCreated }: Props) {
  const { showToast } = useToast()
  const [empresa, setEmpresa] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipoRaspa, setTipoRaspa] = useState('')
  const [frente, setFrente] = useState<string | null>(null)
  const [reverso, setReverso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!empresa) {
      showToast('Selecciona la empresa', 'error')
      return
    }
    if (!nombre.trim()) {
      showToast('Ingresa el nombre de la persona que envia', 'error')
      return
    }
    if (!tipoRaspa) {
      showToast('Selecciona el tipo de raspa', 'error')
      return
    }
    if (!frente || !reverso || !error) {
      showToast('Debes cargar las tres imagenes: frente, reverso y error', 'error')
      return
    }

    setLoading(true)
    try {
      const raspa = await crearRaspa({
        empresa,
        nombre: nombre.trim(),
        tipoRaspa,
        imagenFrente: frente,
        imagenReverso: reverso,
        imagenError: error,
      })
      onCreated(raspa)
      setEmpresa('')
      setNombre('')
      setTipoRaspa('')
      setFrente(null)
      setReverso(null)
      setError(null)
      showToast('Raspa enviado correctamente', 'success')
    } catch (err) {
      console.error(err)
      showToast('Error al enviar el raspa', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800">Registrar Raspa</h2>
        <p className="text-sm text-gray-500">
          Completa el tipo e ingresa las tres imagenes del raspa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-gray-700">Empresa</label>
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="" disabled>
              Selecciona una empresa
            </option>
            {EMPRESAS.map((emp) => (
              <option key={emp} value={emp}>
                {emp}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-gray-700">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de quien envia"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-gray-700">Tipo de raspa</label>
          <select
            value={tipoRaspa}
            onChange={(e) => setTipoRaspa(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="" disabled>
              Selecciona un tipo de raspa
            </option>
            {TIPO_RASPAS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ImageUploader label="Frente" dataUrl={frente} onChange={setFrente} />
        <ImageUploader label="Reverso" dataUrl={reverso} onChange={setReverso} />
        <ImageUploader label="Error" dataUrl={error} onChange={setError} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? 'Enviando...' : 'Enviar raspa para validar'}
      </button>
    </form>
  )
}
