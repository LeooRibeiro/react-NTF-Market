import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check, Heart, Share2, ShoppingCart, ShieldCheck } from 'lucide-react'
import { getNft } from '../features/catalog/catalog-api'
import { addCartItem } from '../features/cart/cart-api'
import { Button } from '@/components/ui/button'

const collectionImages = ['/assets/hero-vessel.png', '/assets/violet-nomad.png', '/assets/ivory-baron.png', '/assets/golden-beat.png']
const defaultCatalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const nftQuery = useQuery({ queryKey: ['nft', nftId], queryFn: () => getNft(nftId) })
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
          <div className="detail-main-image"><img src={image} alt={`${nft.name}, arte digital criada por ${nft.artist}`} /><span className="detail-edition">EDIÇÃO LIMITADA</span></div>
          <div className="detail-thumbnails" aria-label="Galeria da coleção">{collectionImages.map((src, index) => <button key={`${src}-${index}`} type="button" className={(selectedImage ?? coverImage) === src ? 'selected' : ''} onClick={() => setSelectedImage(src)} aria-label={`Ver imagem ${index + 1}`}><img src={src} alt="" /></button>)}</div>
          <div className="detail-about"><h2>Sobre a coleção</h2><p>Personagens únicos que exploram um universo de arte digital, identidade e expressão criativa.</p><Link to="/" search={defaultCatalogSearch}>Ver coleção <span>↗</span></Link></div>
        </div>

        <div className="detail-info">
          <p className="eyebrow">{nft.category.toUpperCase()} · {nft.network.toUpperCase()}</p>
          <div className="detail-title-row"><h1>{nft.name}</h1><button className="detail-icon" type="button" onClick={() => void shareNft()} aria-label="Compartilhar NFT"><Share2 size={17} /></button></div>
          <p className="detail-creator">Criado por <strong>{nft.artist}</strong><span className="verified-dot"><Check size={9} /></span></p>

          <div className="price-panel"><span>PREÇO ATUAL</span><div><strong>{nft.price} ETH</strong>{nft.previousPrice && <del>{nft.previousPrice} ETH</del>}</div><small>Preço atualizado pela cotação do marketplace</small></div>

          <div className="detail-edition-row"><div><span>EDIÇÃO</span><strong>#{nft.id.split('-').at(-1)?.replace(/^0/, '')}</strong></div><div className="detail-quantity"><span>QUANTIDADE</span><div><button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Aumentar quantidade" disabled={quantity >= 5} onClick={() => setQuantity((value) => Math.min(5, value + 1))}>+</button></div></div></div>

          <div className="detail-buy-actions"><Button className="detail-add-button" disabled={addMutation.isPending} onClick={() => { setMessage(''); addMutation.mutate() }}><ShoppingCart size={16} />{addMutation.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}</Button><Button variant="outline" className="detail-favorite-button" type="button" disabled title="Favoritos exigem uma conta; essa etapa vem a seguir" aria-label="Adicionar aos favoritos"><Heart size={17} /></Button></div>
          {(message || addError) && <p className={addError ? 'detail-feedback error' : 'detail-feedback'} role={addError ? 'alert' : 'status'}>{addError || message}{message && <Link className="detail-cart-link" to="/cart"> Ver carrinho ↗</Link>}</p>}

          <div className="detail-trust"><ShieldCheck size={16} /><span>Compra protegida · Propriedade verificada</span></div>
          <div className="detail-attributes"><h2>Detalhes da peça</h2><div><span>Coleção</span><strong>Kurio Apes</strong></div><div><span>Rede</span><strong>{nft.network}</strong></div><div><span>Criador</span><strong>{nft.artist}</strong></div><div><span>Disponibilidade</span><strong>5 edições</strong></div></div>
        </div>
      </section>
      <footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer>
    </main>
  )
}
