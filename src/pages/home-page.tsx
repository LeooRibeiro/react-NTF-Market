import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import {
  Check, ChevronLeft, ChevronRight, Eye, EyeOff, Heart,
  LogIn, Search, ShoppingCart, SlidersHorizontal, X,
} from 'lucide-react'
import { getCatalog, registerAccount, type CatalogQuery, type Nft } from '../features/catalog/catalog-api'
import { getCart } from '../features/cart/cart-api'
import { getSession, loginAccount, loginWithProvider, logoutAccount } from '../features/auth/auth-api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const categories = [
  ['Arte digital', 33], ['Fotografia', 12], ['Música', 65], ['Arte 3D', 39],
  ['Colecionáveis', 23], ['Generativa', 17], ['Jogos', 19], ['Assinaturas', 13], ['Utilidade', 18],
] as const
const networks = [['Ethereum', 119], ['Polygon', 78], ['Solana', 86]] as const

type AuthMode = 'login' | 'register' | null

const spotlightItems = [
  { id: 'emerald-ape-042', name: 'Emerald Ape #042', price: '1.19', image: '/assets/emerald-ape.png', badge: 'EDIÇÃO LIMITADA' },
  { id: 'neon-vessel-552', name: 'Neon Vessel #552', price: '1.99', image: '/assets/neon-vessel.png', badge: 'OFERTA DA SEMANA' },
  { id: 'cosmic-bloom-118', name: 'Cosmic Bloom #118', price: '1.29', image: '/assets/cosmic-bloom.png', badge: 'ÚLTIMAS PEÇAS' },
]

/** Alterna uma oferta em destaque por tempo e direciona cada item ao próprio detalhe. */
function FeaturedDeal() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % spotlightItems.length), 12_000)
    return () => window.clearInterval(timer)
  }, [])
  const item = spotlightItems[index]!
  return <section className="featured-deal" aria-label="NFT em destaque">
    <div className="featured-deal-heading"><h2>Oferta limitada</h2><span>AO VIVO</span></div>
    <Link className="featured-deal-art" to="/nft/$nftId" params={{ nftId: item.id }}><img src={item.image} alt={item.name} /><span>{item.badge}</span></Link>
    <Link className="featured-deal-title" to="/nft/$nftId" params={{ nftId: item.id }}>{item.name}</Link>
    <div className="featured-deal-price"><span>Preço especial</span><strong>{item.price} ETH</strong></div>
    <div className="deal-progress"><span key={item.id} /></div>
    <p>O destaque muda automaticamente a cada 12 segundos.</p>
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
    <div className="filter-group"><h2>Coleções</h2><Button variant="ghost" className={category === 'Todas' ? 'filter-row selected' : 'filter-row'} onClick={() => onSearchChange({ category: 'Todas' })}>Todas <span>(12)</span></Button>{categories.map(([name, count]) => <Button variant="ghost" key={name} className={category === name ? 'filter-row selected' : 'filter-row'} onClick={() => onSearchChange({ category: name })}>{name}<span>({count})</span></Button>)}</div>
    <div className="filter-group price-group"><h2>Faixa de preço</h2><Slider aria-label="Faixa de preço em ETH" className="price-slider" min={0} max={12.3} step={0.01} value={priceRange} onValueChange={onPriceRangeChange} /><p>Preço: {min.toFixed(2).replace('.', ',')} – {max.toFixed(2).replace('.', ',')} ETH</p><Button className="apply-button" onClick={() => onSearchChange({ minPrice: min, maxPrice: max })}>Aplicar</Button></div>
    <div className="filter-group network-group"><h2>Rede</h2>{networks.map(([name, count]) => <Button variant="ghost" key={name} className={network === name ? 'filter-row selected' : 'filter-row'} onClick={() => onSearchChange({ network: network === name ? 'Todas' : name })}>{name}<span>({count})</span></Button>)}</div>
  </>
}

