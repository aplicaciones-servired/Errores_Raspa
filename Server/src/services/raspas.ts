import { Op } from 'sequelize'
import sequelize from '../db/connection'
import Raspa, { type RaspaAttributes } from '../models/Raspa'
import { uploadImage } from './minioClient'
import { enviarCorreoReporteSemanal, enviarCorreoValidacion } from './email'
import { capturarRequestId, type CapturaResult } from './ticketReader'
import { ESTADOS, type RaspaEstado } from '../constants/estados'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
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

interface ContextoCaptura {
  tipoRaspa: string
  empresa: string
  correoMessageId?: string
  raspaId?: number
}

const capturarIdConReintentos = async (
  contexto?: ContextoCaptura,
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

interface ContextoCapturaSegundoPlano {
  raspaId: number
  tipoRaspa: string
  empresa: string
  correoMessageId: string
}

const capturarRequestIdEnSegundoPlano = async (
  contexto: ContextoCapturaSegundoPlano,
): Promise<void> => {
  try {
    const resultado = await capturarIdConReintentos(contexto)
    if (!resultado) return

    const raspa = await Raspa.findByPk(contexto.raspaId)
    if (!raspa) return

    await raspa.update({
      requestId: resultado.requestId,
      respuestaSoporte: resultado.respuesta,
      estado: ESTADOS.PENDIENTE,
    })
    console.log(`[raspas] request_id ${resultado.requestId} guardado en segundo plano en raspa ${contexto.raspaId}`)
  } catch (err) {
    console.error(`[raspas] captura en segundo plano fallo para raspa ${contexto.raspaId}:`, err)
  }
}

export interface RegistroRaspaInput {
  empresa: string
  nombre: string
  tipoRaspa: string
  imagenFrente: string
  imagenReverso: string
  imagenError: string
}

export const registrarRaspa = async (
  input: RegistroRaspaInput,
): Promise<object> => {
  const { empresa, nombre, tipoRaspa, imagenFrente, imagenReverso, imagenError } = input

  if (!empresa || !nombre || !tipoRaspa || !imagenFrente || !imagenReverso || !imagenError) {
    throw new HttpError(400, 'Todos los campos son obligatorios')
  }

  const frente = parseDataUrl(imagenFrente)
  const reverso = parseDataUrl(imagenReverso)
  const error = parseDataUrl(imagenError)

  if (!frente || !reverso || !error) {
    throw new HttpError(400, 'Formato de imagen invalido')
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
    estado: ESTADOS.PENDIENTE,
  })

  const adjunto = (data: { buffer: Buffer; mime: string }, nombreArchivo: string) => ({
    filename: nombreArchivo,
    buffer: data.buffer,
    contentType: data.mime,
  })

  try {
    const raspaId = raspa.getDataValue('id')
    if (typeof raspaId !== 'number') {
      console.error(`[raspas] raspa ${raspa.getDataValue('id')} sin id numerico, no se puede capturar request id`)
      return raspa.toJSON()
    }
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
    await raspa.update({ correoMessageId })

    console.log(`[raspas] Iniciando captura de request id en segundo plano para raspa ${raspaId}...`)
    void capturarRequestIdEnSegundoPlano({ raspaId, tipoRaspa, empresa, correoMessageId })

    return raspa.toJSON()
  } catch (correoErr) {
    console.error('Error al enviar correo o capturar id para raspa ' + raspa.getDataValue('id') + ':', correoErr)
    return raspa.toJSON()
  }
}

