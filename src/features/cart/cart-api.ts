import { api } from '../../lib/api'
import type { Nft } from '../catalog/catalog-api'

export type CartItem = { nftId: string; quantity: number; nft: Nft }
export type Cart = { items: CartItem[]; totalItems: number }
export type CartQuote = { subtotal: string; discount: string; networkFee: string; total: string; coupon: string | null }

const ETH_DECIMAL_PLACES = 6
const ETH_UNIT = 10n ** BigInt(ETH_DECIMAL_PLACES)

/** Converte ETH em uma quantidade inteira de unidades de seis casas decimais. */
function toEthUnits(amount: string) {
  const [whole = '0', fraction = ''] = amount.split('.')
  const paddedFraction = (fraction + '0'.repeat(ETH_DECIMAL_PLACES)).slice(0, ETH_DECIMAL_PLACES)
  return BigInt(whole) * ETH_UNIT + BigInt(paddedFraction)
}

/** Formata unidades inteiras como ETH sem arredondamento de ponto flutuante. */
function fromEthUnits(amount: bigint) {
  const whole = amount / ETH_UNIT
  const fraction = (amount % ETH_UNIT).toString().padStart(ETH_DECIMAL_PLACES, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}.0`
}

/** Multiplica valores ETH representados por strings sem introduzir erro de ponto flutuante. */
export function multiplyEth(price: string, quantity: number) {
  return fromEthUnits(toEthUnits(price) * BigInt(quantity))
}

/** Lê os itens persistidos do carrinho e seus dados de catálogo. */
export async function getCart() {
  const { data } = await api.get<Cart>('/cart')
  return data
}

/** Solicita a inclusão de uma peça e quantidade no carrinho. */
export async function addCartItem(nftId: string, quantity: number) {
  const { data } = await api.post<Cart>('/cart/items', { nftId, quantity })
  return data
}

/** Altera a quantidade de uma peça que já está no carrinho. */
export async function updateCartItem(nftId: string, quantity: number) {
  const { data } = await api.patch<Cart>(`/cart/items/${encodeURIComponent(nftId)}`, { quantity })
  return data
}

/** Remove a peça identificada e retorna o carrinho atualizado. */
export async function removeCartItem(nftId: string) {
  const { data } = await api.delete<Cart>(`/cart/items/${encodeURIComponent(nftId)}`)
  return data
}

/** Revalida cupom e valores para obter subtotal, taxas e total da compra. */
export async function getCartQuote(coupon: string) {
  const { data } = await api.post<CartQuote>('/cart/quote', { coupon })
  return data
}
