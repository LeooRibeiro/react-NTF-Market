import type { Nft } from '../features/catalog/catalog-api'

export const nfts: Nft[] = [
  { id: 'neon-vessel-552', name: 'Neon Vessel #552', artist: 'Kurio Studio', category: 'Arte digital', network: 'Ethereum', price: '1.99', previousPrice: '2.29', image: '/assets/neon-vessel.png', rarity: 'RARO', listedAt: 17 },
  { id: 'cosmic-bloom-118', name: 'Cosmic Bloom #118', artist: 'Mika Sol', category: 'Arte digital', network: 'Polygon', price: '1.29', image: '/assets/golden-beat.png', listedAt: 15 },
  { id: 'violet-nomad-314', name: 'Violet Nomad #314', artist: 'Mika Sol', category: 'Arte 3D', network: 'Solana', price: '1.39', image: '/assets/golden-beat.png', listedAt: 14 },
  { id: 'ivory-baron-088', name: 'Ivory Baron #088', artist: 'Kurio Studio', category: 'Colecionáveis', network: 'Ethereum', price: '1.79', image: '/assets/ivory-baron.png', listedAt: 13 },
  { id: 'sage-nomad-009', name: 'Sage Nomad #009', artist: 'Lia Costa', category: 'Fotografia', network: 'Polygon', price: '1.69', image: '/assets/sage-nomad.png', listedAt: 12 },
  { id: 'golden-beat-207', name: 'Golden Beat #207', artist: 'Mika Sol', category: 'Música', network: 'Ethereum', price: '0.99', image: '/assets/golden-beat.png', listedAt: 11 },
  { id: 'emerald-ape-042', name: 'Emerald Ape #042', artist: 'Kurio Studio', category: 'Colecionáveis', network: 'Solana', price: '1.19', image: '/assets/emerald-ape.png', listedAt: 10 },
  { id: 'golden-frequency-071', name: 'Golden Frequency #071', artist: 'Lia Costa', category: 'Arte digital', network: 'Polygon', price: '0.59', image: '/assets/golden-beat.png', listedAt: 9 },
  { id: 'golden-signal-160', name: 'Golden Signal #160', artist: 'Mika Sol', category: 'Generativa', network: 'Solana', price: '0.39', image: '/assets/golden-beat.png', listedAt: 8 },
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

// Cópia inicial imutável para suportar reset determinístico dos dados
export const initialNfts: Nft[] = JSON.parse(JSON.stringify(nfts))

export const accountsStorageKey = 'kurio-accounts-v1'
export const sessionStorageKey = 'kurio-session-v1'
export const cartStorageKey = 'kurio-cart-v1'
export const ordersStorageKey = 'kurio-orders-v1'
export const idempotencyStorageKey = 'kurio-order-keys-v1'
export const favoritesStorageKey = 'kurio-favorites-v1'
export const walletsStorageKey = 'kurio-wallets-v1'
export const profilesStorageKey = 'kurio-profiles-v1'

export type MockSession = { id: string; username: string; email: string; expiresAt?: number }

/** Returns null for missing or expired mock sessions and removes expired state. */
export function getMockSession(): MockSession | null {
  try {
    const session = JSON.parse(localStorage.getItem(sessionStorageKey) ?? 'null') as MockSession | null
    if (!session) return null
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      localStorage.removeItem(sessionStorageKey)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(sessionStorageKey)
    return null
  }
}

export function getScopedStorageKey(baseKey: string, userId: string | null | undefined = getMockSession()?.id) {
  return userId ? `${baseKey}:${userId}` : `${baseKey}:guest`
}

export function establishMockSession(user: Omit<MockSession, 'expiresAt'>, ttlMs = 60 * 60 * 1000) {
  const guestKey = getScopedStorageKey(cartStorageKey, null)
  const accountCartKey = getScopedStorageKey(cartStorageKey, user.id)
  const guestCart = localStorage.getItem(guestKey)
  if (guestCart) {
    try {
      const guestItems = JSON.parse(guestCart) as Array<{ nftId: string; quantity: number }>
      const accountItems = JSON.parse(localStorage.getItem(accountCartKey) ?? '[]') as Array<{ nftId: string; quantity: number }>
      for (const item of guestItems) {
        const existing = accountItems.find((entry) => entry.nftId === item.nftId)
        if (existing) existing.quantity = Math.min(5, existing.quantity + item.quantity)
        else accountItems.push({ ...item, quantity: Math.min(5, item.quantity) })
      }
      localStorage.setItem(accountCartKey, JSON.stringify(accountItems))
    } catch {
      localStorage.removeItem(accountCartKey)
    }
  }
  localStorage.removeItem(guestKey)
  const guestCouponKey = getScopedStorageKey('kurio-cart-coupon-v1', null)
  const accountCouponKey = getScopedStorageKey('kurio-cart-coupon-v1', user.id)
  const guestCoupon = localStorage.getItem(guestCouponKey)
  if (guestCoupon && !localStorage.getItem(accountCouponKey)) localStorage.setItem(accountCouponKey, guestCoupon)
  localStorage.removeItem(guestCouponKey)
  localStorage.setItem(sessionStorageKey, JSON.stringify({ ...user, expiresAt: Date.now() + ttlMs }))
}

export function expireMockSession() {
  const session = getMockSession()
  if (session) {
    localStorage.setItem(sessionStorageKey, JSON.stringify({ ...session, expiresAt: Date.now() - 1 }))
    window.dispatchEvent(new Event('kurio:session-expired'))
  }
}

if (typeof window !== 'undefined') {
  const target = window as unknown as Record<string, unknown>
  target.__kurioExpireSession = expireMockSession
}

export type StoredAccount = { id: string; username: string; email: string; passwordHash: string }

/** Lê contas mock persistidas e retorna lista vazia se o armazenamento estiver inválido. */
export function readAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(accountsStorageKey) ?? '[]') as StoredAccount[]
  } catch {
    return []
  }
}

