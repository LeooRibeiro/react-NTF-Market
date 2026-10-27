import { delay, http, HttpResponse } from 'msw'
import type { CatalogResult, SortOption } from '../features/catalog/catalog-api'
import { nfts } from './mock-data'
export const catalogHandlers = [
// NFTs
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
]
