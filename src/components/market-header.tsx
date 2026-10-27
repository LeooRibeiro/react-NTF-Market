import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import type { CatalogQuery } from '../features/catalog/catalog-api'

type MarketHeaderProps = {
  search: CatalogQuery
  active?: 'home' | 'market'
  cartCount?: number
  onSearch?: () => void
  accountAction: ReactNode
}

/** Compartilha o menu responsivo entre mercado, detalhe e confirmação do pedido. */
export function MarketHeader({ search, active, cartCount, onSearch, accountAction }: MarketHeaderProps) {
  const navLink = (tab: 'home' | 'market', label: string, href: string) => (
    <a className={`flex items-center border-b-2 px-0.5 pt-0.5 transition-colors hover:border-primary hover:text-market-accent ${active === tab ? 'border-primary text-market-accent' : 'border-transparent'}`} href={href}>{label}</a>
  )

  return <header className="grid h-18 market-header-grid items-center border-b border-market-surface max-tablet:h-14 ">
    <Link className="text-3xl font-bold tracking-widest max-tablet:text-mb" to="/" search={search} aria-label="Kurio, página inicial">KURIO</Link>
    <nav className="flex h-full items-stretch justify-self-center gap-6 text-mb text-foreground max-tablet:hidden" aria-label="Navegação principal">
      {navLink('home', 'Início', '/#home')}{navLink('market', 'Mercado', '/#catalog')}<a className="flex items-center border-b-2 border-transparent px-0.5 pt-0.5 hover:border-primary hover:text-market-accent" href="/#creators">Criadores</a><a className="flex items-center border-b-2 border-transparent px-0.5 pt-0.5 hover:border-primary hover:text-market-accent" href="/#learn">Aprenda</a>
    </nav>
    <div className="flex items-center justify-end gap-4.5 max-tablet:col-start-2 max-tablet:row-start-1 max-tablet:gap-3 max-small:gap-2">
      {onSearch && <button className="relative grid place-items-center border-0 bg-transparent p-1" type="button" onClick={onSearch} aria-label="Buscar NFTs"><Search size={22} /></button>}
      <Link className="relative grid place-items-center border-0 bg-transparent p-1" to="/cart" search={search} aria-label={`Carrinho${cartCount === undefined ? '' : `, ${cartCount} itens`}`}><ShoppingCart size={22} />{cartCount !== undefined && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary text-xs text-black font-bold">{cartCount}</span>}</Link>
      {accountAction}
    </div>
  </header>
}
