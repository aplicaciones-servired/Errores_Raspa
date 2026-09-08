import { Router, type Request, type Response } from 'express'
import {
  HttpError,
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

router.get('/raspas', async (_req: Request, res: Response) => {
  try {
    const raspas = await listarRaspas()
    res.json(raspas)
  } catch (err) {
    console.error('Error al listar raspas:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/raspas/estadisticas', async (_req: Request, res: Response) => {
  try {
    const estadisticas = await obtenerEstadisticas()
    res.json(estadisticas)
  } catch (err) {
    console.error('Error al obtener estadisticas:', err)
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