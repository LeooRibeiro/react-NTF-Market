import { delay, http, HttpResponse } from 'msw'
import type { CatalogResult, Nft, SortOption } from '../features/catalog/catalog-api'

const nfts: Nft[] = [
  { id: 'neon-vessel-552', name: 'Neon Vessel #552', artist: 'Kurio Studio', category: 'Arte digital', network: 'Ethereum', price: '1.99', previousPrice: '2.29', image: '/assets/neon-vessel.png', rarity: 'RARO', listedAt: 17 },
  { id: 'cosmic-bloom-118', name: 'Cosmic Bloom #118', artist: 'Mika Sol', category: 'Arte digital', network: 'Polygon', price: '1.29', image: '/assets/cosmic-bloom.png', listedAt: 15 },
  { id: 'violet-nomad-314', name: 'Violet Nomad #314', artist: 'Mika Sol', category: 'Arte 3D', network: 'Solana', price: '1.39', image: '/assets/violet-nomad.png', listedAt: 14 },
  { id: 'ivory-baron-088', name: 'Ivory Baron #088', artist: 'Kurio Studio', category: 'Colecionáveis', network: 'Ethereum', price: '1.79', image: '/assets/ivory-baron.png', listedAt: 13 },
  { id: 'sage-nomad-009', name: 'Sage Nomad #009', artist: 'Lia Costa', category: 'Fotografia', network: 'Polygon', price: '1.69', image: '/assets/sage-nomad.png', listedAt: 12 },
  { id: 'golden-beat-207', name: 'Golden Beat #207', artist: 'Mika Sol', category: 'Música', network: 'Ethereum', price: '0.99', image: '/assets/golden-beat.png', listedAt: 11 },
  { id: 'emerald-ape-042', name: 'Emerald Ape #042', artist: 'Kurio Studio', category: 'Colecionáveis', network: 'Solana', price: '1.19', image: '/assets/emerald-ape.png', listedAt: 10 },
  { id: 'golden-frequency-071', name: 'Golden Frequency #071', artist: 'Lia Costa', category: 'Arte digital', network: 'Polygon', price: '0.59', image: '/assets/cosmic-bloom.png', listedAt: 9 },
  { id: 'golden-signal-160', name: 'Golden Signal #160', artist: 'Mika Sol', category: 'Generativa', network: 'Solana', price: '0.39', image: '/assets/violet-nomad.png', listedAt: 8 },
  { id: 'solar-orbit-403', name: 'Solar Orbit #403', artist: 'Lia Costa', category: 'Arte 3D', network: 'Ethereum', price: '2.12', image: '/assets/ivory-baron.png', listedAt: 7 },
  { id: 'minted-memory-055', name: 'Minted Memory #055', artist: 'Kurio Studio', category: 'Fotografia', network: 'Polygon', price: '0.82', image: '/assets/sage-nomad.png', listedAt: 6 },
  { id: 'afterglow-201', name: 'Afterglow #201', artist: 'Mika Sol', category: 'Música', network: 'Ethereum', price: '1.05', image: '/assets/golden-beat.png', listedAt: 5 },
]

const sourceNfts = [...nfts]
for (let index = 0; index < 24; index += 1) {
  const source = sourceNfts[index % sourceNfts.length]!
  const edition = String(index + 1).padStart(3, '0')
  nfts.push({
    ...source,
    id: `${source.id}-edition-${edition}`,
    name: `${source.name.split(' #')[0]} #${edition}`,
    price: ['0.49', '0.79', '1.09', '1.49', '1.89', '2.19'][index % 6]!,
    previousPrice: index % 4 === 0 ? '2.49' : undefined,
    rarity: index % 7 === 0 ? 'RARO' : undefined,
    listedAt: 4 - index,
  })
}

const accountsStorageKey = 'kurio-accounts-v1'
const sessionStorageKey = 'kurio-session-v1'
const cartStorageKey = 'kurio-cart-v1'
const ordersStorageKey = 'kurio-orders-v1'
const idempotencyStorageKey = 'kurio-order-keys-v1'

type StoredAccount = { id: string; username: string; email: string; passwordHash: string }

/** Lê contas mock persistidas e retorna lista vazia se o armazenamento estiver inválido. */
function readAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(accountsStorageKey) ?? '[]') as StoredAccount[]
  } catch {
    return []
  }
}

