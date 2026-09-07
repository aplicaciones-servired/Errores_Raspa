import { Router, Request, Response } from 'express'
import { Op } from 'sequelize'
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
  contexto?: { tipoRaspa: string; empresa: string; correoMessageId?: string; raspaId?: number },
): Promise<CapturaResult | null> => {
  const inicio = Date.now()
  let intento = 0
  let ultimoError: unknown = null

  while (Date.now() - inicio < TIEMPO_MAXIMO_CAPTURA_MS) {
    intento += 1
    try {
      const ocupadas = await Raspa.findAll({
        where: { requestId: { [Op.ne]: null } },
        attributes: ['requestId'],
      })
      const requestIdsOcupados = new Set(
        ocupadas
          .map((r) => r.getDataValue('requestId'))
          .filter((id): id is string => id != null && id !== ''),
      )

      const resultado = await capturarRequestId({
        tipoRaspa: contexto?.tipoRaspa ?? '',
        empresa: contexto?.empresa ?? '',
        correoMessageId: contexto?.correoMessageId,
        requestIdsOcupados,
        modoHilo: true,
      })
      if (resultado) {
        if (requestIdsOcupados.has(resultado.requestId)) {
          console.log(`[raspas] intento ${intento}: request_id ${resultado.requestId} ya asignado, reintentando...`)
        } else {
          console.log(`[raspas] captura exitosa en intento ${intento}: request_id=${resultado.requestId}`)
          return resultado
        }
      } else {
        console.log(`[raspas] intento ${intento}: aun no hay respuesta, reintentando...`)
      }
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
          estado: 'PENDIENTE',
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
      if (raspa.getDataValue('estado') !== 'RESUELTO') {
        await raspa.update({ estado: 'RESUELTO' })
      }
      res.json({
        respondido: true,
        requestId: raspa.getDataValue('requestId'),
        respuesta: raspa.getDataValue('respuestaSoporte'),
        mensaje: 'Ya tiene respuesta registrada. Estado actualizado a RESUELTO',
      })
      return
    }

    const correoMessageId = raspa.getDataValue('correoMessageId')
    const requestId = raspa.getDataValue('requestId')
    if (!correoMessageId && !requestId) {
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
      correoMessageId: correoMessageId ?? undefined,
      requestIdBuscado: typeof requestId === 'string' ? requestId : undefined,
      modoHilo: true,
    })

    if (resultado && resultado.respuesta.trim().length > 0) {
      await raspa.update({
        requestId: resultado.requestId,
        respuestaSoporte: resultado.respuesta,
        estado: 'RESUELTO',
      })
      console.log(`[raspas] Respuesta encontrada para raspa ${raspa.getDataValue('id')}: request_id=${resultado.requestId}. Estado -> RESUELTO`)
      res.json({
        respondido: true,
        requestId: resultado.requestId,
        respuesta: resultado.respuesta,
        mensaje: 'Respuesta encontrada y guardada. Estado actualizado a RESUELTO',
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
