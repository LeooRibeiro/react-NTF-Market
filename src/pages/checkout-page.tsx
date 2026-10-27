import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCart, getCartQuote } from '../features/cart/cart-api'
import { getSession, loginAccount } from '../features/auth/auth-api'
import { createOrder, getWallets, type CreateOrderInput } from '../features/orders/orders-api'

const catalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

/** Protege o pagamento pela sessão, carrega carteira/cotação e submete o snapshot do carrinho. */
export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: getSession })
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart })
  const coupon = localStorage.getItem('kurio-cart-coupon-v1') ?? ''
  const walletQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets, enabled: Boolean(session.data) })
  const quoteQuery = useQuery({ queryKey: ['cart-quote', cartQuery.data?.items.map(({ nftId, quantity }) => [nftId, quantity]), coupon], queryFn: () => getCartQuote(coupon), enabled: Boolean(cartQuery.data) })
  const [walletId, setWalletId] = useState('')
  const [scenario, setScenario] = useState<'confirmed' | 'declined'>('confirmed')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('demo@kurio.art')
  const [password, setPassword] = useState('KurioPass123')
  const login = useMutation({ mutationFn: loginAccount, onSuccess: async (user) => { await queryClient.setQueryData(['session'], user); setError('') } })
  const order = useMutation({
    mutationFn: async () => {
      const collector = session.data
      const cart = cartQuery.data
      if (!collector || !cart?.items.length) throw new Error('Sua sessão ou carrinho mudou. Atualize a página.')
      const keyStorage = 'kurio-order-attempt-v1'
      let key = sessionStorage.getItem(keyStorage)
      if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(keyStorage, key) }
      const payload: CreateOrderInput = {
        collector: { name: collector.username, email: collector.email }, walletId: walletId || walletQuery.data?.find((wallet) => wallet.primary)?.id || '',
        network: walletQuery.data?.find((wallet) => wallet.id === walletId)?.network ?? '', coupon,
        cartItems: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })), scenario,
      }
      return createOrder(payload, key)
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      sessionStorage.removeItem('kurio-order-attempt-v1')
      await navigate({ to: '/orders/$orderId', params: { orderId: result.id } })
    },
    onError: (cause) => setError(isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message ?? 'Não foi possível enviar o pedido.' : cause.message),
  })
  const wallets = walletQuery.data ?? []
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId) ?? wallets.find((wallet) => wallet.primary)

  return <main className="market-shell cart-page">
    <header className="topbar"><Link className="brand" to="/" search={catalogSearch}>KURIO</Link><nav className="desktop-nav" aria-label="Navegação principal"><Link to="/" search={catalogSearch}>Início</Link><Link to="/" search={catalogSearch}>Mercado</Link></nav><div className="header-actions"><Link className="login-button" to="/cart">Voltar ao carrinho</Link></div></header>
    <section className="cart-content checkout-content"><div className="cart-heading"><div><p className="eyebrow">FINALIZE SUA COMPRA</p><h1>Pagamento</h1><p>Confira os dados antes de enviar o pedido.</p></div><Link to="/cart"><ArrowLeft size={14} /> Carrinho</Link></div>
      {session.isLoading || cartQuery.isLoading ? <div className="cart-loading" aria-label="Carregando pagamento"><div /></div> : !session.data ? <form className="checkout-panel checkout-login" onSubmit={(event) => { event.preventDefault(); login.mutate({ email, password }) }}><LockKeyhole size={22} /><h2>Entre para continuar</h2><p>Seu carrinho será preservado ao entrar.</p><label>E-mail<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{(error || login.error) && <p className="checkout-error" role="alert">{error || 'E-mail ou senha incorretos.'}</p>}<Button className="checkout-submit" disabled={login.isPending}>{login.isPending ? 'Entrando…' : 'Entrar e continuar'}</Button></form> : !cartQuery.data?.items.length ? <div className="cart-empty"><strong>Seu carrinho está vazio.</strong><Link className="primary-button" to="/" search={catalogSearch}>Explorar o mercado</Link></div> : <div className="checkout-layout">
        <section className="checkout-panel"><h2>Dados do colecionador</h2><p>{session.data.username}<br /><span>{session.data.email}</span></p><h2>Carteira e rede</h2><div className="wallet-options">{wallets.map((wallet) => <label className={selectedWallet?.id === wallet.id ? 'wallet-option selected' : 'wallet-option'} key={wallet.id}><input type="radio" name="wallet" value={wallet.id} checked={selectedWallet?.id === wallet.id} onChange={() => setWalletId(wallet.id)} /><span><strong>{wallet.name}</strong><small>{wallet.address} · {wallet.network}{wallet.primary ? ' · Principal' : ''}</small></span></label>)}</div><p className="wallet-note">Conexão de carteira simulada para este desafio.</p><h2>Simulação de pagamento</h2><label className="scenario-option"><input type="radio" checked={scenario === 'confirmed'} onChange={() => setScenario('confirmed')} /> Confirmar pagamento</label><label className="scenario-option"><input type="radio" checked={scenario === 'declined'} onChange={() => setScenario('declined')} /> Recusar pagamento</label></section>
        <aside className="checkout-panel checkout-review"><h2>Revisão do pedido</h2>{cartQuery.data.items.map(({ nft, nftId, quantity }) => <div className="checkout-line" key={nftId}><span>{nft.name} × {quantity}</span><strong>{nft.price} ETH</strong></div>)}<div className="summary-lines"><div><span>Subtotal</span><strong>{quoteQuery.data?.subtotal ?? '—'} ETH</strong></div>{quoteQuery.data?.coupon && <div><span>Desconto</span><strong>− {quoteQuery.data.discount} ETH</strong></div>}<div><span>Taxa de rede</span><strong>{quoteQuery.data?.networkFee ?? '—'} ETH</strong></div></div><div className="summary-total"><span>Total</span><strong>{quoteQuery.data?.total ?? '—'} ETH</strong></div>{quoteQuery.error && <p className="checkout-error" role="alert">Cupom ou cotação inválidos. Revise o carrinho.</p>}{error && <p className="checkout-error" role="alert">{error}</p>}<Button className="checkout-submit" disabled={!selectedWallet || order.isPending || quoteQuery.isLoading || quoteQuery.isError} onClick={() => { setError(''); order.mutate() }}>{order.isPending ? 'Enviando pedido…' : 'Confirmar pedido'}</Button><p className="quote-note">Preço, disponibilidade e taxa serão validados ao confirmar.</p></aside>
      </div>}
    </section><footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer>
  </main>
}
