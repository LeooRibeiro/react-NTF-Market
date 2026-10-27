import { api } from '../../lib/api'

export type CollectorProfile = {
  id: string
  username: string
  email: string
  avatar: string
  bio: string
  createdAt: string
}

export type UpdateProfileInput = {
  username?: string
  avatar?: string
  bio?: string
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

/** Consulta o perfil completo do colecionador logado. */
export async function getProfile() {
  const { data } = await api.get<CollectorProfile>('/profile')
  return data
}

/** Atualiza dados públicos do perfil (nome, avatar, bio). */
export async function updateProfile(input: UpdateProfileInput) {
  const { data } = await api.patch<CollectorProfile>('/profile', input)
  return data
}

/** Altera a senha do colecionador após validar a senha atual. */
export async function changePassword(input: ChangePasswordInput) {
  const { data } = await api.post<{ success: boolean; message: string }>('/profile/password', input)
  return data
}