export const listarRaspas = async (filtros: FiltrosListaRaspa = {}): Promise<ListaRaspasResultado> => {
  const pagina = Math.max(1, Number(filtros.pagina) || 1)
  const limite = Math.min(100, Math.max(1, Number(filtros.limite) || 6))
  const where: Record<string, unknown> = {}

  if (filtros.estado) where.estado = filtros.estado
  if (filtros.nombre) where.nombre = { [Op.like]: `%${filtros.nombre}%` }
  if (filtros.empresa) where.empresa = filtros.empresa
  if (filtros.requestId) where.requestId = { [Op.like]: `%${filtros.requestId}%` }
  if (filtros.desde || filtros.hasta) {
    const rango: Record<string, Date> = {}
    if (filtros.desde) rango[Op.gte as unknown as string] = new Date(`${filtros.desde}T00:00:00`)
    if (filtros.hasta) rango[Op.lte as unknown as string] = new Date(`${filtros.hasta}T23:59:59`)
    where.createdAt = rango
  }

  const { rows, count } = await Raspa.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: limite,
    offset: (pagina - 1) * limite,
  })

  return {
    datos: rows,
    total: count,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(count / limite)),
  }
}

export interface FiltrosListaRaspa {
  pagina?: number
  limite?: number
  estado?: string
  nombre?: string
  empresa?: string
  requestId?: string
  desde?: string
  hasta?: string
}

export interface ListaRaspasResultado {
  datos: Raspa[]
  total: number
  pagina: number
  totalPaginas: number
}

export interface ActualizarRaspaInput {
  nombre?: string
  empresa?: string
  tipoRaspa?: string
  estado?: RaspaEstado
  imagenFrente?: string
  imagenReverso?: string
  imagenError?: string
}

const MAPA_CAMPOS_IMAGEN: Array<{
  campo: 'imagenFrente' | 'imagenReverso' | 'imagenError'
  attr: 'imagenFrenteUrl' | 'imagenReversoUrl' | 'imagenErrorUrl'
  carpeta: string
}> = [
  { campo: 'imagenFrente', attr: 'imagenFrenteUrl', carpeta: 'frente' },
  { campo: 'imagenReverso', attr: 'imagenReversoUrl', carpeta: 'reverso' },
  { campo: 'imagenError', attr: 'imagenErrorUrl', carpeta: 'error' },
]

export const actualizarRaspa = async (
  id: string,
  input: ActualizarRaspaInput,
): Promise<Raspa> => {
  const raspa = await Raspa.findByPk(id)
  if (!raspa) {
    throw new HttpError(404, 'Raspa no encontrada')
  }

  const cambios: Partial<RaspaAttributes> = {}
  if (input.nombre !== undefined) cambios.nombre = input.nombre.trim()
  if (input.empresa !== undefined) cambios.empresa = input.empresa.trim()
  if (input.tipoRaspa !== undefined) cambios.tipoRaspa = input.tipoRaspa.trim()
  if (input.estado !== undefined) {
    if (!Object.values(ESTADOS).includes(input.estado)) {
      throw new HttpError(400, 'Estado invalido')
    }
    cambios.estado = input.estado
  }

  for (const { campo, attr, carpeta } of MAPA_CAMPOS_IMAGEN) {
    const valor = input[campo]
    if (typeof valor === 'string' && valor.length > 0) {
      const parsed = parseDataUrl(valor)
      if (!parsed) {
        throw new HttpError(400, 'Formato de imagen invalido')
      }
      const subida = await uploadImage(
        parsed.buffer,
        `image${toExtension(parsed.mime)}`,
        carpeta,
        parsed.mime,
      )
      cambios[attr] = subida.url
    }
  }

  await raspa.update(cambios)
  return raspa
}

export interface ReporteSemanal {
  periodo: string
  totalSemana: number
  resueltos: number
  pendientes: number
  rechazados: number
  porEmpresa: EstadisticaEmpresa[]
  porTipo: EstadisticaTipo[]
}

