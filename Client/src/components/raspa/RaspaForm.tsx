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
      className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-8 flex flex-col gap-6 max-w-4xl mx-auto"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registrar Raspa</h2>
        <p className="text-sm text-gray-500 mt-1">
          Completa el tipo e ingresa las tres imagenes del raspa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Empresa</label>
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 transition-all"
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de quien envia"
            className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Tipo de raspa</label>
          <select
            value={tipoRaspa}
            onChange={(e) => setTipoRaspa(e.target.value)}
            className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 transition-all"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ImageUploader label="Frente" dataUrl={frente} onChange={setFrente} />
        <ImageUploader label="Reverso" dataUrl={reverso} onChange={setReverso} />
        <ImageUploader label="Error" dataUrl={error} onChange={setError} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enviando...
          </span>
        ) : (
          'Enviar raspa para validar'
        )}
      </button>
    </form>
  )
}