/** Gera o hash local usado pelo cenário mock para comparar senhas sem texto puro. */
async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Recupera quantidades do carrinho entre navegações e atualizações da página. */
function readCart(): Array<{ nftId: string; quantity: number }> {
  try {
    const value = localStorage.getItem(cartStorageKey)
    return value ? JSON.parse(value) as Array<{ nftId: string; quantity: number }> : []
  } catch {
    return []
  }
}

/** Completa as linhas persistidas do carrinho com os dados atuais dos NFTs. */
function cartResponse(items = readCart()) {
  const resolvedItems = items.flatMap((item) => {
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    return nft ? [{ ...item, nft }] : []
  })
  return { items: resolvedItems, totalItems: resolvedItems.reduce((sum, item) => sum + item.quantity, 0) }
}

/** Converte ETH decimal para unidades inteiras para permitir cálculos exatos. */
function toUnits(value: string) {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6))
}

/** Converte unidades inteiras para string ETH sem arredondamento binário. */
function fromUnits(value: bigint) {
  const whole = value / 1_000_000n
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}.0`
}

/** Expõe contratos REST simulados para catálogo, conta, carrinho, carteiras e pedidos. */
export const handlers = [
  http.get('/api/wallets', async () => HttpResponse.json([
    { id: 'wallet-main', name: 'Minha carteira', address: '0x71C7...9A42', network: 'Ethereum', primary: true },
    { id: 'wallet-polygon', name: 'Polygon collection', address: '0xA12B...04F1', network: 'Polygon', primary: false },
    { id: 'wallet-solana', name: 'Solana wallet', address: '8xKf...Qp2M', network: 'Solana', primary: false },
  ])),

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
    const body = await request.json() as { collector: { name: string; email: string }; walletId: string; network: string; coupon: string; cartItems: Array<{ nftId: string; quantity: number }>; scenario?: string }
    const keys = JSON.parse(localStorage.getItem(idempotencyStorageKey) ?? '{}') as Record<string, { id: string; body: string }>
    const orders = JSON.parse(localStorage.getItem(ordersStorageKey) ?? '[]') as Array<Record<string, unknown>>
    const bodySnapshot = JSON.stringify(body)
    if (keys[key]) {
      if (keys[key].body !== bodySnapshot) return HttpResponse.json({ message: 'Esta chave já foi usada em outra tentativa.' }, { status: 409 })
      return HttpResponse.json(orders.find((order) => order.id === keys[key].id))
    }
    const walletList = [
      { id: 'wallet-main', name: 'Minha carteira', address: '0x71C7...9A42', network: 'Ethereum', primary: true },
      { id: 'wallet-polygon', name: 'Polygon collection', address: '0xA12B...04F1', network: 'Polygon', primary: false },
      { id: 'wallet-solana', name: 'Solana wallet', address: '8xKf...Qp2M', network: 'Solana', primary: false },
    ]
    const wallet = walletList.find((candidate) => candidate.id === body.walletId)
    const cart = readCart()
    if (!wallet || !body.cartItems?.length || body.cartItems.some((line) => !cart.some((item) => item.nftId === line.nftId && item.quantity >= line.quantity))) {
      return HttpResponse.json({ message: 'Carrinho ou carteira alterados. Revise seu pedido.' }, { status: 409 })
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
    const status = body.scenario === 'declined' ? 'declined' : body.scenario === 'pending' ? 'pending' : 'confirmed'
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
    }
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/nfts/:nftId', async ({ params }) => {
    await delay(150)
    const nft = nfts.find((candidate) => candidate.id === params.nftId)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    return HttpResponse.json(nft)
  }),

  http.get('/api/nfts', async ({ request }) => {
    await delay(220)
    const params = new URL(request.url).searchParams
    const q = (params.get('q') ?? '').trim().toLocaleLowerCase('pt-BR')
    const category = params.get('category') ?? 'Todas'
    const network = params.get('network') ?? 'Todas'
    const minPrice = Number(params.get('minPrice') ?? 0)
    const maxPrice = Number(params.get('maxPrice') ?? 12.3)
    const page = Math.max(1, Number(params.get('page') ?? 1))
    const pageSize = 9
    const sort = (params.get('sort') ?? 'recent') as SortOption

    let filtered = nfts.filter((nft) => {
      const matchesText = `${nft.name} ${nft.artist} ${nft.category}`.toLocaleLowerCase('pt-BR').includes(q)
      const matchesCategory = category === 'Todas' || nft.category === category
      const matchesNetwork = network === 'Todas' || nft.network === network
      const price = Number(nft.price)
      return matchesText && matchesCategory && matchesNetwork && price >= minPrice && price <= maxPrice
    })

    if (sort === 'price-asc') filtered = filtered.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'price-desc') filtered = filtered.sort((a, b) => Number(b.price) - Number(a.price))
    else filtered = filtered.sort((a, b) => b.listedAt - a.listedAt)

    const start = (page - 1) * pageSize
    const result: CatalogResult = { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize }
    return HttpResponse.json(result)
  }),

  http.get('/api/cart', async () => HttpResponse.json(cartResponse())),

  http.post('/api/cart/items', async ({ request }) => {
    const body = await request.json() as { nftId?: string; quantity?: number }
    const nftId = String(body.nftId ?? '')
    const quantity = Number(body.quantity)
    const nft = nfts.find((candidate) => candidate.id === nftId)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
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

  http.get('/api/auth/session', async () => {
    try {
      const user = JSON.parse(localStorage.getItem(sessionStorageKey) ?? 'null') as { id: string; username: string; email: string } | null
      if (user) return HttpResponse.json(user)
    } catch {
      localStorage.removeItem(sessionStorageKey)
    }
    return HttpResponse.json({ message: 'Sessão inválida.' }, { status: 401 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(160)
    const body = await request.json() as { email?: string; password?: string }
    const email = (body.email ?? '').trim().toLocaleLowerCase('pt-BR')
    const password = body.password ?? ''
    const accounts = readAccounts()
    const account = accounts.find((candidate) => candidate.email === email)
    const demoMatch = email === 'demo@kurio.art' && password === 'KurioPass123'
    const passwordHash = account ? await hashPassword(password) : ''
    if (!demoMatch && (!account || account.passwordHash !== passwordHash)) {
      return HttpResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    }
    const user = demoMatch
      ? { id: 'collector-demo', username: 'Demo Kurio', email }
      : { id: account!.id, username: account!.username, email: account!.email }
    localStorage.setItem(sessionStorageKey, JSON.stringify(user))
    return HttpResponse.json(user)
  }),

  http.post('/api/auth/social', async ({ request }) => {
    await delay(200)
    const body = await request.json() as { provider?: string }
    const socialUsers = {
      google: { id: 'collector-google', username: 'Google Kurio', email: 'google@kurio.art' },
      facebook: { id: 'collector-facebook', username: 'Facebook Kurio', email: 'facebook@kurio.art' },
    }
    if (body.provider !== 'google' && body.provider !== 'facebook') {
      return HttpResponse.json({ message: 'Provedor de login inválido.' }, { status: 400 })
    }
    const user = socialUsers[body.provider]
    localStorage.setItem(sessionStorageKey, JSON.stringify(user))
    return HttpResponse.json(user)
  }),

  http.post('/api/auth/logout', async () => {
    localStorage.removeItem(sessionStorageKey)
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(180)
    const body = await request.json() as { username?: string; email?: string; password?: string }
    const email = (body.email ?? '').trim().toLocaleLowerCase('pt-BR')
    if (!body.username?.trim() || !email || !body.password) {
      return HttpResponse.json({ message: 'Preencha todos os campos.' }, { status: 400 })
    }
    const accounts = readAccounts()
    if (accounts.some((account) => account.email === email) || email === 'demo@kurio.art') {
      return HttpResponse.json({ message: 'Este e-mail já possui uma conta.' }, { status: 409 })
    }
    const user = { id: `collector-${accounts.length + 1}`, username: body.username.trim(), email }
    accounts.push({ ...user, passwordHash: await hashPassword(body.password) })
    localStorage.setItem(accountsStorageKey, JSON.stringify(accounts))
    localStorage.setItem(sessionStorageKey, JSON.stringify(user))
    return HttpResponse.json(user, { status: 201 })
  }),
]
