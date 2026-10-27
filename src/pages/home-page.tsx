import { useCallback, useEffect, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  Check, ChevronLeft, ChevronRight, Heart,
  LogIn, Search, ShoppingCart, SlidersHorizontal, X,
} from 'lucide-react'
import { getCatalog, type CatalogQuery, type CatalogResult, type Nft } from '../features/catalog/catalog-api'
import { addCartItem, getCart } from '../features/cart/cart-api'
import { useFavorites } from '../features/favorites/favorites-api'
import { getSession } from '../features/auth/auth-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { MarketHeader } from '../components/market-header'
import { marketShellClass } from '../lib/marketplace-styles'
import { AuthModal, type AuthMode } from '../components/auth-modal'
import { MarketplaceBelowSections } from '../components/marketplace-below-sections'

const categories = [
  ['Arte digital', 33], ['Fotografia', 12], ['Música', 65], ['Arte 3D', 39],
  ['Colecionáveis', 23], ['Generativa', 17], ['Jogos', 19], ['Assinaturas', 13], ['Utilidade', 18],
] as const
const networks = [['Ethereum', 119], ['Polygon', 78], ['Solana', 86]] as const
const defaultCatalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }


const spotlightItems = [
  { id: 'emerald-ape-042', name: 'Emerald Ape #042', price: '1.19', image: '/assets/emerald-ape.png', badge: 'EDIÇÃO LIMITADA' },
  { id: 'neon-vessel-552', name: 'Neon Vessel #552', price: '1.99', image: '/assets/neon-vessel.png', badge: 'OFERTA DA SEMANA' },
  { id: 'cosmic-bloom-118', name: 'Cosmic Bloom #118', price: '1.29', image: '/assets/cosmic-bloom.png', badge: 'ÚLTIMAS PEÇAS' },
]

/** Alterna uma oferta em destaque por tempo e direciona cada item ao próprio detalhe. */
function FeaturedDeal({ insideFilterSheet = false }: { insideFilterSheet?: boolean }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % spotlightItems.length), 12_000)
    return () => window.clearInterval(timer)
  }, [])
  const item = spotlightItems[index]!
  return <section className={`featured-deal mt-7.5 border-t border-border pt-3.5 ${insideFilterSheet ? 'max-tablet:block' : 'max-tablet:hidden'}`} aria-label="NFT em destaque">
    <div className="featured-deal-heading mb-2.5 flex items-center justify-between gap-1.5"><h2 className="m-0 text-mb font-bold">Oferta limitada</h2><span className="rounded-sm bg-border px-1 py-0.5 text-xs tracking-wider text-market-accent">AO VIVO</span></div>
    <Link className="featured-deal-art relative block aspect-card overflow-hidden rounded-md bg-market-surface" to="/nft/$nftId" params={{ nftId: item.id }} search={defaultCatalogSearch}><img className="size-full animate-deal-fade object-cover" src={item.image} alt={item.name} /><span className="absolute bottom-1.5 left-1.5 rounded-sm bg-primary px-1.5 py-1 text-xs font-bold text-market-deep">{item.badge}</span></Link>
    <Link className="featured-deal-title mt-2 block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-foreground" to="/nft/$nftId" params={{ nftId: item.id }} search={defaultCatalogSearch}>{item.name}</Link>
    <div className="featured-deal-price mt-1.5 flex items-center justify-between text-xs text-market-ink-muted"><span>Preço especial</span><strong className="text-xs text-market-accent">{item.price} ETH</strong></div>
    <div className="deal-progress mt-2.5 h-0.5 overflow-hidden bg-border"><span className="block size-full origin-left animate-deal-countdown bg-primary" key={item.id} /></div>
    <p className="mt-1.5 text-xs leading-5 text-market-dim">O destaque muda automaticamente a cada 12 segundos.</p>
  </section>
}

type FilterPanelProps = {
  category: string
  network: string
  priceRange: number[]
  onPriceRangeChange: (values: number[]) => void
  onSearchChange: (patch: Partial<CatalogQuery>) => void
}