/** Gera o hash local usado pelo cenário mock para comparar senhas sem texto puro. */
export async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Recupera quantidades do carrinho entre navegações e atualizações da página. */
export function readCart(): Array<{ nftId: string; quantity: number }> {
  try {
    const value = localStorage.getItem(getScopedStorageKey(cartStorageKey))
    return value ? JSON.parse(value) as Array<{ nftId: string; quantity: number }> : []
  } catch {
    return []
  }
}

export function writeCart(items: Array<{ nftId: string; quantity: number }>) {
  localStorage.setItem(getScopedStorageKey(cartStorageKey), JSON.stringify(items))
}

export function getOrdersStorageKey(userId = getMockSession()?.id) {
  return getScopedStorageKey(ordersStorageKey, userId)
}

export function getIdempotencyStorageKey(userId = getMockSession()?.id) {
  return getScopedStorageKey(idempotencyStorageKey, userId)
}

/** Completa as linhas persistidas do carrinho com os dados atuais dos NFTs. */
export function cartResponse(items = readCart()) {
  const resolvedItems = items.flatMap((item) => {
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    return nft ? [{ ...item, nft }] : []
  })
  return { items: resolvedItems, totalItems: resolvedItems.reduce((sum, item) => sum + item.quantity, 0) }
}

/** Converte ETH decimal para unidades inteiras para permitir cálculos exatos. */
export function toUnits(value: string) {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6))
}

/** Converte unidades inteiras para string ETH sem arredondamento binário. */
export function fromUnits(value: bigint) {
  const whole = value / 1_000_000n
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}.0`
}

export type Wallet = { id: string; name: string; address: string; network: string; primary: boolean }

export const defaultWallets: Wallet[] = [
  { id: 'wallet-main', name: 'Minha carteira', address: '0x71C7...9A42', network: 'Ethereum', primary: true },
  { id: 'wallet-polygon', name: 'Polygon collection', address: '0xA12B...04F1', network: 'Polygon', primary: false },
  { id: 'wallet-solana', name: 'Solana wallet', address: '8xKf...Qp2M', network: 'Solana', primary: false },
]

export function readWallets(): Wallet[] {
  try {
    const raw = localStorage.getItem(getScopedStorageKey(walletsStorageKey))
    return raw ? JSON.parse(raw) as Wallet[] : JSON.parse(JSON.stringify(defaultWallets)) as Wallet[]
  } catch {
    return JSON.parse(JSON.stringify(defaultWallets)) as Wallet[]
  }
}

export function writeWallets(wallets: Wallet[]) {
  localStorage.setItem(getScopedStorageKey(walletsStorageKey), JSON.stringify(wallets))
}

export function readFavorites(userId: string): string[] {
  try {
    const map = JSON.parse(localStorage.getItem(favoritesStorageKey) ?? '{}') as Record<string, string[]>
    return Array.isArray(map[userId]) ? map[userId] : []
  } catch {
    return []
  }
}

export function writeFavorites(userId: string, items: string[]) {
  try {
    const map = JSON.parse(localStorage.getItem(favoritesStorageKey) ?? '{}') as Record<string, string[]>
    map[userId] = items
    localStorage.setItem(favoritesStorageKey, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export type ProfileData = {
  id: string
  username: string
  email: string
  avatar: string
  bio: string
  createdAt: string
}

export function readProfile(userId: string, username = '', email = ''): ProfileData {
  try {
    const all = JSON.parse(localStorage.getItem(profilesStorageKey) ?? '{}') as Record<string, ProfileData>
    if (all[userId]) return all[userId]
  } catch {
    // ignore
  }
  return {
    id: userId,
    username: username || 'Colecionador Kurio',
    email: email || 'colecionador@kurio.art',
    avatar: '/assets/emerald-ape.png',
    bio: 'Colecionador de arte digital e entusiasta Web3.',
    createdAt: '2025-01-10',
  }
}

export function writeProfile(profile: ProfileData) {
  try {
    const all = JSON.parse(localStorage.getItem(profilesStorageKey) ?? '{}') as Record<string, ProfileData>
    all[profile.id] = profile
    localStorage.setItem(profilesStorageKey, JSON.stringify(all))
  } catch {
    // ignore
  }
}

