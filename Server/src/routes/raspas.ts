import { Router, Request, Response } from 'express'
import Raspa from '../models/Raspa'
import { uploadImage } from '../services/minioClient'

const router = Router()

const parseDataUrl = (dataUrl: string): { buffer: Buffer; mime: string } | null => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mime: match[1],
  }
}

const toExtension = (mime: string): string => {
  switch (mime) {
    case 'image/png':
      return '.png'
    case 'image/jpeg':
      return '.jpg'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    default:
      return '.jpg'
  }
}

router.post('/raspas', async (req: Request, res: Response) => {
  try {
    const { empresa, nombre, tipoRaspa, imagenFrente, imagenReverso, imagenError } = req.body

    if (!empresa || !nombre || !tipoRaspa || !imagenFrente || !imagenReverso || !imagenError) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' })
      return
    }

    const frente = parseDataUrl(imagenFrente)
    const reverso = parseDataUrl(imagenReverso)
    const error = parseDataUrl(imagenError)

    if (!frente || !reverso || !error) {
      res.status(400).json({ error: 'Formato de imagen invalido' })
      return
    }

    const upload = (data: { buffer: Buffer; mime: string }, folder: string) =>
      uploadImage(data.buffer, `image${toExtension(data.mime)}`, folder, data.mime)

    const [urlFrente, urlReverso, urlError] = await Promise.all([
      upload(frente, 'frente'),
      upload(reverso, 'reverso'),
      upload(error, 'error'),
    ])

    const raspa = await Raspa.create({
      empresa,
      nombre,
      tipoRaspa,
      imagenFrenteUrl: urlFrente.url,
      imagenReversoUrl: urlReverso.url,
      imagenErrorUrl: urlError.url,
      estado: 'PENDIENTE',
    })

    res.status(201).json(raspa)
  } catch (err) {
    console.error('Error al guardar raspa:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/raspas', async (_req: Request, res: Response) => {
  try {
    const raspas = await Raspa.findAll({ order: [['createdAt', 'DESC']] })
    res.json(raspas)
  } catch (err) {
    console.error('Error al listar raspas:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router