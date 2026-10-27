import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type FavoritesResponse = {
  items: string[]
}

/** Consulta os IDs de NFTs favoritados pelo colecionador autenticado. */
export async function getFavorites(): Promise<string[]> {
  try {
    const { data } = await api.get<FavoritesResponse>('/favorites')
    return data.items
  } catch {
    return []
  }
}

/** Adiciona um NFT aos favoritos do colecionador. */
export async function addFavorite(nftId: string): Promise<string[]> {
  const { data } = await api.post<FavoritesResponse>('/favorites', { nftId })
  return data.items
}

/** Remove um NFT dos favoritos do colecionador. */
export async function removeFavorite(nftId: string): Promise<string[]> {
  const { data } = await api.delete<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`)
  return data.items
}

/**
 * Hook com consulta e mutação otimista de favoritos com rollback em caso de falha.
 * Atende ao requisito explícito de atualização otimista com tratamento de erro.
 */
export function useFavorites() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 60_000,
  })

  const favoriteIds = query.data ?? []

  const toggleMutation = useMutation({
    mutationFn: async ({ nftId, isFavorited }: { nftId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return removeFavorite(nftId)
      } else {
        return addFavorite(nftId)
      }
    },
    // Atualização otimista: reflete a mudança visual imediatamente antes da resposta da API
    onMutate: async ({ nftId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites']) ?? []

      queryClient.setQueryData<string[]>(['favorites'], (old = []) => {
        if (isFavorited) {
          return old.filter((id) => id !== nftId)
        } else {
          return [...old, nftId]
        }
      })

      return { previousFavorites }
    },
    // Rollback: se a API retornar erro, reverte ao estado original anterior
    onError: (_error, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  function toggle(nftId: string) {
    const isFavorited = favoriteIds.includes(nftId)
    toggleMutation.mutate({ nftId, isFavorited })
  }

  function isFavorite(nftId: string) {
    return favoriteIds.includes(nftId)
  }

  return {
    favoriteIds,
    isFavorite,
    toggle,
    isPending: toggleMutation.isPending,
  }
}
