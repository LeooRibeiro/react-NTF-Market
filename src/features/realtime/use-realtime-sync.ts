import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, isEventFresh, type NftUpdatedPayload, type OrderUpdatedPayload } from '../../lib/socket'
import { updateNftInCache, updateOrderInCache } from './realtime-cache'

/** Mantém o cache da aplicação sincronizado com os eventos do servidor. */
export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    function handleNftUpdated(payload: NftUpdatedPayload) {
      if (!payload?.id || !isEventFresh(payload.id, payload.version)) return
      updateNftInCache(queryClient, payload)
    }

    function handleOrderUpdated(payload: OrderUpdatedPayload) {
      if (!payload?.id || !isEventFresh(payload.id, payload.version)) return
      updateOrderInCache(queryClient, payload)
    }

    function handleReconnect() {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      void queryClient.invalidateQueries({ queryKey: ['order'] })
    }

    socket.on('nft.updated', handleNftUpdated)
    socket.on('order.updated', handleOrderUpdated)
    socket.io.on('reconnect', handleReconnect)

    return () => {
      socket.off('nft.updated', handleNftUpdated)
      socket.off('order.updated', handleOrderUpdated)
      socket.io.off('reconnect', handleReconnect)
    }
  }, [queryClient])
}
