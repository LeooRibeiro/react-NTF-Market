import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { getSocket, isEventFresh, resetEventTracker, type NftUpdatedPayload, type OrderUpdatedPayload } from '../../lib/socket'
import type { Socket } from 'socket.io-client'
import { getSession } from '../auth/auth-api'
import { clearPriceNotices } from './price-notices'
import { updateNftInCache, updateOrderInCache } from './realtime-cache'

/** Mantém o cache da aplicação sincronizado com os eventos do servidor. */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: getSession, refetchInterval: (query) => query.state.data ? 30_000 : false, refetchOnWindowFocus: true })
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (session.isPending) return
    const nextUserId = session.data?.id ?? null
    if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) {
      queryClient.removeQueries({ predicate: (query) => ['cart', 'cart-quote', 'profile', 'wallets', 'favorites', 'order'].includes(String(query.queryKey[0])) })
      clearPriceNotices()
      resetEventTracker()
    }
    previousUserId.current = nextUserId
  }, [queryClient, session.data?.id, session.isPending])

  useEffect(() => {
    let active = true
    let socket: Socket | undefined

    function handleNftUpdated(payload: NftUpdatedPayload) {
      if (!payload?.id || !isEventFresh(payload.id, payload.version)) return
      updateNftInCache(queryClient, payload)
    }

    function handleOrderUpdated(payload: OrderUpdatedPayload) {
      let activeUserId: string | undefined
      try { activeUserId = (JSON.parse(localStorage.getItem('kurio-session-v1') ?? 'null') as { id?: string } | null)?.id } catch { activeUserId = undefined }
      if (payload.accountId && payload.accountId !== activeUserId) return
      if (!payload?.id || !isEventFresh(payload.id, payload.version)) return
      updateOrderInCache(queryClient, payload)
    }

    function handleReconnect() {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      void queryClient.invalidateQueries({ queryKey: ['order'] })
    }

    function handleSessionExpired() {
      queryClient.setQueryData(['session'], null)
    }

    void getSocket().then((connectedSocket) => {
      if (!active) return
      socket = connectedSocket
      socket.on('nft.updated', handleNftUpdated)
      socket.on('order.updated', handleOrderUpdated)
      socket.io.on('reconnect', handleReconnect)
    }).catch(() => {
      // Socket.IO owns retries; REST remains the source for explicit refreshes.
    })
    window.addEventListener('kurio:session-expired', handleSessionExpired)

    return () => {
      active = false
      socket?.off('nft.updated', handleNftUpdated)
      socket?.off('order.updated', handleOrderUpdated)
      socket?.io.off('reconnect', handleReconnect)
      window.removeEventListener('kurio:session-expired', handleSessionExpired)
    }
  }, [queryClient])
}
