import { Router, Request, Response } from 'express'
import Raspa from '../models/Raspa'
import { uploadImage } from '../services/minioClient'
import { enviarCorreoValidacion } from '../services/email'
import { capturarRequestId, type CapturaResult } from '../services/ticketReader'

const router = Router()

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

const parseDataUrl = (dataUrl: string): { buffer: Buffer; mime: string } | null => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mime: match[1],
  }
}

const esperar = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const TIEMPO_MAXIMO_CAPTURA_MS = 5 * 60 * 1000
const ESPERA_ENTRE_INTENTOS_MS = 5000

const capturarIdConReintentos = async (
  contexto?: { tipoRaspa: string; empresa: string; correoMessageId?: string },
): Promise<CapturaResult | null> => {
  const inicio = Date.now()
  let intento = 0
  let ultimoError: unknown = null

  while (Date.now() - inicio < TIEMPO_MAXIMO_CAPTURA_MS) {
    intento += 1
    try {
      const resultado = await capturarRequestId(contexto)
      if (resultado) {
        console.log(`[raspas] captura exitosa en intento ${intento}: request_id=${resultado.requestId}`)
        return resultado
      }
      console.log(`[raspas] intento ${intento}: aun no hay respuesta, reintentando...`)
    } catch (err) {
      ultimoError = err
      console.error(`[raspas] intento ${intento} de captura de request id fallo:`, err)
    }
    await esperar(ESPERA_ENTRE_INTENTOS_MS)
  }

  console.error(
    `[raspas] se agoto el tiempo (${TIEMPO_MAXIMO_CAPTURA_MS / 60000} min) esperando request id` +
      (ultimoError ? `; ultimo error: ${String(ultimoError)}` : ''),
  )
  return null
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

    const adjunto = (data: { buffer: Buffer; mime: string }, nombreArchivo: string) => ({
      filename: nombreArchivo,
      buffer: data.buffer,
      contentType: data.mime,
    })

    try {
      const raspaId = raspa.getDataValue('id')
      console.log(`[raspas] Enviando correo de validacion para raspa ${raspaId} (${tipoRaspa} / ${empresa})`)
      const correoMessageId = await enviarCorreoValidacion({
        tipoRaspa,
        empresa,
        imagenes: {
          frente: adjunto(frente, `frente${toExtension(frente.mime)}`),
          reverso: adjunto(reverso, `reverso${toExtension(reverso.mime)}`),
          error: adjunto(error, `error${toExtension(error.mime)}`),
        },
      })

      console.log(`[raspas] Capturando request id para raspa ${raspaId}...`)
      const captura = await capturarIdConReintentos({ tipoRaspa, empresa, correoMessageId })
      console.log(`[raspas] Resultado captura:`, captura ? `request_id=${captura.requestId}` : 'no encontrado')
      if (captura) {
        await raspa.update({
          requestId: captura.requestId,
          correoMessageId,
          respuestaSoporte: captura.respuesta,
        })
        console.log(`[raspas] request_id ${captura.requestId} guardado en raspa ${raspaId}`)
      } else {
        await raspa.update({ correoMessageId })
      }

      res.status(201).json({ ...raspa.toJSON(), requestId: captura?.requestId ?? null })
    } catch (correoErr) {
      console.error('Error al enviar correo o capturar id para raspa ' + raspa.getDataValue('id') + ':', correoErr)
      res.status(201).json(raspa.toJSON())
    }
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

router.get('/raspas/:id/verificar-respuesta', async (req: Request, res: Response) => {
  try {
    const raspa = await Raspa.findByPk(String(req.params.id))
    if (!raspa) {
      res.status(404).json({ error: 'Raspa no encontrada' })
      return
    }

    if (raspa.getDataValue('requestId') && raspa.getDataValue('respuestaSoporte')) {
      res.json({
        respondido: true,
        requestId: raspa.getDataValue('requestId'),
        respuesta: raspa.getDataValue('respuestaSoporte'),
        mensaje: 'Ya tiene respuesta registrada',
      })
      return
    }

    const correoMessageId = raspa.getDataValue('correoMessageId')
    if (!correoMessageId) {
      res.json({
        respondido: false,
        requestId: null,
        respuesta: null,
        mensaje: 'No se envio correo de validacion para esta raspa',
      })
      return
    }

    console.log(`[raspas] Verificando respuesta para raspa ${raspa.getDataValue('id')}...`)
    const resultado = await capturarRequestId({
      tipoRaspa: raspa.getDataValue('tipoRaspa'),
      empresa: raspa.getDataValue('empresa'),
      correoMessageId,
    })

    if (resultado) {
      await raspa.update({
        requestId: resultado.requestId,
        respuestaSoporte: resultado.respuesta,
      })
      console.log(`[raspas] Respuesta encontrada para raspa ${raspa.getDataValue('id')}: request_id=${resultado.requestId}`)
      res.json({
        respondido: true,
        requestId: resultado.requestId,
        respuesta: resultado.respuesta,
        mensaje: 'Respuesta encontrada y guardada',
      })
    } else {
      console.log(`[raspas] Sin respuesta aun para raspa ${raspa.getDataValue('id')}`)
      res.json({
        respondido: false,
        requestId: null,
        respuesta: null,
        mensaje: 'Aun no hay respuesta de soporte',
      })
    }
  } catch (err) {
    console.error('Error al verificar respuesta:', err)
    res.status(500).json({ error: 'Error interno del servidor' }
    )
  }
})

export default router
