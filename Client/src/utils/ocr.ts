import { obtenerImagen } from '../services/raspas.service'

declare global {
  interface Window {
    Tesseract?: {
      createWorker: (
        langs?: string,
        oem?: number,
        options?: { logger?: (info: unknown) => void; gzip?: boolean },
      ) => Promise<WorkerOcr>
    }
  }
}

export interface WorkerOcr {
  setParameters: (params: Record<string, string>) => Promise<void>
  recognize: (image: Blob, opts?: Record<string, unknown>) => Promise<{ data: { text: string } }>
}

export type LadoImagen = 'frente' | 'reverso' | 'error'

const URL_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
const CANTIDAD_WORKERS = 3
const MAX_LADO_REDUCCION = 800

let promesaTesseract: Promise<void> | null = null
let pool: WorkerOcr[] | null = null
let promesaPool: Promise<WorkerOcr[]> | null = null
const colasPorWorker: Array<Promise<unknown>> = []
let indiceRoundRobin = 0

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

const crearPool = async (): Promise<WorkerOcr[]> => {
  const workers: WorkerOcr[] = []
  for (let i = 0; i < CANTIDAD_WORKERS; i++) {
    const worker = await window.Tesseract!.createWorker('eng', 1, {
      logger: () => undefined,
      gzip: true,
    })
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      preserve_interword_spaces: '0',
    })
    workers.push(worker)
  }
  return workers
}

export const precalentarOcr = (): Promise<WorkerOcr[]> => {
  if (pool) return Promise.resolve(pool)
  if (!promesaPool) {
    promesaPool = cargarLibreriaOcr()
      .then(crearPool)
      .then((p) => {
        pool = p
        return p
      })
      .catch((err) => {
        promesaPool = null
        throw err
      })
  }
  return promesaPool
}

export const soloDigitos = (texto: string): string => texto.replace(/[^0-9]/g, '')

const reducirImagen = async (blob: Blob): Promise<Blob> => {
  const bitmap = await createImageBitmap(blob)
  const mayor = Math.max(bitmap.width, bitmap.height)
  if (mayor <= MAX_LADO_REDUCCION) {
    bitmap.close()
    return blob
  }
  const escala = MAX_LADO_REDUCCION / mayor
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * escala))
  canvas.height = Math.max(1, Math.round(bitmap.height * escala))
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo convertir la imagen'))),
      'image/jpeg',
      0.85,
    ),
  )
}

export const leerDigitosDeImagen = async (
  id: number,
  lado: LadoImagen,
): Promise<string> => {
  const key = `${id}:${lado}`
  const cacheado = cacheDigitos.get(key)
  if (cacheado !== undefined) return cacheado

  await precalentarOcr()
  const blob = await reducirImagen(await obtenerImagen(id, lado))
  const workers = pool!
  const i = indiceRoundRobin % workers.length
  indiceRoundRobin += 1
  const prev = colasPorWorker[i] ?? Promise.resolve()
  const resultado = prev.then(() => workers[i].recognize(blob).then((r) => soloDigitos(r.data.text)))
  colasPorWorker[i] = resultado.then(
    () => undefined,
    () => undefined,
  )
  const digitos = await resultado
  cacheDigitos.set(key, digitos)
  return digitos
}