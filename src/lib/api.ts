import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 8_000,
  headers: { Accept: 'application/json' },
})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    const url = error.config?.url ?? ''
    if (!/\/auth\/(login|social|register)$/.test(url) && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kurio:session-expired'))
    }
  }
  return Promise.reject(error)
})
