import { isAxiosError } from 'axios'
import { api } from '../../lib/api'

export type Collector = { id: string; username: string; email: string }
export type Credentials = { email: string; password: string }

/** Recupera a sessão no serviço e converte apenas respostas 401 em sessão anônima. */
export async function getSession(): Promise<Collector | null> {
  try {
    const { data } = await api.get<Collector>('/auth/session')
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}

/** Autentica o colecionador com as credenciais informadas pelo formulário. */
export async function loginAccount(credentials: Credentials) {
  const { data } = await api.post<Collector>('/auth/login', credentials)
  return data
}

/** Cria ou recupera uma sessão fictícia usando o provedor social selecionado. */
export async function loginWithProvider(provider: 'google' | 'facebook') {
  const { data } = await api.post<Collector>('/auth/social', { provider })
  return data
}

/** Encerra a sessão atual pela API simulada. */
export async function logoutAccount() {
  await api.post('/auth/logout')
}
