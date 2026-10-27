import { Link, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { getOrder } from '../features/orders/orders-api'
import { MarketHeader } from '../components/market-header'
import { marketShellClass } from '../lib/marketplace-styles'

const catalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

/** Busca o estado persistido e apresenta recibo para compra confirmada, pendente ou recusada. */
export function OrderPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const query = useQuery({ queryKey: ['order', orderId], queryFn: () => getOrder(orderId), refetchInterval: (state) => state.state.data?.status === 'pending' ? 2500 : false })
  if (query.isLoading) return <main className={`${marketShellClass} flex min-h-detail-state flex-col items-start justify-center`}><p>Carregando pedido…</p></main>
  if (query.isError || !query.data) return <main className={`${marketShellClass} flex min-h-detail-state flex-col items-start justify-center`}><h1>Não foi possível abrir este pedido.</h1><Link to="/cart" search={catalogSearch}>Voltar ao carrinho</Link></main>
  const order = query.data
  const confirmed = order.status === 'confirmed'
  const declined = order.status === 'declined'
  return <main className={`${marketShellClass} cart-page`}><MarketHeader search={catalogSearch} accountAction={<Link className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-xs font-bold text-market-deep" to="/" search={catalogSearch}>Continuar explorando</Link>} />
    <section className="order-content"><div className={`order-status ${confirmed ? 'confirmed' : declined ? 'declined' : ''}`}><span>{confirmed ? <CheckCircle2 size={28} /> : declined ? <XCircle size={28} /> : <Clock3 size={28} />}</span><p className="eyebrow">PEDIDO {order.number}</p><h1>{confirmed ? 'Compra confirmada' : declined ? 'Pagamento recusado' : 'Pagamento pendente'}</h1><p>{confirmed ? 'Sua nova peça já faz parte da sua coleção.' : declined ? 'O pagamento não foi concluído. Seus itens continuam no carrinho.' : 'Aguardando atualização do pagamento. Esta página será atualizada automaticamente.'}</p></div>
      <div className="order-receipt"><div><span>Status</span><strong>{order.status === 'confirmed' ? 'Confirmado' : order.status === 'declined' ? 'Recusado' : 'Pendente'}</strong></div><div><span>Colecionador</span><strong>{order.collector.name} · {order.collector.email}</strong></div><div><span>Carteira</span><strong>{order.wallet.address} · {order.network}</strong></div>{order.transactionId && <div><span>Transação simulada</span><strong className="transaction-id">{order.transactionId}</strong></div>}<div className="receipt-items"><span>Itens</span>{order.items.map(({ nft, quantity, lineTotal }) => <strong key={nft.id}>{nft.name} × {quantity}<small>{lineTotal} ETH</small></strong>)}</div><div><span>Subtotal</span><strong>{order.subtotal} ETH</strong></div><div><span>Desconto</span><strong>{order.discount} ETH</strong></div><div><span>Taxa de rede</span><strong>{order.networkFee} ETH</strong></div><div className="receipt-total"><span>Total do pedido</span><strong>{order.total} ETH</strong></div></div>
      <div className="order-actions">{confirmed ? <Link className="primary-button" to="/" search={catalogSearch}>Voltar ao mercado</Link> : <Link className="primary-button" to="/cart" search={catalogSearch}>Revisar carrinho</Link>}</div>
    </section><footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer></main>
}
