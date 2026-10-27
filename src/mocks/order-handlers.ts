import { delay, http, HttpResponse } from 'msw'
import { cartStorageKey, idempotencyStorageKey, ordersStorageKey, sessionStorageKey, nfts, readCart, readWallets, toUnits, fromUnits } from './mock-data'
import { updateNftAvailability } from './socket-handlers'
export const orderHandlers = [
// Orders
  http.get('/api/orders/:orderId', ({ params }) => {
    if (!localStorage.getItem(sessionStorageKey)) return HttpResponse.json({ message: 'Sessão inválida.' }, { status: 401 })
    const orders = JSON.parse(localStorage.getItem(ordersStorageKey) ?? '[]') as Array<Record<string, unknown>>
    const order = orders.find((candidate) => candidate.id === params.orderId)
    return order ? HttpResponse.json(order) : HttpResponse.json({ message: 'Pedido não encontrado.' }, { status: 404 })
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(280)
    const session = localStorage.getItem(sessionStorageKey)
    if (!session) return HttpResponse.json({ message: 'Entre na sua conta para continuar.' }, { status: 401 })
    const key = request.headers.get('Idempotency-Key')
    if (!key) return HttpResponse.json({ message: 'Chave de tentativa obrigatória.' }, { status: 400 })
    const body = await request.json() as { collector: { name: string; email: string }; walletId: string; network: string; walletConnected?: boolean; coupon: string; cartItems: Array<{ nftId: string; quantity: number }>; scenario?: string }
    if (body.scenario && !['confirmed', 'declined', 'pending', 'timeout'].includes(body.scenario)) {
      return HttpResponse.json({ message: 'Cenário de pagamento inválido.' }, { status: 400 })
    }
    const keys = JSON.parse(localStorage.getItem(idempotencyStorageKey) ?? '{}') as Record<string, { id: string; body: string }>
    const orders = JSON.parse(localStorage.getItem(ordersStorageKey) ?? '[]') as Array<Record<string, unknown>>
    const bodySnapshot = JSON.stringify(body)
    if (!body.walletConnected) {
      return HttpResponse.json({ message: 'Conecte sua carteira antes de enviar o pedido.' }, { status: 409 })
    }
    if (keys[key]) {
      if (keys[key].body !== bodySnapshot) return HttpResponse.json({ message: 'Esta chave já foi usada em outra tentativa.' }, { status: 409 })
      return HttpResponse.json(orders.find((order) => order.id === keys[key].id))
    }
    const walletList = readWallets()
    const wallet = walletList.find((candidate) => candidate.id === body.walletId) ?? walletList.find((w) => w.primary)
    const cart = readCart()
    if (!wallet || !body.cartItems?.length || body.cartItems.some((line) => !cart.some((item) => item.nftId === line.nftId && item.quantity >= line.quantity))) {
      return HttpResponse.json({ message: 'Carrinho ou carteira alterados. Revise seu pedido.' }, { status: 409 })
    }
    const requestedNfts = body.cartItems.map((line) => nfts.find((candidate) => candidate.id === line.nftId))
    if (requestedNfts.some((nft) => !nft || nft.available === false)) {
      return HttpResponse.json({ message: 'Uma ou mais edições estão esgotadas. Revise o carrinho.' }, { status: 409 })
    }
    const items = body.cartItems.flatMap((line) => {
      const nft = nfts.find((candidate) => candidate.id === line.nftId)
      return nft ? [{ nft, quantity: line.quantity, unitPrice: nft.price, lineTotal: fromUnits(toUnits(nft.price) * BigInt(line.quantity)) }] : []
    })
    const subtotalUnits = items.reduce((sum, line) => sum + toUnits(line.lineTotal), 0n)
    const coupon = body.coupon.trim().toUpperCase()
    if (coupon && coupon !== 'KURIO10') return HttpResponse.json({ message: 'Cupom inválido ou expirado.' }, { status: 422 })
    const discountUnits = coupon ? subtotalUnits * 10n / 100n : 0n
    const feeUnits = 2_500n
    const status = body.scenario === 'declined'
      ? 'declined'
      : body.scenario === 'pending' || body.scenario === 'timeout'
        ? 'pending'
        : 'confirmed'
    const id = `order-${Date.now().toString(36)}`
    const order = {
      id, number: `KUR-${Date.now().toString().slice(-6)}`, status,
      transactionId: status === 'confirmed' ? `0x${crypto.randomUUID().replaceAll('-', '')}` : null,
      collector: body.collector, wallet, network: wallet.network, items,
      subtotal: fromUnits(subtotalUnits), discount: fromUnits(discountUnits), networkFee: fromUnits(feeUnits),
      total: fromUnits(subtotalUnits - discountUnits + feeUnits), createdAt: Date.now(),
    }
    orders.push(order)
    keys[key] = { id, body: bodySnapshot }
    localStorage.setItem(ordersStorageKey, JSON.stringify(orders))
    localStorage.setItem(idempotencyStorageKey, JSON.stringify(keys))
    if (status === 'confirmed') {
      const bought = new Map(body.cartItems.map((line) => [line.nftId, line.quantity]))
      localStorage.setItem(cartStorageKey, JSON.stringify(cart.flatMap((line) => {
        const remaining = line.quantity - (bought.get(line.nftId) ?? 0)
        return remaining > 0 ? [{ ...line, quantity: remaining }] : []
      })))
      localStorage.removeItem('kurio-cart-coupon-v1')
      for (const nftId of bought.keys()) updateNftAvailability(nftId, false)
    }
    if (body.scenario === 'timeout') return HttpResponse.error()
    return HttpResponse.json(order, { status: 201 })
  }),
]
