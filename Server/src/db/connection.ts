import { Sequelize } from 'sequelize'
import '../config/env'

const sequelize = new Sequelize(
  process.env.DB_NAME || 'Raspas',
  process.env.DB_USER || 'cliente',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '172.20.1.92',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true',
  }
)

export default sequelize