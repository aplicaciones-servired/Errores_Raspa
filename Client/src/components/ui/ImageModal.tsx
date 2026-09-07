import { useEffect } from 'react'

interface Props {
  src: string
  alt?: string
  title?: string
  onClose: () => void
}

export default function ImageModal({ src, alt, title, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title ?? 'Imagen'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-all duration-200"
          >
            &#10005;
          </button>
        </div>
        <div className="p-5 overflow-auto flex-1 flex items-center justify-center bg-slate-50">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[75vh] object-contain rounded-xl animate-fade-in"
          />
        </div>
      </div>
    </div>
  )
}
