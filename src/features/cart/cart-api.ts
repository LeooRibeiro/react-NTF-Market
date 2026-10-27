import { api } from '../../lib/api'
import type { Nft } from '../catalog/catalog-api'

export type CartItem = { nftId: string; quantity: number; nft: Nft }
export type Cart = { items: CartItem[]; totalItems: number }
export type CartQuote = { subtotal: string; discount: string; networkFee: string; total: string; coupon: string | null }

export function multiplyEth(price: string, quantity: number) {
  const [whole = '0', fraction = ''] = price.split('.')
  const units = (BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6))) * BigInt(quantity)
  const wholeUnits = units / 1_000_000n
  const fractionalUnits = (units % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return fractionalUnits ? `${wholeUnits}.${fractionalUnits}` : `${wholeUnits}.0`
}

export async function getCart() {
  const { data } = await api.get<Cart>('/cart')
  return data
}

export async function addCartItem(nftId: string, quantity: number) {
  const { data } = await api.post<Cart>('/cart/items', { nftId, quantity })
  return data
}

export async function updateCartItem(nftId: string, quantity: number) {
  const { data } = await api.patch<Cart>(`/cart/items/${encodeURIComponent(nftId)}`, { quantity })
  return data
}

export async function removeCartItem(nftId: string) {
  const { data } = await api.delete<Cart>(`/cart/items/${encodeURIComponent(nftId)}`)
  return data
}

export async function getCartQuote(coupon: string) {
  const { data } = await api.post<CartQuote>('/cart/quote', { coupon })
  return data
}