export const generarReporteSemanal = async (): Promise<ReporteSemanal> => {
  const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalSemana, porEstado, porEmpresaRa, porTipoRa] = await Promise.all([
    Raspa.count({ where: { createdAt: { [Op.gte]: hace7 } } }),
    Raspa.findAll({
      where: { createdAt: { [Op.gte]: hace7 } },
      attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('estado')), 'cantidad']],
      group: ['estado'],
      raw: true,
    }),
    Raspa.findAll({
      where: { createdAt: { [Op.gte]: hace7 } },
      attributes: ['empresa', [sequelize.fn('COUNT', sequelize.col('empresa')), 'cantidad']],
      group: ['empresa'],
      order: [[sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    }),
    Raspa.findAll({
      where: { createdAt: { [Op.gte]: hace7 } },
      attributes: [
        ['tipo_raspa', 'tipoRaspa'],
        [sequelize.fn('COUNT', sequelize.col('tipo_raspa')), 'cantidad'],
      ],
      group: ['tipo_raspa'],
      order: [[sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    }),
  ])

  const estadoMap = new Map<string, number>()
  for (const fila of porEstado as unknown as Array<{ estado: string; cantidad: number }>) {
    estadoMap.set(fila.estado, fila.cantidad)
  }

  const hoy = new Date()
  const hace7F = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
  const formato = (d: Date) =>
    d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

  return {
    periodo: `${formato(hace7F)} - ${formato(hoy)}`,
    totalSemana,
    resueltos: estadoMap.get(ESTADOS.RESUELTO) ?? 0,
    pendientes: estadoMap.get(ESTADOS.PENDIENTE) ?? 0,
    rechazados: estadoMap.get(ESTADOS.RECHAZADO) ?? 0,
    porEmpresa: porEmpresaRa as unknown as EstadisticaEmpresa[],
    porTipo: porTipoRa as unknown as EstadisticaTipo[],
  }
}

export const enviarReporteSemanal = async (): Promise<{ enviado: true; messageId: string }> => {
  const reporte = await generarReporteSemanal()
  const messageId = await enviarCorreoReporteSemanal(reporte)
  return { enviado: true, messageId }
}

export interface EstadisticaEstado {
  estado: string
  cantidad: number
}

export interface EstadisticaEmpresa {
  empresa: string
  cantidad: number
}

export interface EstadisticaTipo {
  tipoRaspa: string
  cantidad: number
}

export interface EstadisticaDiaria {
  fecha: string
  cantidad: number
}

export interface EstadisticaEmbudo {
  grupo: string
  cantidad: number
}

export interface FiltrosEstadisticas {
  empresa?: string
  desde?: string
  hasta?: string
}

export interface EstadisticasRaspa {
  total: number
  pendientes: number
  resueltos: number
  rechazados: number
  sinRespuesta: number
  conRequestId: number
  resolucionPct: number
  tiempoPromedioResolucionHs: number
  pendientes24h: number
  pendientes48h: number
  embudo: EstadisticaEmbudo[]
  porEstado: EstadisticaEstado[]
  porEmpresa: EstadisticaEmpresa[]
  porTipo: EstadisticaTipo[]
  ultimos7Dias: EstadisticaDiaria[]
  ultimos30Dias: EstadisticaDiaria[]
}

const rangoFechas = (desde?: string, hasta?: string): Record<string, Date> | null => {
  if (!desde && !hasta) return null
  const rango: Record<string, Date> = {}
  if (desde) rango[Op.gte as unknown as string] = new Date(`${desde}T00:00:00`)
  if (hasta) rango[Op.lte as unknown as string] = new Date(`${hasta}T23:59:59`)
  return rango
}

const calcularVentanaSerie = (
  desde?: string,
  hasta?: string,
): { inicio: Date; fin: Date; dias: number } => {
  const hoy = new Date()
  const hace30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
  let inicio = hace30
  let fin = hoy
  if (desde) {
    const d0 = new Date(`${desde}T00:00:00`)
    if (d0.getTime() > inicio.getTime()) inicio = d0
  }
  if (hasta) {
    const d1 = new Date(`${hasta}T23:59:59`)
    if (d1.getTime() < fin.getTime()) fin = d1
  }
  if (fin.getTime() < inicio.getTime()) fin = inicio
  const dias = Math.min(92, Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1))
  return { inicio, fin, dias }
}

