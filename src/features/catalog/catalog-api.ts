import { api } from '../../lib/api'
import type { Collector } from '../auth/auth-api'

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
  available?: boolean
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

/** Busca a página do catálogo usando busca, filtros, ordenação e paginação da URL. */
export async function getCatalog(query: CatalogQuery) {
  const { data } = await api.get<CatalogResult>('/nfts', { params: query })
  return data
}

/** Consulta os dados de uma peça pelo identificador usado na rota de detalhe. */
export async function getNft(id: string) {
  const { data } = await api.get<Nft>(`/nfts/${encodeURIComponent(id)}`)
  return data
}

export type RegisterInput = {
  username: string
  email: string
  password: string
}

/** Envia os dados validados do formulário para criar uma conta de colecionador. */
export async function registerAccount(input: RegisterInput) {
  const { data } = await api.post<Collector>('/auth/register', input)
  return data
}
