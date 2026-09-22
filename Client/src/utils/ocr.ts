import { obtenerImagen } from '../services/raspas.service'

declare global {
  interface Window {
    Tesseract?: {
      recognize: (
        image: Blob,
        langs?: string,
        options?: { logger?: (info: unknown) => void },
      ) => Promise<{ data: { text: string } }>
    }
  }
}

export type LadoImagen = 'frente' | 'reverso' | 'error'

const URL_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'

let promesaTesseract: Promise<void> | null = null

const cacheDigitos = new Map<string, string>()

export const cargarLibreriaOcr = (): Promise<void> => {
  if (window.Tesseract) return Promise.resolve()
  if (!promesaTesseract) {
    promesaTesseract = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = URL_TESSERACT
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        promesaTesseract = null
        reject(new Error('No se pudo cargar el OCR desde el CDN'))
      }
      document.head.appendChild(script)
    })
  }
  return promesaTesseract
}

export const soloDigitos = (texto: string): string => texto.replace(/[^0-9]/g, '')

export const leerDigitosDeImagen = async (
  id: number,
  lado: LadoImagen,
): Promise<string> => {
  const key = `${id}:${lado}`
  const cacheado = cacheDigitos.get(key)
  if (cacheado !== undefined) return cacheado

  await cargarLibreriaOcr()
  const blob = await obtenerImagen(id, lado)
  const resultado = await window.Tesseract!.recognize(blob, 'eng', { logger: () => undefined })
  const digitos = soloDigitos(resultado.data.text)
  cacheDigitos.set(key, digitos)
  return digitos
}