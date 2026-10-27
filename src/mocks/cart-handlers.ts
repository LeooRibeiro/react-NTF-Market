import { http, HttpResponse } from 'msw'
import { cartStorageKey, nfts, readCart, cartResponse, toUnits, fromUnits } from './mock-data'
export const cartHandlers = [
// Cart
  http.get('/api/cart', async () => HttpResponse.json(cartResponse())),

  http.post('/api/cart/items', async ({ request }) => {
    const body = await request.json() as { nftId?: string; quantity?: number }
    const nftId = String(body.nftId ?? '')
    const quantity = Number(body.quantity)
    const nft = nfts.find((candidate) => candidate.id === nftId)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    if (nft.available === false) return HttpResponse.json({ message: 'Esta edição está esgotada.' }, { status: 409 })
    if (!Number.isInteger(quantity) || quantity < 1) {
      return HttpResponse.json({ message: 'Informe uma quantidade válida.' }, { status: 400 })
    }
    const items = readCart()
    const existing = items.find((item) => item.nftId === nftId)
    if ((existing?.quantity ?? 0) + quantity > 5) {
      return HttpResponse.json({ message: 'Quantidade indisponível para esta edição.' }, { status: 409 })
    }
    if (existing) existing.quantity += quantity
    else items.push({ nftId, quantity })
    localStorage.setItem(cartStorageKey, JSON.stringify(items))
    return HttpResponse.json(cartResponse(items), { status: 201 })
  }),

  http.patch('/api/cart/items/:nftId', async ({ params, request }) => {
    const body = await request.json() as { quantity?: number }
    const quantity = Number(body.quantity)
    const items = readCart()
    const item = items.find((candidate) => candidate.nftId === params.nftId)
    if (!item) return HttpResponse.json({ message: 'Este item não está no carrinho.' }, { status: 404 })
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      return HttpResponse.json({ message: 'Quantidade indisponível para esta edição.' }, { status: 409 })
    }
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    if (nft?.available === false && quantity > item.quantity) {
      return HttpResponse.json({ message: 'Esta edição está esgotada.' }, { status: 409 })
    }
    item.quantity = quantity
    localStorage.setItem(cartStorageKey, JSON.stringify(items))
    return HttpResponse.json(cartResponse(items))
  }),

  http.delete('/api/cart/items/:nftId', async ({ params }) => {
    const items = readCart().filter((item) => item.nftId !== params.nftId)
    localStorage.setItem(cartStorageKey, JSON.stringify(items))
    return HttpResponse.json(cartResponse(items))
  }),

  http.post('/api/cart/quote', async ({ request }) => {
    const body = await request.json() as { coupon?: string }
    const coupon = (body.coupon ?? '').trim().toUpperCase()
    if (coupon && coupon !== 'KURIO10') {
      return HttpResponse.json({ message: 'Cupom inválido ou expirado.' }, { status: 422 })
    }
    const cart = cartResponse()
    if (cart.items.some((item) => item.nft.available === false)) {
      return HttpResponse.json({ message: 'Uma ou mais edições do carrinho estão esgotadas.' }, { status: 409 })
    }
    const subtotal = cart.items.reduce((sum, item) => sum + toUnits(item.nft.price) * BigInt(item.quantity), 0n)
    const discount = coupon ? subtotal * 10n / 100n : 0n
    const networkFee = cart.items.length ? 2_500n : 0n
    return HttpResponse.json({
      subtotal: fromUnits(subtotal),
      discount: fromUnits(discount),
      networkFee: fromUnits(networkFee),
      total: fromUnits(subtotal - discount + networkFee),
      coupon: coupon || null,
    })
  }),
]