/** Renderiza os filtros controlados do catálogo e encaminha alterações para a URL. */
function FilterPanel({ category, network, priceRange, onPriceRangeChange, onSearchChange }: FilterPanelProps) {
  const min = priceRange[0] ?? 0
  const max = priceRange[1] ?? 12.3
  return <>
    <div className="filter-group mb-7 last:mb-0"><h2 className="mb-2.5 text-mb font-bold">Coleções</h2><Button variant="ghost" className={`filter-row flex h-7 w-full items-center justify-between border-0 bg-transparent px-2 py-1.5 text-left text-xs text-market-ink-muted hover:bg-transparent hover:text-market-accent ${category === 'Todas' ? 'selected text-market-accent' : ''}`} onClick={() => onSearchChange({ category: 'Todas' })}>Todas <span className="text-market-ink-muted">(12)</span></Button>{categories.map(([name, count]) => <Button variant="ghost" key={name} className={`filter-row flex h-7 w-full items-center justify-between border-0 bg-transparent px-2 py-1.5 text-left text-xs text-market-ink-muted hover:bg-transparent hover:text-market-accent ${category === name ? 'selected text-market-accent' : ''}`} onClick={() => onSearchChange({ category: name })}>{name}<span className="text-market-ink-muted">({count})</span></Button>)}</div>
    <div className="filter-group price-group mb-7 last:mb-0"><h2 className="mb-2 text-xs font-bold">Faixa de preço</h2><Slider aria-label="Faixa de preço em ETH" className="price-slider my-1 h-4 w-full" min={0} max={12.3} step={0.01} value={priceRange} onValueChange={onPriceRangeChange} /><p className="my-2 text-xs text-market-ink-muted">Preço: {min.toFixed(2).replace('.', ',')} – {max.toFixed(2).replace('.', ',')} ETH</p><Button className="apply-button h-6 min-w-16 rounded bg-primary px-2 text-xs font-bold text-market-deep hover:bg-primary" onClick={() => onSearchChange({ minPrice: min, maxPrice: max })}>Aplicar</Button></div>
    <div className="filter-group network-group mb-7 last:mb-0 pt-px"><h2 className="mb-2.5 text-xs font-bold">Rede</h2>{networks.map(([name, count]) => <Button variant="ghost" key={name} className={`filter-row flex h-7 w-full items-center justify-between border-0 bg-transparent px-2 py-1.5 text-left text-xs text-market-ink-muted hover:bg-transparent hover:text-market-accent ${network === name ? 'selected text-market-accent' : ''}`} onClick={() => onSearchChange({ network: network === name ? 'Todas' : name })}>{name}<span className="text-market-ink-muted">({count})</span></Button>)}</div>
  </>
}