/** Apresenta uma peça do catálogo com imagem, criador, preço e link para detalhes. */
function ProductCard({ nft, index }: { nft: Nft; index: number }) {
  return (
    <article className="nft-card">
      <div className="nft-art-wrap">
        <Link className="nft-art-link" to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.name}`}><img className="nft-art" src={nft.image} alt={`${nft.name}, arte digital criada por ${nft.artist}`} loading={index > 2 ? 'lazy' : 'eager'} />{nft.rarity && <span className="rarity-tag">{nft.rarity}</span>}</Link>
        <div className="nft-actions" aria-label={`Ações para ${nft.name}`}>
          <button type="button" aria-label="Adicionar ao carrinho" title="Carrinho será conectado na próxima etapa" disabled><ShoppingCart size={18} /></button>
          <button type="button" aria-label="Adicionar aos favoritos" title="Favoritos serão conectados na próxima etapa" disabled><Heart size={18} /></button>
          <button type="button" aria-label="Ver detalhes" title="Detalhes serão conectados na próxima etapa" disabled><Search size={18} /></button>
        </div>
      </div>
      <div className="nft-meta"><Link className="nft-title" to="/nft/$nftId" params={{ nftId: nft.id }}>{nft.name}</Link><span>{nft.artist} <span className="verified-dot" aria-label="Artista verificado"><Check size={9} /></span></span></div>
      <div className="nft-price"><strong>{nft.price} ETH</strong>{nft.previousPrice && <del>{nft.previousPrice} ETH</del>}</div>
    </article>
  )
}

/** Exibe o placeholder enquanto a consulta do catálogo está carregando. */
function ProductSkeleton() {
  return <div className="nft-skeleton" aria-hidden="true"><div /><span /><i /></div>
}

/** Valida e envia cadastro/login, atualiza a sessão no cache e informa o resultado. */
function AuthModal({ mode, onModeChange, onClose }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const register = useMutation({
    mutationFn: registerAccount,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      setSuccess(`Conta criada para ${user.username}. Bem-vindo à Kurio!`)
    },
  })
  const login = useMutation({
    mutationFn: loginAccount,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      setSuccess(`Bem-vindo de volta, ${user.username}!`)
    },
  })
  const socialLogin = useMutation({
    mutationFn: loginWithProvider,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      setSuccess(`Bem-vindo, ${user.username}!`)
    },
  })
  const mutationError = socialLogin.error ?? (mode === 'login' ? login.error : register.error)
  const apiMessage = mutationError
    ? isAxiosError<{ message?: string }>(mutationError)
      ? mutationError.response?.data?.message ?? 'Não foi possível validar sua conta. Tente novamente.'
      : 'Não foi possível concluir a autenticação. Tente novamente.'
    : ''

  useEffect(() => {
    if (!mode) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, onClose])

  if (!mode) return null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const password = String(values.get('password') ?? '')
    const email = String(values.get('email') ?? '')
    if (mode === 'login') {
      login.mutate({ email, password })
      return
    }
    const confirmation = String(values.get('confirmPassword') ?? '')
    if (password !== confirmation) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    setSuccess('')
    register.mutate({
      username: String(values.get('username') ?? ''),
      email: String(values.get('email') ?? ''),
      password,
    })
  }

  return (
      <Dialog open={Boolean(mode)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent showCloseButton={false} className="auth-modal max-w-[calc(100vw-32px)] rounded-none border-0 border-b-[6px] outline-none sm:max-w-none">
        <DialogTitle className="sr-only">Entrar ou criar conta na Kurio</DialogTitle>
        <DialogDescription className="sr-only">Acesse sua conta de colecionador ou crie um novo perfil.</DialogDescription>
        <DialogClose className="modal-close" aria-label="Fechar cadastro"><X size={16} /></DialogClose>
        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { onModeChange('login'); register.reset(); login.reset(); socialLogin.reset(); setSuccess('') }}>Entrar</button>
          <span>|</span>
          <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => { onModeChange('register'); register.reset(); login.reset(); socialLogin.reset(); setSuccess('') }}>Criar conta</button>
        </div>
        <p className="auth-description">Crie seu perfil de colecionador e conecte uma<br className="desktop-only" /> carteira quando quiser.</p>

        {success ? (
          <div className="auth-success" role="status"><span><Check size={21} /></span><strong>{success}</strong><button type="button" onClick={onClose}>Continuar explorando</button></div>
        ) : (
          <form className="auth-form" ref={formRef} onSubmit={submit}>
            {mode === 'register' && <label className="sr-only" htmlFor="register-username">Nome de usuário</label>}
            {mode === 'register' && <Input className="auth-field" id="register-username" name="username" autoComplete="username" placeholder="Nome de usuário" minLength={2} required />}
            <label className="sr-only" htmlFor="register-email">E-mail</label>
            <Input className="auth-field" id="register-email" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail" required />
            <label className="sr-only" htmlFor="register-password">Senha</label>
            <div className="password-input"><input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Senha" minLength={8} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
            {mode === 'register' && <label className="sr-only" htmlFor="register-confirm-password">Confirmar senha</label>}
            {mode === 'register' && <Input className="auth-field" id="register-confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirmar senha" minLength={8} required />}
            {passwordMismatch && <p className="form-error" role="alert">As senhas não coincidem.</p>}
            {apiMessage && <p className="form-error" role="alert">{apiMessage}</p>}
            <Button className="auth-submit" type="submit" disabled={register.isPending || login.isPending}>{register.isPending ? 'Criando conta…' : login.isPending ? 'Validando…' : mode === 'register' ? 'Criar conta' : 'Entrar'}</Button>
          </form>
        )}

        {!success && <>
          <div className="auth-divider"><span>Ou continue com</span></div>
          <Button className="social-button" type="button" disabled={register.isPending || login.isPending || socialLogin.isPending} onClick={() => socialLogin.mutate('google')}><span className="google-mark">G</span> {socialLogin.isPending && socialLogin.variables === 'google' ? 'Conectando ao Google…' : 'Continuar com Google'}</Button>
          <Button className="social-button" type="button" disabled={register.isPending || login.isPending || socialLogin.isPending} onClick={() => socialLogin.mutate('facebook')}><span className="facebook-mark">f</span> {socialLogin.isPending && socialLogin.variables === 'facebook' ? 'Conectando ao Facebook…' : 'Continuar com Facebook'}</Button>
        </>}
      </DialogContent>
      </Dialog>
  )
}

/** Coordena catálogo, filtros na URL, sessão do colecionador e abertura de autenticação. */
export function HomePage() {
  const navigate = useNavigate({ from: '/' })
  const { q, category, sort, page, minPrice, maxPrice, network } = useSearch({ from: '/' })
  const [searchText, setSearchText] = useState(q)
  const [authMode, setAuthMode] = useState<AuthMode>(() => localStorage.getItem('kurio-session-v1') ? null : 'register')
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const closeAuth = useCallback(() => setAuthMode(null), [])
  const query: CatalogQuery = { q, category, sort, page, minPrice, maxPrice, network }
  const catalog = useQuery({ queryKey: ['catalog', query], queryFn: () => getCatalog(query) })
  const cart = useQuery({ queryKey: ['cart'], queryFn: getCart })
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: getSession })
  const logout = useMutation({ mutationFn: logoutAccount, onSuccess: () => { queryClient.setQueryData(['session'], null) } })

  function updateSearch(patch: Partial<CatalogQuery>, replace = false) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }),
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

  const totalPages = catalog.data ? Math.max(1, Math.ceil(catalog.data.total / catalog.data.pageSize)) : 1

  return (
    <main className="market-shell home-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Kurio, página inicial">KURIO</a>
        <nav className="desktop-nav" aria-label="Navegação principal"><a className="active" href="#home">Início</a><a href="#catalog">Mercado</a><a href="#creators">Criadores</a><a href="#learn">Aprenda</a></nav>
        <div className="header-actions">
          <button className="top-icon" type="button" onClick={() => searchRef.current?.focus()} aria-label="Buscar NFTs"><Search size={17} /></button>
          <Link className="top-icon cart-link" to="/cart" aria-label={`Carrinho, ${cart.data?.totalItems ?? 0} itens`}><ShoppingCart size={17} /><span>{cart.data?.totalItems ?? 0}</span></Link>
          {session.data ? <button className="login-button profile-button" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>{session.data.username}<span>Sair</span></button> : <button className="login-button" type="button" onClick={() => setAuthMode('login')}><LogIn size={14} /> Entrar</button>}
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy"><p className="eyebrow">Bem-vindo à Kurio</p><h1>SEJA DONO DO<br />DA ARTE DIGITAL</h1><p className="hero-subtitle">Descubra NFTs selecionados de criadores talentosos<br className="desktop-only" /> e arte digital verificada.</p><a className="primary-button" href="#catalog">EXPLORAR</a></div>
        <div className="hero-feature"><img src="/assets/hero-vessel.png" alt="Neon Vessel, macaco colecionável com jaqueta verde" /><div className="feature-label"><span>DESTAQUE DA SEMANA</span><strong>Neon Vessel #552</strong></div></div>
      </section>

      <section className="marketplace" id="catalog" aria-label="Catálogo de NFTs">
        <aside className="filter-sidebar" aria-label="Filtros do catálogo"><FilterPanel category={category} network={network} priceRange={priceRange} onPriceRangeChange={setPriceRange} onSearchChange={updateSearch} /><FeaturedDeal /></aside>

        <div className="catalog-content">
          <div className="catalog-toolbar">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild><Button className="mobile-filter-button" type="button"><SlidersHorizontal size={15} /> Filtros</Button></SheetTrigger>
              <SheetContent side="left" className="filter-sheet">
                <SheetHeader><SheetTitle>Filtros</SheetTitle><SheetDescription>Escolha coleção, preço e rede.</SheetDescription></SheetHeader>
                <div className="filter-sheet-body"><FilterPanel category={category} network={network} priceRange={priceRange} onPriceRangeChange={setPriceRange} onSearchChange={updateSearch} /><FeaturedDeal /></div>
              </SheetContent>
            </Sheet>
            <label className="catalog-search"><Search size={16} /><span className="sr-only">Buscar NFTs</span><Input className="catalog-search-input" ref={searchRef} value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Buscar NFTs, coleções ou artistas" /></label>
            <div className="sort-control"><span>Ordenar por:</span><Select value={sort} onValueChange={(value) => updateSearch({ sort: value as CatalogQuery['sort'] })}><SelectTrigger className="sort-select" aria-label="Ordenar catálogo"><SelectValue /></SelectTrigger><SelectContent className="sort-options"><SelectItem value="recent">Listados recentemente</SelectItem><SelectItem value="price-asc">Menor preço</SelectItem><SelectItem value="price-desc">Maior preço</SelectItem></SelectContent></Select></div>
          </div>

          <div className="active-filters" aria-live="polite">
            {category !== 'Todas' && <button type="button" onClick={() => updateSearch({ category: 'Todas' })}>{category}<X size={12} /></button>}
            {network !== 'Todas' && <button type="button" onClick={() => updateSearch({ network: 'Todas' })}>{network}<X size={12} /></button>}
            {(minPrice > 0 || maxPrice < 12.3) && <button type="button" onClick={() => updateSearch({ minPrice: 0, maxPrice: 12.3 })}>Faixa de preço<X size={12} /></button>}
          </div>

          {catalog.isError ? <div className="catalog-state"><strong>Não foi possível carregar o catálogo.</strong><span>Confira sua conexão e tente novamente.</span><button type="button" onClick={() => void catalog.refetch()}>Tentar novamente</button></div> : catalog.isLoading ? <div className="nft-grid" aria-label="Carregando catálogo">{Array.from({ length: 9 }, (_, index) => <ProductSkeleton key={index} />)}</div> : catalog.data?.items.length ? <>
            <div className="nft-grid" aria-live="polite">{catalog.data.items.map((nft, index) => <ProductCard key={nft.id} nft={nft} index={index} />)}</div>
            <div className="pagination"><span>{catalog.isFetching ? 'Atualizando…' : `${catalog.data.total} itens encontrados`}</span><div><button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => updateSearch({ page: page - 1 })}><ChevronLeft size={16} /></button><span>Página {page} de {totalPages}</span><div className="pagination-pages" aria-label="Páginas do catálogo">{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" aria-label={`Ir para página ${pageNumber}`} aria-current={pageNumber === page ? 'page' : undefined} className={pageNumber === page ? 'current' : ''} onClick={() => updateSearch({ page: pageNumber })}>{pageNumber}</button>)}</div><button type="button" aria-label="Próxima página" disabled={page >= totalPages} onClick={() => updateSearch({ page: page + 1 })}><ChevronRight size={16} /></button></div></div>
          </> : <div className="catalog-state"><strong>Nenhum NFT encontrado</strong><span>Tente ajustar a busca ou remover alguns filtros.</span><button type="button" onClick={() => { setSearchText(''); updateSearch({ q: '', category: 'Todas', network: 'Todas', minPrice: 0, maxPrice: 12.3, page: 1 }) }}>Limpar filtros</button></div>}
        </div>
      </section>

      <footer className="footer"><span>© 2026 KURIO</span><span>Descubra. Colecione. Seja original.</span></footer>
      <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={closeAuth} />
    </main>
  )
}
