import nodemailer, { type Transporter } from 'nodemailer'
import '../config/env'

const LOG = (msg: string, data?: unknown): void => {
  console.log(`[email] ${msg}`, data !== undefined ? JSON.stringify(data) : '')
}

const escaparHtml = (valor: string): string =>
  valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

interface EmailImage {
  filename: string
  buffer: Buffer
  contentType: string
}

interface ValidacionOptions {
  tipoRaspa: string
  empresa: string
  imagenes: {
    frente: EmailImage
    reverso: EmailImage
    error: EmailImage
  }
}

const host = process.env.SMTP_HOST || 'smtp.office365.com'
const port = Number(process.env.SMTP_PORT) || 587
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER || ''
const pass = process.env.SMTP_PASS || ''
const from = process.env.MAIL_FROM || user

const toList = [
  process.env.MAIL_TO_DIRECTOR,
  process.env.MAIL_TO_SOPORTE,
].filter(Boolean) as string[]

let transporter: Transporter | null = null

const getTransporter = (): Transporter => {
  if (!transporter) {
    LOG('creando transporter', {
      host,
      port,
      secure,
      user,
      from,
      passConfigurada: pass.length > 0,
      tamanoPass: pass.length,
      to: toList,
    })
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
  }
  return transporter
}

const verificarTransporter = async (t: Transporter): Promise<void> => {
  LOG('verificando conexion SMTP...')
  try {
    const ok = await t.verify()
    LOG('conexion SMTP verificada', { ok })
  } catch (err) {
    console.error('[email] Fallo SMTP verify:', err)
    throw err
  }
}

export const enviarCorreoValidacion = async ({
  tipoRaspa,
  empresa,
  imagenes,
}: ValidacionOptions): Promise<string> => {
  const asunto = `Validación estado premio raspe de ${tipoRaspa} gane ${empresa}`
  const tipoRaspaHtml = escaparHtml(tipoRaspa)
  const cuerpo =
    `cordial Saludo\n\n` +
    `Señores; Mesa de Ayuda Redcolsa\n\n` +
    `envío el raspa porque solicitó validar el estado del premio Raspe del sorteo ${tipoRaspa} el cual no dejó pagarlo.\n\n` +
    `Jhon Cebastian Pontón Carabali\n\n` +
    `Analista de Aplicaciones\n\n` +
    `GRUPO EMPRESARIAL SERVIRED S.A.\n\n` +
    `PBX: (602) 5190869 Ext. 122\n\n` +
    `EMAIL: aplicaciones@gruposervired.com.co\n\n` +
    `El horario de este buzón electrónico es lunes a viernes de 8:00 a.m. a 5:00 p.m. y sábados de 8:00 a.m. a 1:00 p.m. Los correos electrónicos que se remitan por fuera del horario laboral se entenderán entregados el día y hora hábil siguiente a su recepción.\n\n` +
    `"Antes de imprimir este mensaje, por favor asegúrese que sea realmente necesario".\n\n` +
    `El Medio Ambiente es nuestro derecho y nuestra responsabilidad.`

  LOG('preparando envio', {
    asunto,
    to: toList,
    from,
    tamanoFrente: imagenes.frente.buffer.length,
    tamanoReverso: imagenes.reverso.buffer.length,
    tamanoError: imagenes.error.buffer.length,
  })

  await verificarTransporter(getTransporter())

  try {
    const info = await getTransporter().sendMail({
      from: `Aplicaciones <${from}>`,
      to: toList.join(', '),
      subject: asunto,
      text: cuerpo,
      html: `
        <p>cordial Saludo</p>
        <p>Señores; Mesa de Ayuda Redcolsa</p>
        <p>envío el raspa porque solicitó validar el estado del premio Raspe del sorteo ${tipoRaspaHtml} el cual no dejó pagarlo.</p>
        <p><strong>Frente</strong></p>
        <p><img src="cid:imagen-frente" alt="Imagen del frente del raspa" width="400" style="display: block; width: 100%; max-width: 400px; height: auto;" /></p>
        <p><strong>Reverso</strong></p>
        <p><img src="cid:imagen-reverso" alt="Imagen del reverso del raspa" width="400" style="display: block; width: 100%; max-width: 400px; height: auto;" /></p>
        <p><strong>Error</strong></p>
        <p><img src="cid:imagen-error" alt="Imagen del error del raspa" width="400" style="display: block; width: 100%; max-width: 400px; height: auto;" /></p>
        <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.15; color: #003b78;">
          <strong>Jhon Cebastian Pontón Carabali</strong><br>
          Analista de Aplicaciones<br><br>
          <strong>GRUPO EMPRESARIAL SERVIRED S.A.</strong><br>
          PBX: (602) 5190869 Ext. 122<br>
          EMAIL: <a href="mailto:aplicaciones@gruposervired.com.co" style="color: #0563c1;">aplicaciones@gruposervired.com.co</a>
        </div>
        <p style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.15; color: #666666;">
          El horario de este buzón electrónico es lunes a viernes de 8:00 a.m. a 5:00 p.m. y sábados de 8:00 a.m. a 1:00 p.m. Los correos electrónicos que se remitan por fuera del horario laboral se entenderán entregados el día y hora hábil siguiente a su recepción.
        </p>
        <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.15; color: #003b78; text-align: center;">
          <em>“Antes de imprimir este mensaje, por favor asegúrese que sea realmente necesario”.</em><br>
          <strong>El Medio Ambiente es nuestro derecho y nuestra responsabilidad.</strong>
        </div>
      `,
      attachments: [
        { filename: imagenes.frente.filename, content: imagenes.frente.buffer, contentType: imagenes.frente.contentType, cid: 'imagen-frente', contentDisposition: 'inline' },
        { filename: imagenes.reverso.filename, content: imagenes.reverso.buffer, contentType: imagenes.reverso.contentType, cid: 'imagen-reverso', contentDisposition: 'inline' },
        { filename: imagenes.error.filename, content: imagenes.error.buffer, contentType: imagenes.error.contentType, cid: 'imagen-error', contentDisposition: 'inline' },
      ],
    })
    LOG('correo enviado', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    })
    return info.messageId
  } catch (err) {
    console.error('[email] Error al enviar el correo:', err)
    throw err
  }
}
