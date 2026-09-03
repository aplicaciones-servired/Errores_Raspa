import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import '../config/env'

const LOG = (msg: string, data?: unknown): void => {
  console.log(`[ticketReader] ${msg}`, data !== undefined ? JSON.stringify(data) : '')
}

const host = process.env.IMAP_HOST || 'imap.gmail.com'
const port = Number(process.env.IMAP_PORT) || 993
const secure = process.env.IMAP_SECURE === 'true'
const user = process.env.IMAP_USER || ''
const pass = process.env.IMAP_PASS || ''

const REMITENTE = 'soportetecnico@superloterias.co'
const BUSCAR_ATRAS_HORAS = 24

const extraerRequestId = (texto: string): string | null => {
  const cuerpo = texto.replace(/\r?\n/g, ' ')
  const patrones = [
    /##RE-(\d+)##/i,
    /request\s*id\s*(?:es|:)?\s*#?RE?-?(\d+)/i,
    /creada\s+exitosamente\s+con\s+el\s+ID\s+(\d+)/i,
    /ID\s+(\d{4,})/i,
  ]
  for (const re of patrones) {
    const m = cuerpo.match(re)
    if (m) return m[1]
  }
  return null
}

const leerCuerpo = async (
  client: ImapFlow,
  uid: number,
): Promise<{ cuerpo: string; asunto: string }> => {
  const mensaje = await client.fetchOne(uid, { source: true, envelope: true, uid: true })
  if (!mensaje || !mensaje.source) return { cuerpo: '', asunto: '' }
  const asunto = mensaje.envelope?.subject ?? ''
  const parsed = await simpleParser(Buffer.isBuffer(mensaje.source) ? mensaje.source : Buffer.from(mensaje.source))
  return {
    cuerpo: [parsed.text, parsed.html].filter(Boolean).join('\n'),
    asunto,
  }
}

export const capturarRequestId = async (
  contexto?: { tipoRaspa: string; empresa: string },
): Promise<string | null> => {
  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false,
  })

  LOG('configuracion IMAP', {
    host,
    port,
    secure,
    user,
    passConfigurada: pass.length > 0,
    tamanoPass: pass.length,
  })

  try {
    LOG('conectando a IMAP...')
    await client.connect()
    LOG('conexion IMAP establecida')

    LOG('abriendo bandeja INBOX...')
    await client.mailboxOpen('INBOX')
    const mailbox = client.mailbox as { exists?: number; path?: string } | false
    LOG('INBOX abierto', {
      mensajesTotales: mailbox ? mailbox.exists : undefined,
      ruta: mailbox ? mailbox.path : undefined,
    })

    const desde = new Date(Date.now() - BUSCAR_ATRAS_HORAS * 60 * 60 * 1000)
    LOG('buscando correos', { remitente: REMITENTE, desde: desde.toISOString() })

    const uids = await client.search({ from: REMITENTE, since: desde })
    LOG('resultado de busqueda', { cantidad: uids ? uids.length : 0 })
    if (!uids || uids.length === 0) return null

    const lock = await client.getMailboxLock('INBOX')
    LOG('lock de INBOX obtenido')
    try {
      const orden = [...uids].sort((a, b) => b - a)
      for (const uid of orden) {
        const { cuerpo, asunto } = await leerCuerpo(client, uid)
        const id = extraerRequestId(`${asunto}\n${cuerpo}`)

        let coincide = true
        if (contexto) {
          const asuntoMin = asunto.toLowerCase()
          const trazaTipo = contexto.tipoRaspa.toLowerCase()
          const trazaEmpresa = contexto.empresa.toLowerCase()
          coincide =
            (asuntoMin.includes(trazaTipo) || cuerpo.toLowerCase().includes(trazaTipo)) &&
            (asuntoMin.includes(trazaEmpresa) || cuerpo.toLowerCase().includes(trazaEmpresa))
        }

        LOG('evaluando correo', {
          uid,
          asunto,
          largoCuerpo: cuerpo.length,
          idEncontrado: id,
          coincideContexto: coincide,
        })

        if (id && coincide) return id
      }
    } finally {
      lock.release()
    }

    LOG('no se encontro request id en ningun correo')
    return null
  } catch (err) {
    console.error('[ticketReader] Error:', err)
    return null
  } finally {
    try {
      await client.logout()
    } catch {
      /* ignorar */
    }
  }
}
