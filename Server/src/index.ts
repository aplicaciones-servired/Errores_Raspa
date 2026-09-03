import express from 'express'
import cors from 'cors'
import './config/env'
import sequelize from './db/connection'
import raspasRouter from './routes/raspas'
import { ensureBucket } from './services/minioClient'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '20mb' }))

app.use('/api', raspasRouter)

const start = async () => {
  try {
    await sequelize.authenticate()
    console.log('MySQL conectado')

    await sequelize.sync({ alter: true })
    console.log('Tablas sincronizadas')

    await ensureBucket()
    console.log('MinIO bucket listo')

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Error al iniciar servidor:', err)
    process.exit(1)
  }
}

start()