/** Apresenta uma peça do catálogo com imagem, criador, preço, favoritos e compra rápida. */
function ProductCard({ nft, index }: { nft: Nft; index: number }) {
  const queryClient = useQueryClient()
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const favorite = isFavorite(nft.id)
  const addCart = useMutation({
    mutationFn: () => addCartItem(nft.id, 1),
    onSuccess: (cart) => {
      void queryClient.setQueryData(['cart'], cart)
    },
  })

  return (
    <article className="nft-card min-w-0">
      <div className="nft-art-wrap group relative aspect-square w-full overflow-hidden bg-market-surface p-1.5">
        <Link className="nft-art-link absolute inset-1.5 block" to="/nft/$nftId" params={{ nftId: nft.id }} search={defaultCatalogSearch} aria-label={`Ver ${nft.name}`}><img className="nft-art block size-full rounded-xl object-cover" src={nft.image} alt={`${nft.name}, arte digital criada por ${nft.artist}`} loading={index > 2 ? 'lazy' : 'eager'} />{nft.rarity && <span className="rarity-tag absolute left-0 top-0 bg-primary px-2.5 py-1 text-xs font-bold text-market-page">{nft.rarity}</span>}</Link>
        <div className="nft-actions absolute bottom-1.5 right-1/2 z-10 flex translate-x-1/2 translate-y-1 gap-1 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100" aria-label={`Ações para ${nft.name}`}>
          <button className="grid size-7 place-items-center rounded-sm bg-market-surface/95 text-foreground hover:text-market-accent transition disabled:opacity-50" type="button" aria-label={`Adicionar ${nft.name} ao carrinho`} title={nft.available === false ? 'Edição esgotada' : 'Adicionar ao carrinho'} disabled={nft.available === false || addCart.isPending} onClick={() => addCart.mutate()}><ShoppingCart size={18} /></button>
          <button className={`grid size-7 place-items-center rounded-sm bg-market-surface/95 text-foreground hover:text-market-accent transition ${favorite ? 'text-market-accent' : ''}`} type="button" aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Adicionar ${nft.name} aos favoritos`} title="Favoritar" onClick={() => toggleFavorite(nft.id)}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button>
          <Link to="/nft/$nftId" params={{ nftId: nft.id }} search={defaultCatalogSearch} className="grid size-7 place-items-center rounded-sm bg-market-surface/95 text-foreground hover:text-market-accent transition" aria-label={`Ver detalhes de ${nft.name}`} title="Ver detalhes"><Search size={18} /></Link>
        </div>
      </div>
      <div className="nft-meta mt-1.5 flex justify-between gap-2 text-xs max-tablet:block"><Link className="nft-title overflow-hidden text-ellipsis whitespace-nowrap" to="/nft/$nftId" params={{ nftId: nft.id }} search={defaultCatalogSearch}>{nft.name}</Link><span className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-market-ink-muted md:mt-0 md:inline">{nft.artist} <span className="verified-dot inline-grid size-3 place-items-center rounded-full bg-primary align-middle text-market-deep" aria-label="Artista verificado"><Check size={9} /></span></span></div>
      <div className="nft-price mt-0.5 flex items-baseline gap-2 text-xs"><strong className="text-market-accent tracking-tight">{nft.price} ETH</strong>{nft.previousPrice && <del className="text-xs text-market-ink-muted">{nft.previousPrice} ETH</del>}{nft.available === false && <span className="text-market-danger">Esgotado</span>}</div>
    </article>
  )
}

/** Exibe o placeholder com shimmer effect enquanto a consulta do catálogo está carregando. */
function ProductSkeleton() {
  return (
    <div className="min-w-0" aria-hidden="true">
      <div className="skeleton-shimmer aspect-square w-full rounded-xl p-1.5" />
      <span className="skeleton-shimmer mt-2 block h-3 w-2/3 rounded" />
      <i className="skeleton-shimmer mt-1.5 block h-3 w-1/3 rounded not-italic" />
    </div>
  )
}

/** Coordena catálogo, filtros na URL, sessão do colecionador e abertura de autenticação. */
export function HomePage() {
  const navigate = useNavigate()
  const rawSearch = useSearch({ strict: false })
  const q = rawSearch.q ?? ''
  const category = rawSearch.category ?? 'Todas'
  const sort = rawSearch.sort ?? 'recent'
  const page = rawSearch.page ?? 1
  const minPrice = rawSearch.minPrice ?? 0
  const maxPrice = rawSearch.maxPrice ?? 12.3
  const network = rawSearch.network ?? 'Todas'
  const [searchText, setSearchText] = useState(q)
  const [lastCatalog, setLastCatalog] = useState<CatalogResult>()
  const [authMode, setAuthMode] = useState<AuthMode>(() => localStorage.getItem('kurio-session-v1') || window.location.pathname !== '/' ? null : 'register')
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const closeAuth = useCallback(() => setAuthMode(null), [])
  const query: CatalogQuery = { q, category, sort, page, minPrice, maxPrice, network }
  const catalog = useQuery({ queryKey: ['catalog', query], queryFn: () => getCatalog(query), placeholderData: keepPreviousData })
  useEffect(() => {
    if (catalog.data) setLastCatalog(catalog.data)
  }, [catalog.data])
  const cart = useQuery({ queryKey: ['cart'], queryFn: getCart })
  const session = useQuery({ queryKey: ['session'], queryFn: getSession })

  function updateSearch(patch: Partial<CatalogQuery>, replace = false) {
    void navigate({
      to: '/',
      search: (previous) => ({ ...defaultCatalogSearch, ...previous, ...patch, page: patch.page ?? 1 }),
      replace,
    })
  }

  useEffect(() => { setSearchText(q) }, [q])
  useEffect(() => { setPriceRange([minPrice, maxPrice]) }, [minPrice, maxPrice])
  useEffect(() => {
    if (searchText === q) return
    const timeout = window.setTimeout(() => updateSearch({ q: searchText }, true), 250)
    return () => window.clearTimeout(timeout)
  }, [searchText, q])

  const visibleCatalog = catalog.data ?? lastCatalog
  const totalPages = visibleCatalog ? Math.max(1, Math.ceil(visibleCatalog.total / visibleCatalog.pageSize)) : 1

  useEffect(() => {
    if (catalog.data && catalog.data.total > 0 && page > totalPages) updateSearch({ page: totalPages }, true)
  }, [catalog.data, page, totalPages])

  return (
    <main className={`${marketShellClass} home-page`}>
      <MarketHeader search={{ q, category, sort, page, minPrice, maxPrice, network }} active="home" cartCount={cart.data?.totalItems ?? 0} onSearch={() => searchRef.current?.focus()} accountAction={session.data ? <div className="flex items-center gap-2"><Link to="/profile" search={defaultCatalogSearch} className="hidden sm:inline-flex h-7 items-center rounded border border-border px-2 text-xs text-market-accent hover:border-primary">Perfil</Link><Link to="/wallets" search={defaultCatalogSearch} className="hidden sm:inline-flex h-7 items-center rounded border border-border px-2 text-xs text-market-accent hover:border-primary">Carteiras</Link></div> : <button className="inline-flex h-6 items-center gap-1.5 rounded-md bg-primary px-2 text-xs font-bold text-market-deep hover:bg-primary" type="button" onClick={() => setAuthMode('login')}><LogIn size={14} /> Entrar</button>} />

      <section className="hero grid min-h-[400px] hero-layout-grid items-center gap-6 px-0 pb-7 pt-1.5 max-tablet:min-h-0 max-tablet:grid-cols-1 max-tablet:gap-5 max-tablet:py-6">
        <div className="hero-copy min-w-0 max-tablet:row-start-2"><p className="eyebrow mb-2 text-lg tracking-wide text-foreground">Bem-vindo à Kurio</p><h1 className="hero-title m-0 font-bold tracking-tight max-tablet:text-3xl">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</h1><p className="hero-subtitle mb-6 mt-3 text-base leading-relaxed text-market-ink-muted max-tablet:mb-4">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.<br className="max-tablet:hidden" /></p><a className="primary-button inline-flex h-7 min-w-24 items-center justify-center rounded-md bg-primary text-xs font-bold text-market-deep transition hover:bg-primary" href="#catalog">EXPLORAR</a></div>
        <div className="max-h-120 relative  overflow-hidden rounded-xl  max-tablet:order-first  "><img className="size-full object-cover" src="/assets/neon-vessel.png" alt="Neon Vessel, macaco colecionável com jaqueta verde" /><div className="feature-label absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2.5 rounded bg-market-page/90 px-2.5 py-2 text-xs"><span className="text-xs tracking-wider text-market-accent">DESTAQUE DA SEMANA</span><strong className="text-xs text-foreground">Neon Vessel #552</strong></div></div>
      </section>

      <section className="marketplace grid marketplace-grid items-start gap-7 pb-16 max-tablet:grid-cols-1 max-tablet:gap-4" id="catalog" aria-label="Catálogo de NFTs">
        <aside className="filter-sidebar min-w-0 bg-market-surface px-3.5 pb-3.5 pt-3 max-tablet:hidden" aria-label="Filtros do catálogo"><FilterPanel category={category} network={network} priceRange={priceRange} onPriceRangeChange={setPriceRange} onSearchChange={updateSearch} /><FeaturedDeal /></aside>

        <div className="catalog-content min-w-0">
          <div className="catalog-toolbar mb-4 flex min-h-8 items-start justify-between gap-3 max-tablet:mb-3.5 max-tablet:items-center max-tablet:gap-2">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild><Button className="mobile-filter-button hidden h-7 items-center gap-1.5 rounded border border-border bg-market-surface px-2 text-xs text-market-accent max-tablet:inline-flex" type="button"><SlidersHorizontal size={15} /> Filtros</Button></SheetTrigger>
              <SheetContent side="left" className="filter-sheet w-full max-w-xs border-r border-border bg-market-surface text-foreground">
                <SheetHeader><SheetTitle>Filtros</SheetTitle><SheetDescription className="text-xs text-market-ink-muted">Escolha coleção, preço e rede.</SheetDescription></SheetHeader>
                <div className="filter-sheet-body grid gap-5 overflow-y-auto py-2.5"><FilterPanel category={category} network={network} priceRange={priceRange} onPriceRangeChange={setPriceRange} onSearchChange={updateSearch} /><FeaturedDeal insideFilterSheet /></div>
              </SheetContent>
            </Sheet>
            <label className="catalog-search flex min-w-0 flex-1 items-center gap-2 text-market-ink-muted max-tablet:gap-2 max-tablet:rounded border border-transparent max-tablet:border-border max-tablet:pl-2"><Search size={16} /><span className="sr-only">Buscar NFTs</span><Input className="catalog-search-input h-7 w-full border-transparent bg-transparent px-2 text-xs text-foreground shadow-none placeholder:text-market-ink-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary" ref={searchRef} value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Buscar NFTs, coleções ou artistas" /></label>
            <div className="sort-control flex max-w-56 flex-none items-center gap-1 text-xs text-foreground max-tablet:max-w-1/2 max-tablet:gap-0"><span className="max-tablet:hidden">Ordenar por:</span><Select value={sort} onValueChange={(value) => updateSearch({ sort: value as CatalogQuery['sort'] })}><SelectTrigger className="sort-select h-7 w-40 rounded-none border-0 bg-transparent px-0.5 text-xs text-foreground shadow-none max-tablet:w-28 max-small:w-24 max-small:text-xs"><SelectValue /></SelectTrigger><SelectContent className="sort-options border-border bg-market-surface text-foreground"><SelectItem value="recent">Listados recentemente</SelectItem><SelectItem value="price-asc">Menor preço</SelectItem><SelectItem value="price-desc">Maior preço</SelectItem></SelectContent></Select></div>
          </div>

          <div className="active-filters -mt-2 mb-3 flex flex-wrap gap-1.5 empty:hidden" aria-live="polite">
            {category !== 'Todas' && <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-market-surface px-2 py-1 text-xs text-market-accent" type="button" onClick={() => updateSearch({ category: 'Todas' })}>{category}<X size={12} /></button>}
            {network !== 'Todas' && <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-market-surface px-2 py-1 text-xs text-market-accent" type="button" onClick={() => updateSearch({ network: 'Todas' })}>{network}<X size={12} /></button>}
            {(minPrice > 0 || maxPrice < 12.3) && <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-market-surface px-2 py-1 text-xs text-market-accent" type="button" onClick={() => updateSearch({ minPrice: 0, maxPrice: 12.3 })}>Faixa de preço<X size={12} /></button>}
          </div>

          {catalog.isError && !visibleCatalog ? <div className="catalog-state flex min-h-64 flex-col items-center justify-center gap-2.5 text-center text-xs text-market-ink-muted"><strong className="text-sm text-foreground">Não foi possível carregar o catálogo.</strong><span>Confira sua conexão e tente novamente.</span><button className="rounded border border-border bg-market-surface px-3 py-1.5 text-market-accent" type="button" onClick={() => void catalog.refetch()}>Tentar novamente</button></div> : catalog.isLoading && !visibleCatalog ? <div className="nft-grid grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-4 md:gap-y-5" aria-label="Carregando catálogo">{Array.from({ length: 9 }, (_, index) => <ProductSkeleton key={index} />)}</div> : visibleCatalog?.items.length ? <>
            <div className="nft-grid grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-4 md:gap-y-5" aria-live="polite">{visibleCatalog.items.map((nft, index) => <ProductCard key={nft.id} nft={nft} index={index} />)}</div>
            <div className="pagination mt-6 flex items-center justify-between gap-3 text-xs text-market-ink-muted"><span aria-live="polite">{catalog.isError ? 'Falha ao atualizar; exibindo os últimos itens carregados.' : catalog.isFetching ? 'Atualizando…' : `${visibleCatalog.total} itens encontrados`}</span><div className="flex items-center gap-2.5"><button className="grid size-7 place-items-center rounded border border-border bg-market-surface p-0 text-market-accent disabled:cursor-not-allowed disabled:opacity-35" type="button" aria-label="Página anterior" disabled={page <= 1 || catalog.isFetching} onClick={() => updateSearch({ page: page - 1 })}><ChevronLeft size={16} /></button><span>Página {page} de {totalPages}</span><div className="pagination-pages flex gap-1" aria-label="Páginas do catálogo">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button className={`grid size-6 place-items-center rounded border border-border bg-market-surface p-0 text-xs text-market-accent disabled:cursor-not-allowed disabled:opacity-35 ${pageNumber === page ? 'current border-primary bg-market-surface text-market-accent' : ''}`} key={pageNumber} type="button" aria-label={`Ir para página ${pageNumber}`} aria-current={pageNumber === page ? 'page' : undefined} disabled={catalog.isFetching} onClick={() => updateSearch({ page: pageNumber })}>{pageNumber}</button>)}</div><button className="grid size-7 place-items-center rounded border border-border bg-market-surface p-0 text-market-accent disabled:cursor-not-allowed disabled:opacity-35" type="button" aria-label="Próxima página" disabled={page >= totalPages || catalog.isFetching} onClick={() => updateSearch({ page: page + 1 })}><ChevronRight size={16} /></button></div></div>
          </> : <div className="catalog-state flex min-h-64 flex-col items-center justify-center gap-2.5 text-center text-xs text-market-ink-muted"><strong className="text-sm text-foreground">Nenhum NFT encontrado</strong><span>Tente ajustar a busca ou remover alguns filtros.</span><button className="rounded border border-border bg-market-surface px-3 py-1.5 text-market-accent" type="button" onClick={() => { setSearchText(''); updateSearch({ q: '', category: 'Todas', network: 'Todas', minPrice: 0, maxPrice: 12.3, page: 1 }) }}>Limpar filtros</button></div>}
        </div>
      </section>

      <MarketplaceBelowSections />
      <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={closeAuth} />
    </main>
  )
}
