import { api } from '../../lib/api'

export const sortOptions = ['recent', 'price-asc', 'price-desc'] as const
export type SortOption = (typeof sortOptions)[number]

export type Nft = {
  id: string
  name: string
  artist: string
  category: string
  network: string
  price: string
  previousPrice?: string
  image: string
  rarity?: string
  listedAt: number
}

export type CatalogQuery = {
  q: string
  category: string
  sort: SortOption
  page: number
  minPrice: number
  maxPrice: number
  network: string
}

export type CatalogResult = {
  items: Nft[]
  total: number
  page: number
  pageSize: number
}

export async function getCatalog(query: CatalogQuery) {
  const { data } = await api.get<CatalogResult>('/nfts', { params: query })
  return data
}

export type RegisterInput = {
  username: string
  email: string
  password: string
}

export async function registerAccount(input: RegisterInput) {
  const { data } = await api.post<{ id: string; username: string; email: string }>('/auth/register', input)
  return data
}
