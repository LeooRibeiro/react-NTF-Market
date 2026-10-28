import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Clock3, MailCheck, X, XCircle } from 'lucide-react'
import { getOrder } from '../features/orders/orders-api'

const catalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

function shortTransactionId(transactionId: string | null) {
  return transactionId ? `${transactionId.slice(0, 6)}…${transactionId.slice(-4)}` : 'Aguardando confirmação'
}

/** Apresenta o estado do pagamento e o recibo imutável da compra. */
export function OrderPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const [copyMessage, setCopyMessage] = useState('')
  const query = useQuery({ queryKey: ['order', orderId], queryFn: () => getOrder(orderId), refetchInterval: (state) => state.state.data?.status === 'pending' ? 2500 : false })
  if (query.isLoading) return <main className="order-page"><p role="status">Carregando pedido…</p></main>
  if (query.isError || !query.data) return <main className="order-page"><section className="order-receipt-card"><h1>Não foi possível abrir este pedido.</h1><Link className="receipt-button" to="/cart" search={catalogSearch}>Voltar ao carrinho</Link></section></main>

  const order = query.data
  const confirmed = order.status === 'confirmed'
  const declined = order.status === 'declined'
  const displayDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(order.createdAt)

  async function copyTransactionId() {
    if (!order.transactionId) return
    try {
      await navigator.clipboard.writeText(order.transactionId)
      setCopyMessage('ID da transação copiado.')
    } catch {
      setCopyMessage('Não foi possível copiar. Selecione o ID exibido nos detalhes.')
    }
  }

  return (
    <main className="order-page">
      <article className="order-receipt-card" aria-labelledby="receipt-title">
        <Link className="receipt-close" to="/" search={catalogSearch} aria-label="Voltar ao mercado"><X size={18} /></Link>
        <header className="receipt-intro" role="status" aria-live="polite" aria-atomic="true">
          <span className={`receipt-icon ${confirmed ? 'is-confirmed' : declined ? 'is-declined' : ''}`} aria-hidden="true">
            {confirmed ? <MailCheck size={44} strokeWidth={1.5} /> : declined ? <XCircle size={44} strokeWidth={1.5} /> : <Clock3 size={44} strokeWidth={1.5} />}
          </span>
          <h1 id="receipt-title">{confirmed ? 'Seus NFTs agora estão na sua carteira' : declined ? 'O pagamento não foi concluído' : 'Pagamento pendente'}</h1>
          <p>{confirmed ? 'Compra confirmada na simulação.' : declined ? 'Seus itens continuam no carrinho.' : 'Aguardando atualização do pagamento.'}</p>
        </header>

        <dl className="receipt-summary">
          <div><dt>ID da transação</dt><dd title={order.transactionId ?? undefined}>{shortTransactionId(order.transactionId)}</dd></div>
          <div><dt>Data</dt><dd>{displayDate}</dd></div>
          <div><dt>Total</dt><dd>{order.total} ETH</dd></div>
          <div><dt>Carteira</dt><dd>{order.wallet.name}</dd></div>
        </dl>

        <section className="receipt-details" aria-labelledby="receipt-details-title">
          <h2 id="receipt-details-title">Detalhes da transação</h2>
          <table className="receipt-items-table">
            <caption className="sr-only">NFTs comprados, quantidade de edições e subtotal de cada item</caption>
            <thead><tr><th scope="col">NFTs</th><th scope="col">Edições</th><th scope="col">Subtotal</th></tr></thead>
            <tbody>
              {order.items.map(({ nft, quantity, lineTotal }) => (
                <tr key={nft.id}>
                  <th scope="row"><span className="receipt-nft-cell"><img src={nft.image} alt={`${nft.name}, arte digital`} /><span className="receipt-nft-name"><strong>{nft.name}</strong><small>ID do token: #{nft.id.split('-').at(-1)?.replace(/^0/, '')}</small></span></span></th>
                  <td className="receipt-quantity">× {quantity}</td>
                  <td className="receipt-line-total">{lineTotal} ETH</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="receipt-totals">
            <div><dt>Subtotal</dt><dd>{order.subtotal} ETH</dd></div>
            {order.discount !== '0.0' && <div><dt>Desconto</dt><dd>− {order.discount} ETH</dd></div>}
            <div><dt>Taxa de rede</dt><dd>{order.networkFee} ETH</dd></div>
            <div className="receipt-grand-total"><dt>Total</dt><dd>{order.total} ETH</dd></div>
          </dl>

          <p className="receipt-note">{confirmed ? `Transação confirmada na ${order.network}. A propriedade foi transferida para sua carteira e registrada na rede.` : declined ? 'Revise o carrinho e tente novamente quando estiver pronto.' : 'Esta página será atualizada quando o pagamento mudar de estado.'}</p>
          {confirmed && order.transactionId && <button className="receipt-button" type="button" onClick={() => void copyTransactionId()}><CheckCircle2 size={16} /> Copiar ID da transação</button>}
          {copyMessage && <p className="receipt-copy-status" role="status">{copyMessage}</p>}
          {!confirmed && <Link className="receipt-button" to="/cart" search={catalogSearch}><ArrowLeft size={16} /> Revisar carrinho</Link>}
        </section>
        <div className="receipt-bottom-rule" aria-hidden="true" />
      </article>
    </main>
  )
}
