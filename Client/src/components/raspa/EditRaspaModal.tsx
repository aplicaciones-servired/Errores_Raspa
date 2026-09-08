import { useState } from 'react'
import ImageUploader from '../ui/ImageUploader'
import { useToast } from '../ui/ToastContext'
import { EMPRESAS, TIPO_RASPAS } from '../../utils/const'
import { actualizarRaspa } from '../../services/raspas.service'
import type { RaspaData } from '../../types/raspa'

interface Props {
  raspa: RaspaData
  onClose: () => void
  onGuardado: () => Promise<void>
}

export default function EditRaspaModal({ raspa, onClose, onGuardado }: Props) {
  const { showToast } = useToast()
  const [empresa, setEmpresa] = useState(raspa.empresa)
  const [nombre, setNombre] = useState(raspa.nombre)
  const [tipoRaspa, setTipoRaspa] = useState(raspa.tipoRaspa)
  const [frente, setFrente] = useState<string | null>(null)
  const [reverso, setReverso] = useState<string | null>(null)
  const [errorImg, setErrorImg] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresa || !nombre.trim() || !tipoRaspa) {
      showToast('Empresa, nombre y tipo de raspa son obligatorios', 'error')
      return
    }
    setGuardando(true)
    try {
      await actualizarRaspa(raspa.id, {
        empresa,
        nombre: nombre.trim(),
        tipoRaspa,
        ...(frente ? { imagenFrente: frente } : {}),
        ...(reverso ? { imagenReverso: reverso } : {}),
        ...(errorImg ? { imagenError: errorImg } : {}),
      })
      showToast('Raspa actualizada correctamente', 'success')
      onClose()
      await onGuardado()
    } catch (err) {
      console.error('Error al actualizar raspa:', err)
      showToast('Error al actualizar la raspa', 'error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Editar raspa #{raspa.id}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            &#10005;
          </button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Selecciona</option>
                {EMPRESAS.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</label>
              <select
                value={tipoRaspa}
                onChange={(e) => setTipoRaspa(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Selecciona</option>
                {TIPO_RASPAS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Reemplazar imagenes (opcional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ImageUploader label="Frente" dataUrl={frente} onChange={setFrente} />
              <ImageUploader label="Reverso" dataUrl={reverso} onChange={setReverso} />
              <ImageUploader label="Error" dataUrl={errorImg} onChange={setErrorImg} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}