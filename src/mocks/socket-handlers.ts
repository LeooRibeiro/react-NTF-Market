import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { resetEventTracker } from '../lib/socket'
import { initialNfts, nfts, getMockSession, getOrdersStorageKey, getScopedStorageKey, readCart, writeCart } from './mock-data'
import { resetNetworkScenarios } from './network-scenarios'
// -------------------------------------------------------------
// Realtime com Socket.IO e Mock Service Worker
// -------------------------------------------------------------
type MockSocketClient = {
  emit: (event: string, ...args: unknown[]) => void
}

export const activeSocketClients = new Set<MockSocketClient>()

/**
 * Transmite um evento para todos os clientes conectados ao Socket.IO simulado.
 */
export function broadcastSocketEvent(event: string, ...args: unknown[]) {
  for (const client of activeSocketClients) {
    try {
      client.emit(event, ...args)
    } catch {
      activeSocketClients.delete(client)
    }
  }
}

/**
 * Atualiza o preço de um NFT nos dados locais e emite o evento `nft.updated` via Socket.IO.
 */
export function updateNftPrice(nftId: string, newPrice: string, version = Date.now()) {
  const nft = nfts.find((candidate) => candidate.id === nftId)
  if (!nft) return null
  const previousPrice = nft.price
  nft.price = newPrice
  nft.previousPrice = previousPrice
  const payload = {
    id: nftId,
    price: newPrice,
    previousPrice,
    version,
  }
  broadcastSocketEvent('nft.updated', payload)
  return payload
}

/** Atualiza a disponibilidade de uma edição e publica `nft.updated` via Socket.IO. */
export function updateNftAvailability(nftId: string, available: boolean, version = Date.now()) {
  const nft = nfts.find((candidate) => candidate.id === nftId)
  if (!nft) return null

  const previousAvailable = nft.available ?? true
  nft.available = available
  const payload = {
    id: nftId,
    price: nft.price,
    previousPrice: nft.price,
    available,
    previousAvailable,
    version,
  }
  broadcastSocketEvent('nft.updated', payload)
  return payload
}

/**
 * Atualiza o estado de um pedido e emite `order.updated` via Socket.IO.
 */
export function updateOrderStatus(orderId: string, status: 'confirmed' | 'declined' | 'pending', version = Date.now()) {
  const userId = getMockSession()?.id
  if (!userId) return null
  const orderKey = getOrdersStorageKey(userId)
  const orders = JSON.parse(localStorage.getItem(orderKey) ?? '[]') as Array<Record<string, unknown>>
  const order = orders.find((candidate) => candidate.id === orderId)
  if (!order) return null
  if (order.status === 'confirmed' || order.status === 'declined') return null
  order.status = status
  if (status === 'confirmed' && !order.transactionId) {
    order.transactionId = `0x${crypto.randomUUID().replaceAll('-', '')}`
  }

  if (status === 'confirmed') {
    const orderItems = order.items as Array<{ nft: { id: string }; quantity: number }> | undefined
    const purchasedQuantities = new Map((orderItems ?? []).map((item) => [item.nft.id, item.quantity]))
    const cart = readCart()

    writeCart(cart.flatMap((item) => {
      const remaining = item.quantity - (purchasedQuantities.get(item.nftId) ?? 0)
      return remaining > 0 ? [{ ...item, quantity: remaining }] : []
    }))
    localStorage.removeItem(getScopedStorageKey('kurio-cart-coupon-v1', userId))

    for (const nftId of purchasedQuantities.keys()) {
      updateNftAvailability(nftId, false, version)
    }
  }

  localStorage.setItem(orderKey, JSON.stringify(orders))
  const payload = {
    id: orderId,
    status,
    transactionId: (order.transactionId as string) ?? null,
    version,
    accountId: userId,
  }
  broadcastSocketEvent('order.updated', payload)
  return payload
}

/**
 * Restaura o estado inicial limpo dos mocks para testes e demonstrações determinísticas.
 */
export function resetMockDatabase() {
  resetEventTracker()
  resetNetworkScenarios()
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('kurio-')) localStorage.removeItem(key)
  }
  sessionStorage.clear()

  // Restaura catálogo com preços e disponibilidades originais
  nfts.length = 0
  nfts.push(...JSON.parse(JSON.stringify(initialNfts)))
}

// Expõe helpers no window para Playwright e painel de depuração
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>
  w.__kurioUpdateNftPrice = updateNftPrice
  w.__kurioUpdateNftAvailability = updateNftAvailability
  w.__kurioUpdateOrderStatus = updateOrderStatus
  w.__kurioBroadcastSocket = broadcastSocketEvent
  w.__kurioResetData = resetMockDatabase
  w.__kurioActiveSocketClients = activeSocketClients
}

// Handler de WebSocket interceptando conexões do socket.io-client via MSW.
const socketUrl = typeof window !== 'undefined'
  ? new URL('/', window.location.origin).href.replace(/^http/, 'ws')
  : '*'
const socketLink = ws.link(socketUrl)
export const socketIoHandler = socketLink.addEventListener('connection', (connection) => {
  const duplex = toSocketIo(connection)
  const client = duplex.client as unknown as MockSocketClient
  activeSocketClients.add(client)

  duplex.client.on('simulate:nft.updated', (_event, payload) => {
    broadcastSocketEvent('nft.updated', payload)
  })

  duplex.client.on('simulate:order.updated', (_event, payload) => {
    broadcastSocketEvent('order.updated', payload)
  })

  duplex.rawClient.addEventListener('close', () => {
    activeSocketClients.delete(client)
  })
})

