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

const accounts = new Set<string>()
const cartStorageKey = 'kurio-cart-v1'

function readCart(): Array<{ nftId: string; quantity: number }> {
  try {
    const value = localStorage.getItem(cartStorageKey)
    return value ? JSON.parse(value) as Array<{ nftId: string; quantity: number }> : []
  } catch {
    return []
  }
}

function cartResponse(items = readCart()) {
  const resolvedItems = items.flatMap((item) => {
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    return nft ? [{ ...item, nft }] : []
  })
  return { items: resolvedItems, totalItems: resolvedItems.reduce((sum, item) => sum + item.quantity, 0) }
}

function toUnits(value: string) {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6))
}

function fromUnits(value: bigint) {
  const whole = value / 1_000_000n
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}.0`
}

export const handlers = [
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

  http.post('/api/auth/register', async ({ request }) => {
    await delay(180)
    const body = await request.json() as { username?: string; email?: string; password?: string }
    const email = (body.email ?? '').trim().toLocaleLowerCase('pt-BR')
    if (!body.username?.trim() || !email || !body.password) {
      return HttpResponse.json({ message: 'Preencha todos os campos.' }, { status: 400 })
    }
    if (accounts.has(email) || email === 'demo@kurio.art') {
      return HttpResponse.json({ message: 'Este e-mail já possui uma conta.' }, { status: 409 })
    }
    accounts.add(email)
    return HttpResponse.json({ id: `collector-${accounts.size}`, username: body.username.trim(), email }, { status: 201 })
  }),
]
