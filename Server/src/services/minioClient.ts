import { Client } from 'minio'
import { randomUUID } from 'crypto'
import path from 'path'
import '../config/env'

const endPoint = process.env.MINIO_ENDPOINT || '10.98.98.116'
const port = Number(process.env.MINIO_PORT) || 9000
const useSSL = process.env.MINIO_USE_SSL === 'true'
const accessKey = process.env.MINIO_ACCESS_KEY || 'admin'
const secretKey = process.env.MINIO_SECRET_KEY || ''

const minioClient = new Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
})

const bucket = process.env.MINIO_BUCKET || 'raspas-imagenes'

const publicReadPolicy = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${bucket}/*`],
    },
  ],
})

export const ensureBucket = async (): Promise<void> => {
  const exists = await minioClient.bucketExists(bucket)
  if (!exists) {
    await minioClient.makeBucket(bucket)
  }
  await minioClient.setBucketPolicy(bucket, publicReadPolicy)
}

export interface UploadResult {
  url: string
  objectName: string
}

export const uploadImage = async (
  buffer: Buffer,
  originalName: string,
  folder: string,
  contentType?: string
): Promise<UploadResult> => {
  const ext = path.extname(originalName) || '.jpg'
  const objectName = `${folder}/${randomUUID()}${ext}`

  await minioClient.putObject(bucket, objectName, buffer, buffer.byteLength, {
    'Content-Type': contentType ?? 'application/octet-stream',
  })

  const scheme = useSSL ? 'https' : 'http'
  const url = `${scheme}://${endPoint}:${port}/${bucket}/${objectName}`
  return { url, objectName }
}

export const getBucket = (): string => bucket

export interface ImagenDescargada {
  buffer: Buffer
  contentType: string
}

export const descargarImagen = async (url: string): Promise<ImagenDescargada> => {
  const pathname = new URL(url).pathname
  const objectName = pathname.replace(/^\/[^/]+\//, '')
  const stream = await minioClient.getObject(bucket, objectName)
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const buffer = Buffer.concat(chunks)
  let contentType = 'image/jpeg'
  try {
    const stat = await minioClient.statObject(bucket, objectName)
    const meta = (stat as { metaData?: Record<string, string> }).metaData
    const ct = meta?.['content-type'] ?? (stat as { contentType?: string }).contentType
    if (ct) contentType = ct
  } catch {
    /* conservar el valor por defecto */
  }
  return { buffer, contentType }
}

export default minioClient