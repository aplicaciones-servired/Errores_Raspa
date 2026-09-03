import axios from 'axios'
import { API_URL } from '../utils/const'

const http = axios.create({
  baseURL: API_URL,
})

export default http
