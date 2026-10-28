import type { QueryClient } from '@tanstack/react-query'
import type { NftUpdatedPayload, OrderUpdatedPayload } from '../../lib/socket'
import type { CatalogResult, Nft } from '../catalog/catalog-api'
import type { Cart } from '../cart/cart-api'
import type { OrderSnapshot } from '../orders/orders-api'
import { addPriceNotice } from './price-notices'

export function updateNftInCache(queryClient: QueryClient, payload: NftUpdatedPayload) {
  const cartBeforeUpdate = queryClient.getQueryData<Cart>(['cart'])
  const itemIsInCart = cartBeforeUpdate?.items.some((line) => line.nftId === payload.id) ?? false

  queryClient.setQueryData<Nft>(['nft', payload.id], (current) => {
    if (!current) return current
    return {
      ...current,
      previousPrice: current.price,
      price: payload.price,
      ...(payload.available === undefined ? {} : { available: payload.available }),
    }
  })

  queryClient.setQueriesData<CatalogResult>({ queryKey: ['catalog'] }, (current) => {
    if (!current) return current
    return {
      ...current,
      items: current.items.map((item) => item.id === payload.id
        ? {
            ...item,
            previousPrice: item.price,
            price: payload.price,
            ...(payload.available === undefined ? {} : { available: payload.available }),
          }
        : item),
    }
  })

  if (itemIsInCart) {
    addPriceNotice({
      nftId: payload.id,
      nftName: cartBeforeUpdate?.items.find((line) => line.nftId === payload.id)?.nft.name ?? payload.id,
      oldPrice: payload.previousPrice || '',
      newPrice: payload.price,
      availableChanged: payload.available !== undefined,
      available: payload.available,
      timestamp: Date.now(),
    })
    void queryClient.invalidateQueries({ queryKey: ['cart-quote'] })
  }

  queryClient.setQueryData<Cart>(['cart'], (current) => {
    if (!current) return current
    return {
      ...current,
      items: current.items.map((line) => line.nftId === payload.id
        ? {
            ...line,
            nft: {
              ...line.nft,
              previousPrice: line.nft.price,
              price: payload.price,
              ...(payload.available === undefined ? {} : { available: payload.available }),
            },
          }
        : line),
    }
  })
}

export function updateOrderInCache(queryClient: QueryClient, payload: OrderUpdatedPayload) {
  queryClient.setQueryData<OrderSnapshot>(['order', payload.id], (current) => {
    if (!current) return current
    return {
      ...current,
      status: payload.status,
      transactionId: payload.transactionId ?? current.transactionId,
    }
  })

  if (payload.status === 'confirmed') {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }
}
