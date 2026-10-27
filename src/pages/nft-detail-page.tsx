import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Heart, Search, Share2, ShoppingCart, Star } from 'lucide-react'
import { getCatalog, getNft } from '../features/catalog/catalog-api'
import { addCartItem } from '../features/cart/cart-api'
import { Button } from '@/components/ui/button'

const collectionImages = ['/assets/hero-vessel.png', '/assets/violet-nomad.png', '/assets/ivory-baron.png', '/assets/golden-beat.png']
const defaultCatalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

/** Monta galeria, informações, ações de compra e sugestões da coleção selecionada. */
export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [favorite, setFavorite] = useState(false)
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
    return <main className="market-shell"><div className="detail-loading"><div className="detail-loading-image" /><div><i /><i /><i /><i /></div></div></main>
  }

  if (nftQuery.isError || !nftQuery.data) {
    const missing = isAxiosError(nftQuery.error) && nftQuery.error.response?.status === 404
    return <main className="market-shell detail-empty"><p className="eyebrow">{missing ? 'OBRA NÃO ENCONTRADA' : 'ERRO AO CARREGAR'}</p><h1>{missing ? 'Esta peça não está disponível.' : 'Não foi possível abrir esta obra.'}</h1><p>{missing ? 'O NFT pode ter sido removido ou o link está incorreto.' : 'Verifique sua conexão e tente novamente.'}</p><Link className="detail-back-button" to="/" search={defaultCatalogSearch}>Voltar ao mercado</Link></main>
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
    <main className="market-shell detail-page">
      <header className="topbar">
        <Link className="brand" to="/" search={defaultCatalogSearch}>KURIO</Link>
        <nav className="desktop-nav" aria-label="Navegação principal"><Link to="/" search={defaultCatalogSearch}>Início</Link><Link className="active" to="/" search={defaultCatalogSearch}>Mercado</Link><a href="/#creators">Criadores</a><a href="/#learn">Aprenda</a></nav>
        <div className="header-actions"><Link className="top-icon" to="/cart" aria-label="Abrir carrinho"><ShoppingCart size={17} /></Link><Link className="login-button" to="/" search={defaultCatalogSearch}>Entrar</Link></div>
      </header>

      <div className="detail-breadcrumb"><Link to="/" search={defaultCatalogSearch}><ArrowLeft size={14} /> Voltar ao mercado</Link><span>/</span><span>{nft.category}</span><span>/</span><span>{nft.name}</span></div>

      <section className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-gallery-row"><div className="detail-thumbnails" aria-label="Galeria da coleção">{collectionImages.map((src, index) => <button key={`${src}-${index}`} type="button" className={(selectedImage ?? coverImage) === src ? 'selected' : ''} onClick={() => setSelectedImage(src)} aria-label={`Ver imagem ${index + 1}`}><img src={src} alt="" />{index === 0 && <span className="thumb-creator">KS</span>}</button>)}</div><div className="detail-main-image"><img src={image} alt={`${nft.name}, arte digital criada por ${nft.artist}`} /><button className="detail-zoom" type="button" aria-label="Ver imagem da obra" onClick={() => setSelectedImage(coverImage)}><Search size={17} /></button></div></div>
        </div>

        <div className="detail-info">
          <div className="detail-title-row"><h1>{nft.name}</h1><button className="detail-icon" type="button" onClick={() => void shareNft()} aria-label="Compartilhar NFT"><Share2 size={17} /></button></div>
          <div className="detail-price-rating"><strong>{nft.price} ETH</strong><span aria-label="5 de 5 estrelas">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={12} fill="currentColor" />)} <small>19 avaliações de colecionadores</small></span></div>
          <div className="detail-copy"><strong>Sobre este NFT:</strong><p>Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na {nft.network}, com arte desbloqueável e acesso para colecionadores.</p></div>
          <div className="edition-pills"><strong>Edição:</strong><div><span>1/1</span><span>1/10</span><span className="selected">1/50</span><span>ABERTA</span></div></div>
          <div className="detail-action-row"><div className="detail-quantity"><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Aumentar quantidade" disabled={quantity >= 5} onClick={() => setQuantity((value) => Math.min(5, value + 1))}>+</button></div><Button className="detail-add-button" disabled={addMutation.isPending} onClick={() => { setMessage(''); addMutation.mutate() }}><ShoppingCart size={15} />{addMutation.isPending ? 'Adicionando…' : 'Comprar'}</Button><Button variant="outline" className={`detail-favorite-button ${favorite ? 'is-favorite' : ''}`} type="button" aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => setFavorite((value) => !value)}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} />Favoritar</Button></div>
          {(message || addError) && <p className={addError ? 'detail-feedback error' : 'detail-feedback'} role={addError ? 'alert' : 'status'}>{addError || message}{message && <Link className="detail-cart-link" to="/cart"> Ver carrinho ↗</Link>}</p>}
          <div className="detail-copy detail-token"><p>ID do token: #{nft.id.split('-').at(-1)?.replace(/^0/, '')}</p><p>Coleção: Kurio Apes</p><p>Atributos: {nft.category}, {nft.network}, Raro</p><button type="button" onClick={() => void shareNft()}>Compartilhar este NFT: <span>in ✉ ♥</span></button></div>
        </div>
      </section>
      <section className="detail-description"><div className="detail-tabs" role="tablist"><button role="tab" aria-selected={activeTab === 'details'} className={activeTab === 'details' ? 'selected' : ''} onClick={() => setActiveTab('details')}>Detalhes do NFT</button><button role="tab" aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'selected' : ''} onClick={() => setActiveTab('reviews')}>Avaliações de colecionadores (19)</button></div>{activeTab === 'details' ? <div className="description-copy"><p>{nft.name} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na {nft.network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p><p>A propriedade inclui arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência na rede.</p><strong>Rede:</strong><p>Cunhado na {nft.network} com procedência imutável e metadados armazenados no IPFS.</p><strong>Contrato:</strong><p>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente.</p><strong>Direitos autorais:</strong><p>0x7A42...19E8 · Contrato inteligente ERC-721 verificado.</p></div> : <div className="description-copy"><p>★★★★★ <strong>5,0</strong> · 19 avaliações verificadas de colecionadores.</p><p>“Uma peça incrível, com acabamento e detalhes excelentes.”</p></div>}</section>
      <section className="related-section"><h2>Mais desta coleção</h2><div className="related-grid">{(relatedQuery.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, 5).map((item) => <article className="nft-card" key={item.id}><Link className="nft-art-link" to="/nft/$nftId" params={{ nftId: item.id }}><img className="nft-art" src={item.image} alt={item.name} loading="lazy" /></Link><div className="nft-meta"><Link className="nft-title" to="/nft/$nftId" params={{ nftId: item.id }}>{item.name}</Link></div><div className="nft-price"><strong>{item.price} ETH</strong></div></article>)}</div><div className="related-dots" aria-label="Itens relacionados"><span /><span className="active" /><span /></div></section>
      <footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer>
    </main>
  )
}
