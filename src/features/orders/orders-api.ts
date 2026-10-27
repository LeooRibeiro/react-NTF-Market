import { api } from '../../lib/api'
import type { Nft } from '../catalog/catalog-api'

export type Wallet = { id: string; name: string; address: string; network: string; primary: boolean }
export type OrderStatus = 'pending' | 'confirmed' | 'declined'
export type OrderLine = { nft: Nft; quantity: number; unitPrice: string; lineTotal: string }
export type OrderSnapshot = {
  id: string
  number: string
  status: OrderStatus
  transactionId: string | null
  collector: { name: string; email: string }
  wallet: Wallet
  network: string
  items: OrderLine[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  createdAt: number
}
export type CreateOrderInput = {
  collector: { name: string; email: string }
  walletId: string
  network: string
  coupon: string
  cartItems: Array<{ nftId: string; quantity: number }>
  scenario?: 'confirmed' | 'declined' | 'pending' | 'timeout'
}

/** Recupera carteiras simuladas disponíveis para a rede de cada compra. */
export async function getWallets() {
  const { data } = await api.get<Wallet[]>('/wallets')
  return data
}

/** Envia o pedido com chave idempotente para evitar compras duplicadas em reenvios. */
export async function createOrder(input: CreateOrderInput, idempotencyKey: string) {
  const { data } = await api.post<OrderSnapshot>('/orders', input, { headers: { 'Idempotency-Key': idempotencyKey } })
  return data
}

/** Recupera o estado e o snapshot imutável do pedido pela rota de confirmação. */
export async function getOrder(id: string) {
  const { data } = await api.get<OrderSnapshot>(`/orders/${encodeURIComponent(id)}`)
  return data
}
