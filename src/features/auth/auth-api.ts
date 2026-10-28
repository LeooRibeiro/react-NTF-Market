import { api } from '../../lib/api'

export type Collector = { id: string; username: string; email: string }
export type Credentials = { email: string; password: string }

/** Recupera a sessão no serviço; uma resposta nula representa visitante anônimo. */
export async function getSession(): Promise<Collector | null> {
  const { data } = await api.get<Collector | null>('/auth/session')
  return data
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
