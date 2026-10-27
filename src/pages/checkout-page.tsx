import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartCheckoutModal } from '../components/cart-checkout-modal'
import { getCart, getCartQuote } from '../features/cart/cart-api'
import { getSession, loginAccount } from '../features/auth/auth-api'
import { createOrder, getWallets, type CreateOrderInput } from '../features/orders/orders-api'
import { usePriceNotices } from '../features/realtime/price-notices'

/** Protege o pagamento pela sessão, carrega carteira/cotação e submete o snapshot do carrinho. */
export function CheckoutPage() {
  const rawSearch = useSearch({ strict: false })
  const catalogSearch = { q: rawSearch.q ?? '', category: rawSearch.category ?? 'Todas', sort: rawSearch.sort ?? 'recent', page: rawSearch.page ?? 1, minPrice: rawSearch.minPrice ?? 0, maxPrice: rawSearch.maxPrice ?? 12.3, network: rawSearch.network ?? 'Todas' }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: getSession })
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart })
  const coupon = localStorage.getItem('kurio-cart-coupon-v1') ?? ''
  const walletQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets, enabled: Boolean(session.data) })
  const quoteQuery = useQuery({ queryKey: ['cart-quote', cartQuery.data?.items.map(({ nftId, quantity }) => [nftId, quantity]), coupon], queryFn: () => getCartQuote(coupon), enabled: Boolean(cartQuery.data) })
  const { notices, clearNotices } = usePriceNotices()
  const [acknowledgedNoticeAt, setAcknowledgedNoticeAt] = useState(0)
  const latestNoticeAt = notices.reduce((latest, notice) => Math.max(latest, notice.timestamp), 0)
  const hasUnacknowledgedPriceChange = notices.length > 0 && latestNoticeAt > acknowledgedNoticeAt

  const [walletId, setWalletId] = useState(() => sessionStorage.getItem('kurio-checkout-wallet-v1') ?? '')
  const [scenario, setScenario] = useState<'confirmed' | 'declined' | 'pending' | 'timeout'>(() => {
    const savedScenario = sessionStorage.getItem('kurio-payment-scenario-v1')
    return savedScenario === 'declined' || savedScenario === 'pending' || savedScenario === 'timeout'
      ? savedScenario
      : 'confirmed'
  })
  const [walletConnection, setWalletConnection] = useState<'disconnected' | 'connected' | 'rejected'>(() =>
    sessionStorage.getItem('kurio-wallet-connected-v1') === 'true' ? 'connected' : 'disconnected',
  )
  const [error, setError] = useState('')
  const [email, setEmail] = useState('demo@kurio.art')
  const [password, setPassword] = useState('KurioPass123')
  const login = useMutation({ mutationFn: loginAccount, onSuccess: async (user) => { await queryClient.setQueryData(['session'], user); setError('') } })
  const wallets = walletQuery.data ?? []
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId) ?? wallets.find((wallet) => wallet.primary)
  const order = useMutation({
    mutationFn: async () => {
      const collector = session.data
      const cart = cartQuery.data
      if (!collector || !cart?.items.length) throw new Error('Sua sessão ou carrinho mudou. Atualize a página.')
      const payload: CreateOrderInput = {
        collector: { name: collector.username, email: collector.email }, walletId: walletId || walletQuery.data?.find((wallet) => wallet.primary)?.id || '',
        network: selectedWallet?.network ?? '', walletConnected: walletConnection === 'connected', coupon,
        cartItems: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })), scenario,
      }
      const keyStorage = 'kurio-order-attempt-v1'
      const attemptFingerprint = JSON.stringify(payload)
      let savedAttempt: { key: string; fingerprint: string } | null = null
      try {
        savedAttempt = JSON.parse(sessionStorage.getItem(keyStorage) ?? 'null') as typeof savedAttempt
      } catch {
        savedAttempt = null
      }
      const key = savedAttempt?.fingerprint === attemptFingerprint ? savedAttempt.key : crypto.randomUUID()
      sessionStorage.setItem(keyStorage, JSON.stringify({ key, fingerprint: attemptFingerprint }))
      return createOrder(payload, key)
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      sessionStorage.removeItem('kurio-order-attempt-v1')
      sessionStorage.removeItem('kurio-payment-scenario-v1')
      clearNotices()
      await navigate({ to: '/orders/$orderId', params: { orderId: result.id }, search: catalogSearch })
    },
    onError: (cause) => {
      if (scenario === 'timeout' && isAxiosError(cause) && !cause.response) {
        setError('A resposta expirou. Tente novamente para recuperar o mesmo pedido sem duplicar a compra.')
        return
      }
      setError(isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message ?? 'Não foi possível enviar o pedido.' : cause.message)
    },
  })
  const hasUnavailableItems = Boolean(cartQuery.data?.items.some(({ nft }) => nft.available === false))

  function chooseScenario(nextScenario: 'confirmed' | 'declined' | 'pending' | 'timeout') {
    setScenario(nextScenario)
    sessionStorage.setItem('kurio-payment-scenario-v1', nextScenario)
  }

  function selectWallet(nextWalletId: string) {
    setWalletId(nextWalletId)
    sessionStorage.setItem('kurio-checkout-wallet-v1', nextWalletId)
    sessionStorage.removeItem('kurio-wallet-connected-v1')
    setWalletConnection('disconnected')
  }

  function connectWallet() {
    setWalletConnection('connected')
    sessionStorage.setItem('kurio-wallet-connected-v1', 'true')
  }

  function disconnectWallet() {
    setWalletConnection('disconnected')
    sessionStorage.removeItem('kurio-wallet-connected-v1')
  }

  return <CartCheckoutModal title="Pagamento">
    <section className="cart-content checkout-content max-w-6xl px-0 pb-3 pt-4"><div className="cart-heading mb-4 flex items-end justify-between gap-5 max-tablet:mb-5 max-tablet:items-start max-tablet:flex-col max-tablet:gap-3"><div><p className="eyebrow mb-1.5 text-xs text-market-accent">FINALIZE SUA COMPRA</p><h1 className="m-0 text-2xl font-bold">Pagamento</h1><p className="mt-1.5 text-xs text-market-copy">Confira os dados antes de enviar o pedido.</p></div><Link className="inline-flex items-center gap-1.5 text-xs text-market-accent" to="/cart" search={catalogSearch}><ArrowLeft size={14} /> Carrinho</Link></div>

      {hasUnacknowledgedPriceChange && (
        <div className="mb-4 rounded border border-market-accent bg-market-surface p-3.5 text-xs text-foreground" role="alert">
          <strong className="text-market-accent">Atualização durante a compra:</strong>{' '}
          {notices.map((notice) => notice.availableChanged
            ? `${notice.nftName}: edição ${notice.available ? 'disponível novamente' : 'esgotada'}`
            : `${notice.nftName}: preço alterado de ${notice.oldPrice} para ${notice.newPrice} ETH`).join('. ')}. A cotação foi recalculada; confirme a atualização para continuar.
          <div className="mt-2.5">
            <Button size="sm" className="h-7 text-xs bg-primary text-market-deep font-bold hover:bg-primary" onClick={() => setAcknowledgedNoticeAt(latestNoticeAt)}>
              Aceitar atualização ({quoteQuery.data?.total ?? '—'} ETH)
            </Button>
          </div>
        </div>
      )}

      {session.isLoading || cartQuery.isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6" aria-label="Carregando pagamento"><div className="skeleton-shimmer h-64 rounded" /><div className="skeleton-shimmer h-64 rounded" /></div> : !session.data ? <form className="checkout-panel checkout-login mx-auto my-5 w-full max-w-md border border-border rounded bg-market-surface p-5" onSubmit={(event) => { event.preventDefault(); login.mutate({ email, password }) }}><LockKeyhole className="text-market-accent" size={22} /><h2>Entre para continuar</h2><p>Seu carrinho será preservado ao entrar.</p><label>E-mail<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{(error || login.error) && <p className="checkout-error text-market-danger" role="alert">{error || 'E-mail ou senha incorretos.'}</p>}<Button className="checkout-submit mt-3 min-h-9 w-full bg-primary text-xs font-bold text-market-deep disabled:opacity-60" disabled={login.isPending}>{login.isPending ? 'Entrando…' : 'Entrar e continuar'}</Button></form> : !cartQuery.data?.items.length ? <div className="cart-empty"><strong>Seu carrinho está vazio.</strong><Link className="primary-button" to="/" search={catalogSearch}>Explorar o mercado</Link></div> : <div className="checkout-layout grid checkout-layout-grid items-start gap-5 max-tablet:grid-cols-1">
        <section className="checkout-panel rounded border border-border bg-market-surface p-5"><h2>Dados do colecionador</h2><p>{session.data.username}<br /><span>{session.data.email}</span></p><h2>Carteira e rede</h2><div className="wallet-options grid gap-2">{wallets.map((wallet) => <label className={`wallet-option flex cursor-pointer items-center gap-2.5 rounded border border-border p-2.5 ${selectedWallet?.id === wallet.id ? 'selected border-primary bg-market-surface' : ''}`} key={wallet.id}><input className="accent-primary" type="radio" name="wallet" value={wallet.id} checked={selectedWallet?.id === wallet.id} onChange={() => selectWallet(wallet.id)} /><span className="grid gap-1"><strong className="text-xs">{wallet.name}</strong><small className="text-xs text-market-ink-muted">{wallet.address} · {wallet.network}{wallet.primary ? ' · Principal' : ''}</small></span></label>)}</div><p className="wallet-note mb-2 text-xs text-market-dim" role="status">{walletConnection === 'connected' ? `Conectado a ${selectedWallet?.name}.` : walletConnection === 'rejected' ? 'A conexão foi recusada. Você pode tentar novamente.' : 'Carteira desconectada.'}</p><div className="mb-5 flex flex-wrap gap-2"><Button type="button" size="sm" className="h-7 text-xs" disabled={!selectedWallet || walletConnection === 'connected'} onClick={connectWallet}>Conectar carteira</Button>{walletConnection === 'connected' ? <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={disconnectWallet}>Desconectar</Button> : <Button type="button" size="sm" variant="outline" className="h-7 text-xs" disabled={!selectedWallet} onClick={() => setWalletConnection('rejected')}>Recusar conexão</Button>}</div><h2>Simulação de pagamento</h2><div className="grid gap-2 sm:grid-cols-2"><label className="scenario-option mt-1 inline-flex items-center gap-1.5 text-xs text-market-ink-muted"><input type="radio" name="payment-scenario" checked={scenario === 'confirmed'} onChange={() => chooseScenario('confirmed')} /> Confirmar pagamento</label><label className="scenario-option mt-1 inline-flex items-center gap-1.5 text-xs text-market-ink-muted"><input type="radio" name="payment-scenario" checked={scenario === 'declined'} onChange={() => chooseScenario('declined')} /> Recusar pagamento</label><label className="scenario-option mt-1 inline-flex items-center gap-1.5 text-xs text-market-ink-muted"><input type="radio" name="payment-scenario" checked={scenario === 'pending'} onChange={() => chooseScenario('pending')} /> Manter pedido pendente</label><label className="scenario-option mt-1 inline-flex items-center gap-1.5 text-xs text-market-ink-muted"><input type="radio" name="payment-scenario" checked={scenario === 'timeout'} onChange={() => chooseScenario('timeout')} /> Simular timeout</label></div></section>
        <aside className="checkout-panel checkout-review sticky top-5 rounded border border-border bg-market-surface p-5 max-tablet:static"><h2>Revisão do pedido</h2>{cartQuery.data.items.map(({ nft, nftId, quantity }) => <div className="checkout-line flex justify-between gap-3 border-b border-border py-2.5 text-xs text-market-ink-muted" key={nftId}><span>{nft.name} × {quantity}{nft.available === false && <strong className="ml-2 text-market-danger">Esgotado</strong>}</span><strong className="whitespace-nowrap text-market-accent">{nft.price} ETH</strong></div>)}<div className="summary-lines mt-3 grid gap-2.5 text-xs text-market-ink-muted"><div className="flex justify-between gap-3"><span>Subtotal</span><strong className="font-medium text-foreground">{quoteQuery.data?.subtotal ?? '—'} ETH</strong></div>{quoteQuery.data?.coupon && <div className="flex justify-between gap-3"><span>Desconto</span><strong className="font-medium text-foreground">− {quoteQuery.data.discount} ETH</strong></div>}<div className="flex justify-between gap-3"><span>Taxa de rede</span><strong className="font-medium text-foreground">{quoteQuery.data?.networkFee ?? '—'} ETH</strong></div></div><div className="summary-total mt-4 flex justify-between gap-3 border-t border-border pt-3.5"><span>Total</span><strong className="text-base text-market-accent">{quoteQuery.data?.total ?? '—'} ETH</strong></div>{quoteQuery.error && <p className="checkout-error text-market-danger" role="alert">{hasUnavailableItems ? 'Há edições esgotadas no pedido. Volte ao carrinho e remova esses itens.' : 'Cupom ou cotação inválidos. Revise o carrinho.'}</p>}{error && <p className="checkout-error text-market-danger" role="alert">{error}</p>}<Button className="checkout-submit mt-3 min-h-9 w-full bg-primary text-xs font-bold text-market-deep disabled:opacity-60" disabled={!selectedWallet || walletConnection !== 'connected' || hasUnavailableItems || order.isPending || quoteQuery.isLoading || quoteQuery.isError || hasUnacknowledgedPriceChange} onClick={() => { setError(''); order.mutate() }}>{order.isPending ? 'Enviando pedido…' : scenario === 'timeout' ? order.isError ? 'Recuperar tentativa' : 'Enviar e simular timeout' : walletConnection !== 'connected' ? 'Conecte sua carteira para continuar' : hasUnacknowledgedPriceChange ? 'Confirme a nova cotação acima' : 'Confirmar pedido'}</Button><p className="quote-note mb-3.5 mt-3 text-xs leading-7 text-market-dim">Preço, disponibilidade e taxa serão validados ao confirmar.</p></aside>
      </div>}
    </section>
  </CartCheckoutModal>
}
