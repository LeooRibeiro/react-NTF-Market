import type { Socket } from 'socket.io-client'

export type NftUpdatedPayload = {
  id: string
  price: string
  previousPrice?: string
  available?: boolean
  previousAvailable?: boolean
  version: number
}

export type OrderUpdatedPayload = {
  id: string
  status: 'pending' | 'confirmed' | 'declined'
  transactionId?: string | null
  version: number
  accountId?: string
}

let socketPromise: Promise<Socket> | null = null

/**
 * Retorna ou cria a instância singleton do socket.io-client configurada
 * com transporte websocket puro para compatibilidade com o binding do MSW.
 */
export function getSocket(): Promise<Socket> {
  if (!socketPromise) {
    // Load socket.io-client after MSW starts so its Engine.IO transport captures
    // the intercepted WebSocket constructor instead of the native one.
    socketPromise = import('socket.io-client').then(({ io }) => {
      const origin = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'http://localhost:4183'

      const socket = io(origin, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 800,
      })

      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__kurioSocket = socket
      }
      return socket
    }).catch((error: unknown) => {
      socketPromise = null
      console.error('[socket.io] failed to initialize', error)
      throw error
    })
  }
  return socketPromise
}

// Rastreamento de versão para descartar duplicatas ou eventos obsoletos
const versionTracker = new Map<string, number>()

/**
 * Valida se um evento é mais recente que a última versão processada.
 * Evita aplicar eventos fora de ordem ou duplicados.
 */
export function isEventFresh(resourceId: string, version: number): boolean {
  const current = versionTracker.get(resourceId) ?? 0
  if (version <= current) {
    return false
  }
  versionTracker.set(resourceId, version)
  return true
}

/** Limpa o histórico de versões (útil em resets e testes). */
export function resetEventTracker() {
  versionTracker.clear()
}
