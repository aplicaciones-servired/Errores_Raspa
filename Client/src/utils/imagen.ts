const MAX_LADO = 1400
const CALIDAD = 0.82

const leerImagen = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = dataUrl
  })

export const comprimirImagen = async (
  dataUrl: string,
  mime = 'image/jpeg',
): Promise<string> => {
  try {
    const img = await leerImagen(dataUrl)
    const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height))
    const ancho = Math.max(1, Math.round(img.width * escala))
    const alto = Math.max(1, Math.round(img.height * escala))

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl

    if (mime !== 'image/png') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, ancho, alto)
    }
    ctx.drawImage(img, 0, 0, ancho, alto)

    const salida = mime === 'image/png' ? 'image/png' : 'image/jpeg'
    return canvas.toDataURL(salida, CALIDAD)
  } catch {
    return dataUrl
  }
}

export const formatoDesdeDataUrl = (dataUrl: string): string => {
  const match = /^data:([^;]+);/.exec(dataUrl)
  return match ? match[1] : 'image/jpeg'
}