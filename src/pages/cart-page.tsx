import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartCheckoutModal } from '../components/cart-checkout-modal'
import { getCart, getCartQuote, multiplyEth, removeCartItem, updateCartItem } from '../features/cart/cart-api'
import { usePriceNotices } from '../features/realtime/price-notices'
import { getIdentityStorageKey } from '../lib/session-storage'

const couponStorageKey = () => getIdentityStorageKey('kurio-cart-coupon-v1')

/** Formata o total decimal retornado pela API e mostra zero enquanto a cotação carrega. */
function formatEth(value: string | undefined) {
  const amount = value ?? '0.0'
  return `${amount} ETH`
}

/** Mantém quantidades, remoção, cupom e resumo do carrinho sincronizados com a API. */
export function CartPage() {
  const rawSearch = useSearch({ strict: false })
  const catalogSearch = { q: rawSearch.q ?? '', category: rawSearch.category ?? 'Todas', sort: rawSearch.sort ?? 'recent', page: rawSearch.page ?? 1, minPrice: rawSearch.minPrice ?? 0, maxPrice: rawSearch.maxPrice ?? 12.3, network: rawSearch.network ?? 'Todas' }
  const queryClient = useQueryClient()
  const { notices, clearNotices } = usePriceNotices()
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(() => localStorage.getItem(couponStorageKey()) ?? '')
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
  const cartMutationError = updateMutation.error || removeMutation.error

  /** Submete o código digitado e persiste a escolha para manter o cupom no checkout. */
  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const coupon = couponInput.trim()
    setAppliedCoupon(coupon)
    localStorage.setItem(couponStorageKey(), coupon)
  }

  const cart = cartQuery.data
  const quote = quoteQuery.data
  const hasUnavailableItems = Boolean(cart?.items.some(({ nft }) => nft.available === false))

  return (
    <CartCheckoutModal title="Carrinho">
      <section id="cart-main" className="cart-content px-0 pb-3 pt-4">
        <div className="cart-heading mb-4 flex items-end justify-between gap-5 max-tablet:mb-5 max-tablet:items-start max-tablet:flex-col max-tablet:gap-3"><div><p className="eyebrow mb-1.5 text-xs text-market-accent">SUA COLEÇÃO</p><h1 className="m-0 text-2xl font-bold">Carrinho</h1><p className="mt-1.5 text-xs text-market-copy" role="status" aria-live="polite" aria-atomic="true">{cartQuery.isLoading ? 'Carregando seus itens…' : `${cart?.totalItems ?? 0} itens selecionados`}</p></div><Link className="inline-flex items-center gap-1.5 text-xs text-market-accent" to="/" search={catalogSearch}><ArrowLeft size={14} /> Continuar explorando</Link></div>

        {notices.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded border border-market-accent bg-market-surface p-3 text-xs text-foreground" role="alert">
            <div>
              <strong className="text-market-accent">Atualização em tempo real:</strong>{' '}
              {notices.map((notice) => notice.availableChanged
                ? `${notice.nftName}: edição ${notice.available ? 'disponível novamente' : 'esgotada'}`
                : `Preço de ${notice.nftName} atualizado de ${notice.oldPrice} para ${notice.newPrice} ETH`).join('. ')}. O resumo foi recalculado.
            </div>
            <Button size="sm" variant="outline" className="h-6 text-2xs border-border hover:border-primary shrink-0" onClick={clearNotices}>
              Entendi
            </Button>
          </div>
        )}

        {cartMutationError && <p className="mb-3 rounded border border-market-danger/40 bg-market-danger/10 p-2.5 text-xs text-market-danger" role="alert">Não foi possível atualizar o carrinho. Seus itens permanecem disponíveis; tente novamente.</p>}

        {cartQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4" aria-label="Carregando carrinho">
            <div className="space-y-3 md:col-span-2">
              <div className="skeleton-shimmer h-20 w-full rounded" />
              <div className="skeleton-shimmer h-20 w-full rounded" />
            </div>
            <div className="skeleton-shimmer h-56 rounded md:col-span-1" />
          </div>
        ) : cartQuery.isError ? <div className="cart-empty"><strong>Não foi possível carregar o carrinho.</strong><Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button></div> : !cart?.items.length ? <div className="cart-empty"><span><ShoppingBag size={24} /></span><strong>Seu carrinho está vazio.</strong><p>Encontre uma peça única para começar sua coleção.</p><Link className="primary-button" to="/" search={catalogSearch}>Explorar o mercado</Link></div> : (
          <div className="cart-layout grid cart-layout-grid items-start gap-7 max-tablet:grid-cols-1 max-tablet:gap-5">
            <div className="cart-items min-w-0 border-t border-border" aria-label="Itens no carrinho">
              {cart.items.map(({ nft, nftId, quantity }) => <article className="cart-item grid cart-item-grid items-center gap-3.5 border-b border-border py-3.5  max-tablet:gap-2 max-tablet:py-3" key={nftId}>
                <Link className="cart-item-image size-20 overflow-hidden rounded bg-market-surface p-0.5 max-tablet:size-16" to="/nft/$nftId" params={{ nftId }} search={catalogSearch}><img className="size-full rounded-sm object-cover" src={nft.id === 'neon-vessel-552' ? '/assets/hero-vessel.png' : nft.image} alt={`${nft.name}, arte digital`} /></Link>
                <div className="cart-item-info flex min-w-0 flex-col gap-1"><span className="text-xs uppercase text-market-ink-muted">{nft.category}</span><Link className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-foreground" to="/nft/$nftId" params={{ nftId }} search={catalogSearch}>{nft.name}</Link><small className="text-xs text-market-ink-muted">Criado por {nft.artist}</small>{nft.available === false && <strong className="text-xs text-market-danger">Edição esgotada</strong>}<div className="cart-mobile-price hidden text-xs text-market-accent max-tablet:block">{nft.price} ETH</div></div>
                <div className="cart-quantity flex items-center gap-2 max-tablet:gap-1.5"><button className="grid size-6 place-items-center rounded border border-border bg-market-surface text-market-ink-muted disabled:cursor-not-allowed disabled:opacity-40 max-tablet:size-5" type="button" aria-label={`Diminuir ${nft.name}`} disabled={quantity <= 1 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId, quantity: quantity - 1 })}><Minus size={13} /></button><span className="min-w-2.5 text-center text-xs" aria-live="polite">{quantity}</span><button className="grid size-6 place-items-center rounded border border-border bg-market-surface text-market-ink-muted disabled:cursor-not-allowed disabled:opacity-40 max-tablet:size-5" type="button" aria-label={`Aumentar ${nft.name}`} disabled={nft.available === false || quantity >= 5 || updateMutation.isPending} onClick={() => updateMutation.mutate({ nftId, quantity: quantity + 1 })}><Plus size={13} /></button></div>
                <strong className="cart-item-total text-right text-xs text-market-accent max-tablet:hidden">{multiplyEth(nft.price, quantity)} ETH</strong>
                <button className="remove-cart-item grid size-6 place-items-center rounded-sm bg-transparent text-market-ink-muted hover:text-market-danger disabled:opacity-45" type="button" aria-label={`Remover ${nft.name}`} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(nftId)}><Trash2 size={15} /></button>
              </article>)}
              <Link className="back-to-market" to="/" search={catalogSearch}><ArrowLeft size={13} /> Voltar ao mercado</Link>
            </div>

            <aside className="cart-summary rounded border border-border bg-market-surface p-4 max-tablet:p-3.5" aria-label="Resumo do pedido">
              <h2 className="mb-3.5 mt-0 text-sm font-bold">Resumo do pedido</h2>
              <form className="coupon-form grid  gap-1.5" onSubmit={applyCoupon}>
                <label className="sr-only" htmlFor="cart-coupon">Código do cupom</label>
                <Input id="cart-coupon" className="coupon-input" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Código do cupom" aria-invalid={quoteError ? true : undefined} aria-describedby={quoteError ? 'cart-coupon-error' : undefined} />
                <Button type="submit" className="coupon-submit" disabled={quoteQuery.isFetching}>Aplicar</Button>
              </form>
              {quoteError && <p id="cart-coupon-error" className="coupon-feedback error" role="alert">{quoteError}</p>}
              {quote?.coupon && <p className="coupon-feedback" role="status">Cupom {quote.coupon} aplicado: 10% de desconto <button type="button" aria-label="Remover cupom" onClick={() => { setAppliedCoupon(''); setCouponInput(''); localStorage.removeItem(couponStorageKey()) }}><X size={12} /></button></p>}
              <div className="summary-lines mt-5 grid gap-2.5 text-xs text-market-ink-muted"><div className="flex items-center justify-between gap-3"><span>Subtotal</span><strong className="text-xs font-medium text-foreground">{formatEth(quote?.subtotal)}</strong></div><div className="flex items-center justify-between gap-3"><span>Desconto</span><strong className="text-xs font-medium text-foreground">{quote?.discount && quote.discount !== '0.0' ? `− ${quote.discount} ETH` : '—'}</strong></div><div className="flex items-center justify-between gap-3"><span>Taxa de rede</span><strong className="text-xs font-medium text-foreground">{formatEth(quote?.networkFee)}</strong></div></div>
              <div className="summary-total mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 text-foreground" aria-live="polite" aria-atomic="true"><span>Total estimado</span><strong className="text-base text-market-accent">{formatEth(quote?.total)}</strong></div>
              <p className="quote-note mb-3.5 mt-3 text-xs leading-7 text-market-dim">O valor final será confirmado com a cotação atual antes do pagamento.</p>
              {hasUnavailableItems && <p className="mb-3 text-xs text-market-danger" role="alert">Remova as edições esgotadas para continuar.</p>}
              {hasUnavailableItems
                ? <Button className="checkout-button grid h-9 w-full place-items-center rounded bg-primary text-xs font-bold text-market-deep opacity-50" disabled>Continuar para pagamento</Button>
                : <Link className="checkout-button checkout-link grid h-9 w-full place-items-center rounded bg-primary text-xs font-bold text-market-deep" to="/checkout" search={catalogSearch}>Continuar para pagamento</Link>}
            </aside>
          </div>
        )}
      </section>
    </CartCheckoutModal>
  )
}
