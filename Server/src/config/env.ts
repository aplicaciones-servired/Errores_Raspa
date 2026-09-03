import path from 'path'
import dotenv from 'dotenv'

export const envFile = path.resolve(__dirname, '..', '.env')

export const loadEnv = (): void => {
  dotenv.config({ path: envFile })
}

loadEnv()
