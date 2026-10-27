import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Heart, Search, Share2, ShoppingCart, Star } from 'lucide-react'
import { getCatalog, getNft } from '../features/catalog/catalog-api'
import { addCartItem } from '../features/cart/cart-api'
import { useFavorites } from '../features/favorites/favorites-api'
import { Button } from '@/components/ui/button'
import { MarketHeader } from '../components/market-header'
import { marketShellClass } from '../lib/marketplace-styles'

const collectionImages = ['/assets/hero-vessel.png', '/assets/violet-nomad.png', '/assets/ivory-baron.png', '/assets/golden-beat.png']
const defaultCatalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

/** Monta galeria, informações, ações de compra e sugestões da coleção selecionada. */
export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const queryClient = useQueryClient()
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const favorite = isFavorite(nftId)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const nftQuery = useQuery({ queryKey: ['nft', nftId], queryFn: () => getNft(nftId) })
  const relatedQuery = useQuery({ queryKey: ['related-nfts', nftId], queryFn: () => getCatalog({ q: '', category: 'Todas', sort: 'recent', page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }) })
  const addMutation = useMutation({
    mutationFn: () => addCartItem(nftId, quantity),
    onSuccess: async (cart) => {
      await queryClient.setQueryData(['cart'], cart)
      setMessage(`${quantity} ${quantity === 1 ? 'item adicionado' : 'itens adicionados'} ao carrinho.`)
    },
  })

  if (nftQuery.isLoading) {
    return (
      <main className={marketShellClass}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10" aria-label="Carregando detalhes do NFT">
          <div className="skeleton-shimmer aspect-square w-full max-w-sm rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton-shimmer h-8 w-3/4 rounded" />
            <div className="skeleton-shimmer h-6 w-1/3 rounded" />
            <div className="skeleton-shimmer h-24 w-full rounded" />
            <div className="skeleton-shimmer h-10 w-1/2 rounded" />
          </div>
        </div>
      </main>
    )
  }

  if (nftQuery.isError || !nftQuery.data) {
    const missing = isAxiosError(nftQuery.error) && nftQuery.error.response?.status === 404
    return <main className={`${marketShellClass} flex min-h-detail-state flex-col items-start justify-center`}><p className="eyebrow">{missing ? 'OBRA NÃO ENCONTRADA' : 'ERRO AO CARREGAR'}</p><h1 className="mb-2 mt-0 text-2xl">{missing ? 'Esta peça não está disponível.' : 'Não foi possível abrir esta obra.'}</h1><p className="text-sm text-market-ink-muted">{missing ? 'O NFT pode ter sido removido ou o link está incorreto.' : 'Verifique sua conexão e tente novamente.'}</p><Link className="detail-back-button" to="/" search={defaultCatalogSearch}>Voltar ao mercado</Link></main>
  }

  const nft = nftQuery.data
  const coverImage = nft.id === 'neon-vessel-552' ? '/assets/hero-vessel.png' : nft.image
  const image = selectedImage ?? coverImage
  const addError = addMutation.error && isAxiosError<{ message?: string }>(addMutation.error)
    ? addMutation.error.response?.data?.message ?? 'Não foi possível adicionar este item.'
    : ''

  /** Copia a URL do NFT e mantém uma mensagem acessível quando a área de transferência falha. */
  async function shareNft() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage('Link copiado.')
    } catch {
      setMessage('Copie o endereço desta página para compartilhar.')
    }
  }

  return (
    <main className={`${marketShellClass} min-h-screen`}>
      <MarketHeader search={defaultCatalogSearch} active="market" accountAction={<Link className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-xs font-bold text-market-deep" to="/" search={defaultCatalogSearch}>Entrar</Link>} />

      <div className="detail-breadcrumb flex flex-wrap items-center gap-2 pb-3 pt-5 text-xs text-market-copy max-tablet:pb-2.5 max-tablet:pt-4 max-tablet:text-xs"><Link className="inline-flex items-center gap-1.5 text-market-accent" to="/" search={defaultCatalogSearch}><ArrowLeft size={14} /> Voltar ao mercado</Link><span>/</span><span>{nft.category}</span><span>/</span><span>{nft.name}</span></div>

      <section className="detail-layout grid detail-layout-grid items-start  px-0 pb-16 pt-2 max-tablet:grid-cols-1 max-tablet:gap-6 max-tablet:pt-1">
        <div className="detail-gallery min-w-0">
          <div className="detail-gallery-row grid min-w-0 detail-gallery-grid items-stretch gap-3 max-tablet:grid-cols-1 max-tablet:gap-2"><div className="detail-thumbnails grid grid-cols-1 detail-thumb-grid gap-2 max-tablet:order-2 max-tablet:grid-cols-4 max-tablet:grid-rows-1" aria-label="Galeria da coleção">{collectionImages.map((src, index) => <button key={`${src}-${index}`} type="button" className={`relative aspect-square overflow-hidden rounded-md border bg-market-surface p-0.5 ${((selectedImage ?? coverImage) === src ? 'selected border-primary' : 'border-transparent')}`} onClick={() => setSelectedImage(src)} aria-label={`Ver imagem ${index + 1}`}><img className="size-full rounded-sm object-cover" src={src} alt="" />{index === 0 && <span className="thumb-creator absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-market-deep">KS</span>}</button>)}</div><div className="detail-main-image relative aspect-square w-full max-w-sm justify-self-start overflow-hidden rounded-xl border border-market-surface bg-market-surface p-2 max-tablet:max-w-sm max-tablet:justify-self-center"><img className="block size-full max-h-full max-w-full rounded-md object-cover" src={image} alt={`${nft.name}, arte digital criada por ${nft.artist}`} /><button className="detail-zoom absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full border border-border bg-market-page/90 text-foreground" type="button" aria-label="Ver imagem da obra" onClick={() => setSelectedImage(coverImage)}><Search size={17} /></button></div></div>
        </div>

        <div className="detail-info">
          <div className="detail-title-row"><h1>{nft.name}</h1><button className="detail-icon" type="button" onClick={() => void shareNft()} aria-label="Compartilhar NFT"><Share2 size={17} /></button></div>
          <div className="detail-price-rating"><strong>{nft.price} ETH</strong>{nft.available === false && <span className="text-market-danger" role="status">Edição esgotada</span>}<span aria-label="5 de 5 estrelas">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill="currentColor" />)} <small>19 avaliações de colecionadores</small></span></div>
          <div className="detail-copy"><strong>Sobre este NFT:</strong><p>Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na {nft.network}, com arte desbloqueável e acesso para colecionadores.</p></div>
          <div className="edition-pills"><strong>Edição:</strong><div><span>1/1</span><span>1/10</span><span className="selected">1/50</span><span>ABERTA</span></div></div>
          <div className="detail-action-row"><div className="detail-quantity"><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1 || nft.available === false} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Aumentar quantidade" disabled={quantity >= 5 || nft.available === false} onClick={() => setQuantity((value) => Math.min(5, value + 1))}>+</button></div><Button className="detail-add-button" disabled={nft.available === false || addMutation.isPending} onClick={() => { setMessage(''); addMutation.mutate() }}><ShoppingCart size={15} />{nft.available === false ? 'Esgotado' : addMutation.isPending ? 'Adicionando…' : 'Comprar'}</Button><Button variant="outline" className={`detail-favorite-button ${favorite ? 'is-favorite' : ''}`} type="button" aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => toggleFavorite(nftId)}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'Favoritado' : 'Favoritar'}</Button></div>
          {(message || addError) && <p className={addError ? 'detail-feedback error' : 'detail-feedback'} role={addError ? 'alert' : 'status'}>{addError || message}{message && <Link className="detail-cart-link" to="/cart" search={defaultCatalogSearch}> Ver carrinho ↗</Link>}</p>}
          <div className="detail-copy detail-token"><p>ID do token: #{nft.id.split('-').at(-1)?.replace(/^0/, '')}</p><p>Coleção: Kurio Apes</p><p>Atributos: {nft.category}, {nft.network}, Raro</p><button type="button" onClick={() => void shareNft()}>Compartilhar este NFT: <span>in ✉ ♥</span></button></div>
        </div>
      </section>
      <section className="detail-description"><div className="detail-tabs" role="tablist"><button role="tab" aria-selected={activeTab === 'details'} className={activeTab === 'details' ? 'selected' : ''} onClick={() => setActiveTab('details')}>Detalhes do NFT</button><button role="tab" aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'selected' : ''} onClick={() => setActiveTab('reviews')}>Avaliações de colecionadores (19)</button></div>{activeTab === 'details' ? <div className="description-copy"><p>{nft.name} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na {nft.network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p><p>A propriedade inclui arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência na rede.</p><strong>Rede:</strong><p>Cunhado na {nft.network} com procedência imutável e metadados armazenados no IPFS.</p><strong>Contrato:</strong><p>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente.</p><strong>Direitos autorais:</strong><p>0x7A42...19E8 · Contrato inteligente ERC-721 verificado.</p></div> : <div className="description-copy"><p>★★★★★ <strong>5,0</strong> · 19 avaliações verificadas de colecionadores.</p><p>“Uma peça incrível, com acabamento e detalhes excelentes.”</p></div>}</section>
      <section className="related-section"><h2>Mais desta coleção</h2><div className="related-grid">{(relatedQuery.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, 5).map((item) => <article className="nft-card" key={item.id}><Link className="nft-art-link" to="/nft/$nftId" params={{ nftId: item.id }} search={defaultCatalogSearch}><img className="nft-art" src={item.image} alt={item.name} loading="lazy" /></Link><div className="nft-meta"><Link className="nft-title" to="/nft/$nftId" params={{ nftId: item.id }} search={defaultCatalogSearch}>{item.name}</Link></div><div className="nft-price"><strong>{item.price} ETH</strong></div></article>)}</div><div className="related-dots" aria-label="Itens relacionados"><span /><span className="active" /><span /></div></section>
      <footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer>
    </main>
  )
}
