import { api } from '../../lib/api'

export type Wallet = {
  id: string
  name: string
  address: string
  network: string
  primary: boolean
}

export type CreateWalletInput = {
  name: string
  address: string
  network: string
  primary?: boolean
}

export type UpdateWalletInput = {
  name?: string
  network?: string
  primary?: boolean
}

/** Lista todas as carteiras cadastradas para o colecionador. */
export async function getWallets() {
  const { data } = await api.get<Wallet[]>('/wallets')
  return data
}

/** Cadastra uma nova carteira simulada. */
export async function createWallet(input: CreateWalletInput) {
  const { data } = await api.post<Wallet>('/wallets', input)
  return data
}

/** Atualiza dados ou define carteira principal/secundária. */
export async function updateWallet(walletId: string, input: UpdateWalletInput) {
  const { data } = await api.patch<Wallet>(`/wallets/${encodeURIComponent(walletId)}`, input)
  return data
}

/** Remove uma carteira secundária. */
export async function deleteWallet(walletId: string) {
  const { data } = await api.delete<{ success: boolean }>(`/wallets/${encodeURIComponent(walletId)}`)
  return data
}
