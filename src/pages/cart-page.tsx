import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCart, getCartQuote, multiplyEth, removeCartItem, updateCartItem } from '../features/cart/cart-api'

const defaultCatalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

function formatEth(value: string | undefined) {
  const amount = value ?? '0.0'
  return `${amount} ETH`
}

export function CartPage() {
  const queryClient = useQueryClient()
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart })
  const quoteQuery = useQuery({
    queryKey: ['cart-quote', cartQuery.data?.items.map(({ nftId, quantity }) => [nftId, quantity]), appliedCoupon],
    queryFn: () => getCartQuote(appliedCoupon),
    enabled: Boolean(cartQuery.data),
  })
  const updateMutation = useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) => updateCartItem(nftId, quantity),
    onSuccess: (cart) => { void queryClient.setQueryData(['cart'], cart) },
  })
  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => { void queryClient.setQueryData(['cart'], cart) },
  })
  const quoteError = quoteQuery.error && isAxiosError<{ message?: string }>(quoteQuery.error)
    ? quoteQuery.error.response?.data?.message ?? 'Não foi possível validar o cupom.'
    : ''

  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedCoupon(couponInput.trim())
  }

  const cart = cartQuery.data
  const quote = quoteQuery.data

  return (
    <main className="market-shell cart-page">
      <header className="topbar">
        <Link className="brand" to="/" search={defaultCatalogSearch}>KURIO</Link>
        <nav className="desktop-nav" aria-label="Navegação principal"><Link to="/" search={defaultCatalogSearch}>Início</Link><Link className="active" to="/" search={defaultCatalogSearch}>Mercado</Link><a href="/#creators">Criadores</a><a href="/#learn">Aprenda</a></nav>
        <div className="header-actions"><Link className="top-icon" to="/cart" aria-label={`Carrinho, ${cart?.totalItems ?? 0} itens`}><ShoppingBag size={17} /><span>{cart?.totalItems ?? 0}</span></Link><Link className="login-button" to="/" search={defaultCatalogSearch}>Entrar</Link></div>
      </header>

      <section className="cart-content">
        <div className="cart-heading"><div><p className="eyebrow">SUA COLEÇÃO</p><h1>Carrinho</h1><p>{cartQuery.isLoading ? 'Carregando seus itens…' : `${cart?.totalItems ?? 0} itens selecionados`}</p></div><Link to="/" search={defaultCatalogSearch}><ArrowLeft size={14} /> Continuar explorando</Link></div>

        {cartQuery.isLoading ? <div className="cart-loading" aria-label="Carregando carrinho"><div /><div /></div> : cartQuery.isError ? <div className="cart-empty"><strong>Não foi possível carregar o carrinho.</strong><Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button></div> : !cart?.items.length ? <div className="cart-empty"><span><ShoppingBag size={24} /></span><strong>Seu carrinho está vazio.</strong><p>Encontre uma peça única para começar sua coleção.</p><Link className="primary-button" to="/" search={defaultCatalogSearch}>Explorar o mercado</Link></div> : (
          <div className="cart-layout">
            <div className="cart-items" aria-label="Itens no carrinho">
              {cart.items.map(({ nft, nftId, quantity }) => <article className="cart-item" key={nftId}>
                <Link className="cart-item-image" to="/nft/$nftId" params={{ nftId }}><img src={nft.id === 'neon-vessel-552' ? '/assets/hero-vessel.png' : nft.image} alt={`${nft.name}, arte digital`} /></Link>
                <div className="cart-item-info"><span>{nft.category}</span><Link to="/nft/$nftId" params={{ nftId }}>{nft.name}</Link><small>Criado por {nft.artist}</small><div className="cart-mobile-price">{nft.price} ETH</div></div>
                <div className="cart-quantity"><button type="button" aria-label={`Diminuir ${nft.name}`} disabled={quantity <= 1 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId, quantity: quantity - 1 })}><Minus size={13} /></button><span aria-live="polite">{quantity}</span><button type="button" aria-label={`Aumentar ${nft.name}`} disabled={quantity >= 5 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId, quantity: quantity + 1 })}><Plus size={13} /></button></div>
                <strong className="cart-item-total">{multiplyEth(nft.price, quantity)} ETH</strong>
                <button className="remove-cart-item" type="button" aria-label={`Remover ${nft.name}`} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(nftId)}><Trash2 size={15} /></button>
              </article>)}
              <Link className="back-to-market" to="/" search={defaultCatalogSearch}><ArrowLeft size={13} /> Voltar ao mercado</Link>
            </div>

            <aside className="cart-summary" aria-label="Resumo do pedido">
              <h2>Resumo do pedido</h2>
              <form className="coupon-form" onSubmit={applyCoupon}>
                <label className="sr-only" htmlFor="cart-coupon">Código do cupom</label>
                <Input id="cart-coupon" className="coupon-input" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Código do cupom" />
                <Button type="submit" className="coupon-submit" disabled={quoteQuery.isFetching}>Aplicar</Button>
              </form>
              {quoteError && <p className="coupon-feedback error" role="alert">{quoteError}</p>}
              {quote?.coupon && <p className="coupon-feedback" role="status">Cupom {quote.coupon} aplicado: 10% de desconto <button type="button" aria-label="Remover cupom" onClick={() => { setAppliedCoupon(''); setCouponInput('') }}><X size={12} /></button></p>}
              <div className="summary-lines"><div><span>Subtotal</span><strong>{formatEth(quote?.subtotal)}</strong></div><div><span>Desconto</span><strong>{quote?.discount && quote.discount !== '0.0' ? `− ${quote.discount} ETH` : '—'}</strong></div><div><span>Taxa de rede</span><strong>{formatEth(quote?.networkFee)}</strong></div></div>
              <div className="summary-total"><span>Total estimado</span><strong>{formatEth(quote?.total)}</strong></div>
              <p className="quote-note">O valor final será confirmado com a cotação atual antes do pagamento.</p>
              <Button className="checkout-button" disabled title="O pagamento será implementado na próxima etapa">Continuar para pagamento</Button>
            </aside>
          </div>
        )}
      </section>
      <footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer>
    </main>
  )
}
