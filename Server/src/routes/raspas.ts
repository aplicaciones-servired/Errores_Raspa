import { Router, type Request, type Response } from 'express'
import {
  HttpError,
  actualizarRaspa,
  enviarReporteSemanal,
  listarRaspas,
  obtenerEstadisticas,
  registrarRaspa,
  verificarRespuesta,
} from '../services/raspas'

const router = Router()

router.post('/raspas', async (req: Request, res: Response) => {
  try {
    const resultado = await registrarRaspa(req.body)
    res.status(201).json(resultado)
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('Error al guardar raspa:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/raspas', async (req: Request, res: Response) => {
  try {
    const raspas = await listarRaspas({
      pagina: req.query.pagina ? Number(req.query.pagina) : undefined,
      limite: req.query.limite ? Number(req.query.limite) : undefined,
      estado: typeof req.query.estado === 'string' ? req.query.estado : undefined,
      nombre: typeof req.query.nombre === 'string' ? req.query.nombre : undefined,
      empresa: typeof req.query.empresa === 'string' ? req.query.empresa : undefined,
      requestId: typeof req.query.requestId === 'string' ? req.query.requestId : undefined,
      desde: typeof req.query.desde === 'string' ? req.query.desde : undefined,
      hasta: typeof req.query.hasta === 'string' ? req.query.hasta : undefined,
    })
    res.json(raspas)
  } catch (err) {
    console.error('Error al listar raspas:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/raspas/estadisticas', async (req: Request, res: Response) => {
  try {
    const estadisticas = await obtenerEstadisticas({
      empresa: typeof req.query.empresa === 'string' ? req.query.empresa : undefined,
      desde: typeof req.query.desde === 'string' ? req.query.desde : undefined,
      hasta: typeof req.query.hasta === 'string' ? req.query.hasta : undefined,
    })
    res.json(estadisticas)
  } catch (err) {
    console.error('Error al obtener estadisticas:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.patch('/raspas/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await actualizarRaspa(String(req.params.id), req.body)
    res.json(resultado)
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('Error al actualizar raspa:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/raspas/reporte', async (_req: Request, res: Response) => {
  try {
    const resultado = await enviarReporteSemanal()
    res.json(resultado)
  } catch (err) {
    console.error('Error al enviar reporte semanal:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/raspas/:id/verificar-respuesta', async (req: Request, res: Response) => {
  try {
    const resultado = await verificarRespuesta(String(req.params.id))
    res.json(resultado)
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('Error al verificar respuesta:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router