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
      className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col gap-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <span className="text-white text-lg">&#127915;</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Raspa</h2>
          <p className="text-sm text-slate-400 font-medium">
            Completa el tipo e ingresa las tres imagenes del raspa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="text-base">&#127970;</span>
            Empresa
          </label>
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-200"
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="text-base">&#128100;</span>
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de quien envia"
            className="border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="text-base">&#127920;</span>
            Tipo de raspa
          </label>
          <select
            value={tipoRaspa}
            onChange={(e) => setTipoRaspa(e.target.value)}
            className="border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-200"
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
        className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white font-bold py-4 rounded-2xl hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2.5">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enviando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>&#128640;</span>
            Enviar raspa para validar
          </span>
        )}
      </button>
    </form>
  )
}