export const obtenerEstadisticas = async (
  filtros: FiltrosEstadisticas = {},
): Promise<EstadisticasRaspa> => {
  const { inicio: inicioSerie, fin: finSerie, dias: diasSerie } = calcularVentanaSerie(
    filtros.desde,
    filtros.hasta,
  )

  const whereFiltros: Record<string, unknown> = {}
  if (filtros.empresa) whereFiltros.empresa = filtros.empresa
  const rango = rangoFechas(filtros.desde, filtros.hasta)
  if (rango) whereFiltros.createdAt = rango

  const [total, porEstadoRaw, porEmpresaRaw, porTipoRaw, diariosRaw] = await Promise.all([
    Raspa.count({ where: whereFiltros }),
    Raspa.findAll({
      where: whereFiltros,
      attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('estado')), 'cantidad']],
      group: ['estado'],
      raw: true,
    }),
    Raspa.findAll({
      where: whereFiltros,
      attributes: ['empresa', [sequelize.fn('COUNT', sequelize.col('empresa')), 'cantidad']],
      group: ['empresa'],
      order: [[sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    }),
    Raspa.findAll({
      where: whereFiltros,
      attributes: [
        ['tipo_raspa', 'tipoRaspa'],
        [sequelize.fn('COUNT', sequelize.col('tipo_raspa')), 'cantidad'],
      ],
      group: ['tipo_raspa'],
      order: [[sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    }),
    Raspa.findAll({
      where: {
        ...(filtros.empresa ? { empresa: filtros.empresa } : {}),
        createdAt: { [Op.gte]: inicioSerie, [Op.lte]: finSerie },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'fecha'],
        [sequelize.fn('COUNT', sequelize.col('created_at')), 'cantidad'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true,
    }),
  ])

  const porEstado = porEstadoRaw as unknown as Array<{ estado: string; cantidad: number }>
  const porEmpresa = porEmpresaRaw as unknown as Array<{ empresa: string; cantidad: number }>
  const porTipo = porTipoRaw as unknown as Array<{ tipoRaspa: string; cantidad: number }>
  const diarios = diariosRaw as unknown as Array<{ fecha: string; cantidad: number }>

  const estadoMap = new Map<string, number>()
  for (const fila of porEstado) {
    estadoMap.set(fila.estado, fila.cantidad)
  }

  const pendientes = estadoMap.get(ESTADOS.PENDIENTE) ?? 0
  const resueltos = estadoMap.get(ESTADOS.RESUELTO) ?? 0
  const rechazados = estadoMap.get(ESTADOS.RECHAZADO) ?? 0

  const [conRequestId, sinRespuesta, pendientes24h, pendientes48h, pendientesConId, resueltosRows] =
    await Promise.all([
      Raspa.count({
        where: { ...whereFiltros, requestId: { [Op.ne]: null } },
      }),
      Raspa.count({
        where: {
          ...whereFiltros,
          [Op.or]: [
            { requestId: null },
            { respuestaSoporte: null },
            { respuestaSoporte: '' },
          ],
        },
      }),
      Raspa.count({
        where: {
          ...whereFiltros,
          estado: ESTADOS.PENDIENTE,
          createdAt: { [Op.lte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      Raspa.count({
        where: {
          ...whereFiltros,
          estado: ESTADOS.PENDIENTE,
          createdAt: { [Op.lte]: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
      }),
      Raspa.count({
        where: {
          ...whereFiltros,
          estado: ESTADOS.PENDIENTE,
          requestId: { [Op.ne]: null },
        },
      }),
      Raspa.findAll({
        where: { ...whereFiltros, estado: ESTADOS.RESUELTO },
        attributes: ['createdAt', 'updatedAt'],
      }),
    ])

  const horasResueltos = resueltosRows.reduce((acc, r) => {
    const creada = new Date(r.getDataValue('createdAt') as Date).getTime()
    const actualizada = new Date(r.getDataValue('updatedAt') as Date).getTime()
    return acc + Math.max(0, (actualizada - creada) / 3600000)
  }, 0)
  const tiempoPromedioResolucionHs =
    resueltosRows.length === 0
      ? 0
      : Math.round((horasResueltos / resueltosRows.length) * 10) / 10

  const embudo: EstadisticaEmbudo[] = [
    { grupo: 'SIN_REQUEST_ID', cantidad: pendientes - pendientesConId },
    { grupo: 'CON_REQUEST_ID', cantidad: pendientesConId },
    { grupo: ESTADOS.RESUELTO, cantidad: resueltos },
    { grupo: ESTADOS.RECHAZADO, cantidad: rechazados },
  ].filter((e) => e.cantidad > 0)

  const serieCompleta = completarFechas(diarios, diasSerie)
  const ultimos7Dias = serieCompleta.slice(-7)

  return {
    total,
    pendientes,
    resueltos,
    rechazados,
    sinRespuesta,
    conRequestId,
    resolucionPct: total === 0 ? 0 : Math.round((resueltos / total) * 100),
    tiempoPromedioResolucionHs,
    pendientes24h,
    pendientes48h,
    embudo,
    porEstado: Array.from(estadoMap, ([estado, cantidad]) => ({ estado, cantidad })),
    porEmpresa,
    porTipo,
    ultimos7Dias,
    ultimos30Dias: serieCompleta,
  }
}

const completarFechas = (
  filas: Array<{ fecha: string; cantidad: number }>,
  dias: number,
): EstadisticaDiaria[] => {
  const mapa = new Map<string, number>()
  for (const fila of filas) {
    if (fila.fecha) mapa.set(fila.fecha.slice(0, 10), fila.cantidad)
  }

  const resultado: EstadisticaDiaria[] = []
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - i)
    const clave = fecha.toISOString().slice(0, 10)
    resultado.push({
      fecha: clave,
      cantidad: mapa.get(clave) ?? 0,
    })
  }
  return resultado
}

export interface VerificacionOk {
  respondido: true
  requestId: string | null
  respuesta: string | null
  mensaje: string
}

export interface VerificacionPendiente {
  respondido: false
  requestId: null
  respuesta: null
  mensaje: string
}

export type VerificacionResultado = VerificacionOk | VerificacionPendiente

export const verificarRespuesta = async (id: string): Promise<VerificacionResultado> => {
  const raspa = await Raspa.findByPk(id)
  if (!raspa) {
    throw new HttpError(404, 'Raspa no encontrada')
  }

  if (raspa.getDataValue('requestId') && raspa.getDataValue('respuestaSoporte')) {
    if (raspa.getDataValue('estado') !== ESTADOS.RESUELTO) {
      await raspa.update({ estado: ESTADOS.RESUELTO })
    }
    return {
      respondido: true,
      requestId: raspa.getDataValue('requestId') ?? null,
      respuesta: raspa.getDataValue('respuestaSoporte') ?? null,
      mensaje: 'Ya tiene respuesta registrada. Estado actualizado a RESUELTO',
    }
  }

  const correoMessageId = raspa.getDataValue('correoMessageId')
  const requestId = raspa.getDataValue('requestId')
  if (!correoMessageId && !requestId) {
    return {
      respondido: false,
      requestId: null,
      respuesta: null,
      mensaje: 'No se envio correo de validacion para esta raspa',
    }
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
      estado: ESTADOS.RESUELTO,
    })
    console.log(`[raspas] Respuesta encontrada para raspa ${raspa.getDataValue('id')}: request_id=${resultado.requestId}. Estado -> RESUELTO`)
    return {
      respondido: true,
      requestId: resultado.requestId,
      respuesta: resultado.respuesta,
      mensaje: 'Respuesta encontrada y guardada. Estado actualizado a RESUELTO',
    }
  }

  console.log(`[raspas] Sin respuesta aun para raspa ${raspa.getDataValue('id')}`)
  return {
    respondido: false,
    requestId: null,
    respuesta: null,
    mensaje: 'Aun no hay respuesta de soporte',
  }
}