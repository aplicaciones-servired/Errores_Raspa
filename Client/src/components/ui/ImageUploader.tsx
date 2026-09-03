interface Props {
  label: string
  dataUrl: string | null
  onChange: (dataUrl: string | null) => void
}

export default function ImageUploader({ label, dataUrl, onChange }: Props) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      onChange(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = () => onChange(reader.result as string)
        reader.readAsDataURL(file)
        return
      }
    }
  }

  return (
    <div className="flex flex-col gap-2" onPaste={handlePaste}>
      <label className="font-semibold text-gray-700">{label}</label>

      {dataUrl && (
        <div className="relative w-full max-w-xs mx-auto">
          <img
            src={dataUrl}
            alt={label}
            className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <label className="cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 text-center text-sm text-gray-600 hover:bg-gray-100 hover:border-blue-400 transition">
        Seleccionar imagen
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </label>
      {!dataUrl && (
        <p className="text-xs text-gray-400 text-center">
          O pega la imagen aquí con Ctrl+V
        </p>
      )}
    </div>
  )
}
