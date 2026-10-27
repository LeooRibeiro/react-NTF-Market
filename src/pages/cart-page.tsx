import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartCheckoutModal } from '../components/cart-checkout-modal'
import { getCart, getCartQuote, multiplyEth, removeCartItem, updateCartItem } from '../features/cart/cart-api'

const couponStorageKey = 'kurio-cart-coupon-v1'

/** Formata o total decimal retornado pela API e mostra zero enquanto a cotação carrega. */
function formatEth(value: string | undefined) {
  const amount = value ?? '0.0'
  return `${amount} ETH`
}

/** Mantém quantidades, remoção, cupom e resumo do carrinho sincronizados com a API. */
export function CartPage() {
  const catalogSearch = useSearch({ from: '/' })
  const queryClient = useQueryClient()
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(() => localStorage.getItem(couponStorageKey) ?? '')
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

  /** Submete o código digitado e persiste a escolha para manter o cupom no checkout. */
  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const coupon = couponInput.trim()
    setAppliedCoupon(coupon)
    localStorage.setItem(couponStorageKey, coupon)
  }

  const cart = cartQuery.data
  const quote = quoteQuery.data

  return (
    <CartCheckoutModal title="Carrinho">
      <section className="cart-content">
        <div className="cart-heading"><div><p className="eyebrow">SUA COLEÇÃO</p><h1>Carrinho</h1><p>{cartQuery.isLoading ? 'Carregando seus itens…' : `${cart?.totalItems ?? 0} itens selecionados`}</p></div><Link to="/" search={catalogSearch}><ArrowLeft size={14} /> Continuar explorando</Link></div>

        {cartQuery.isLoading ? <div className="cart-loading" aria-label="Carregando carrinho"><div /><div /></div> : cartQuery.isError ? <div className="cart-empty"><strong>Não foi possível carregar o carrinho.</strong><Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button></div> : !cart?.items.length ? <div className="cart-empty"><span><ShoppingBag size={24} /></span><strong>Seu carrinho está vazio.</strong><p>Encontre uma peça única para começar sua coleção.</p><Link className="primary-button" to="/" search={catalogSearch}>Explorar o mercado</Link></div> : (
          <div className="cart-layout">
            <div className="cart-items" aria-label="Itens no carrinho">
              {cart.items.map(({ nft, nftId, quantity }) => <article className="cart-item" key={nftId}>
                <Link className="cart-item-image" to="/nft/$nftId" params={{ nftId }}><img src={nft.id === 'neon-vessel-552' ? '/assets/hero-vessel.png' : nft.image} alt={`${nft.name}, arte digital`} /></Link>
                <div className="cart-item-info"><span>{nft.category}</span><Link to="/nft/$nftId" params={{ nftId }}>{nft.name}</Link><small>Criado por {nft.artist}</small><div className="cart-mobile-price">{nft.price} ETH</div></div>
                <div className="cart-quantity"><button type="button" aria-label={`Diminuir ${nft.name}`} disabled={quantity <= 1 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId, quantity: quantity - 1 })}><Minus size={13} /></button><span aria-live="polite">{quantity}</span><button type="button" aria-label={`Aumentar ${nft.name}`} disabled={quantity >= 5 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId, quantity: quantity + 1 })}><Plus size={13} /></button></div>
                <strong className="cart-item-total">{multiplyEth(nft.price, quantity)} ETH</strong>
                <button className="remove-cart-item" type="button" aria-label={`Remover ${nft.name}`} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(nftId)}><Trash2 size={15} /></button>
              </article>)}
              <Link className="back-to-market" to="/" search={catalogSearch}><ArrowLeft size={13} /> Voltar ao mercado</Link>
            </div>

            <aside className="cart-summary" aria-label="Resumo do pedido">
              <h2>Resumo do pedido</h2>
              <form className="coupon-form" onSubmit={applyCoupon}>
                <label className="sr-only" htmlFor="cart-coupon">Código do cupom</label>
                <Input id="cart-coupon" className="coupon-input" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Código do cupom" />
                <Button type="submit" className="coupon-submit" disabled={quoteQuery.isFetching}>Aplicar</Button>
              </form>
              {quoteError && <p className="coupon-feedback error" role="alert">{quoteError}</p>}
              {quote?.coupon && <p className="coupon-feedback" role="status">Cupom {quote.coupon} aplicado: 10% de desconto <button type="button" aria-label="Remover cupom" onClick={() => { setAppliedCoupon(''); setCouponInput(''); localStorage.removeItem(couponStorageKey) }}><X size={12} /></button></p>}
              <div className="summary-lines"><div><span>Subtotal</span><strong>{formatEth(quote?.subtotal)}</strong></div><div><span>Desconto</span><strong>{quote?.discount && quote.discount !== '0.0' ? `− ${quote.discount} ETH` : '—'}</strong></div><div><span>Taxa de rede</span><strong>{formatEth(quote?.networkFee)}</strong></div></div>
              <div className="summary-total"><span>Total estimado</span><strong>{formatEth(quote?.total)}</strong></div>
              <p className="quote-note">O valor final será confirmado com a cotação atual antes do pagamento.</p>
              <Link className="checkout-button checkout-link" to="/checkout" search={catalogSearch}>Continuar para pagamento</Link>
            </aside>
          </div>
        )}
      </section>
    </CartCheckoutModal>
  )
}
