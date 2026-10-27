import { useEffect, useState } from 'react'

export type PriceChangeNotice = {
  nftId: string
  nftName: string
  oldPrice: string
  newPrice: string
  availableChanged?: boolean
  available?: boolean
  timestamp: number
}

let activePriceNotices: PriceChangeNotice[] = []
const noticeListeners = new Set<() => void>()

function notifyListeners() {
  noticeListeners.forEach((listener) => listener())
}

export function getPriceNotices() {
  return activePriceNotices
}

export function clearPriceNotices() {
  activePriceNotices = []
  notifyListeners()
}

export function removePriceNotice(nftId: string) {
  activePriceNotices = activePriceNotices.filter((notice) => notice.nftId !== nftId)
  notifyListeners()
}

export function addPriceNotice(notice: PriceChangeNotice) {
  const latestTimestamp = activePriceNotices.reduce((latest, existing) => Math.max(latest, existing.timestamp), 0)
  activePriceNotices = [
    ...activePriceNotices.filter((existing) => existing.nftId !== notice.nftId),
    { ...notice, timestamp: Math.max(notice.timestamp, latestTimestamp + 1) },
  ]
  notifyListeners()
}

/** Permite que Carrinho e Checkout acompanhem avisos de preço. */
export function usePriceNotices() {
  const [notices, setNotices] = useState<PriceChangeNotice[]>(activePriceNotices)

  useEffect(() => {
    const update = () => setNotices([...activePriceNotices])
    noticeListeners.add(update)
    return () => {
      noticeListeners.delete(update)
    }
  }, [])

  return { notices, clearNotices: clearPriceNotices, removeNotice: removePriceNotice }
}
