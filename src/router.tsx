import { createRootRoute, createRoute, createRouter, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { sortOptions } from './features/catalog/catalog-api'
import { useRealtimeSync } from './features/realtime/use-realtime-sync'
import { CartPage } from './pages/cart-page'
import { CheckoutPage } from './pages/checkout-page'
import { HomePage } from './pages/home-page'
import { NftDetailPage } from './pages/nft-detail-page'
import { OrderPage } from './pages/order-page'
import { ProfilePage } from './pages/profile-page'
import { WalletsPage } from './pages/wallets-page'

function RootLayout() {
  useRealtimeSync()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const showMarket = pathname === '/' || pathname === '/cart' || pathname === '/checkout'
  const mainTarget = pathname === '/' ? 'catalog' : pathname === '/cart' ? 'cart-main' : pathname === '/checkout' ? 'checkout-main' : 'page-main'

  return <><a className="skip-link" href={`#${mainTarget}`}>Pular para o conteúdo principal</a>{showMarket && <HomePage />}<div id="page-main" tabIndex={-1}><Outlet /></div></>
}

function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-96 max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Página não encontrada (404)</h1>
      <p className="mb-6 text-sm text-market-ink-muted">A página solicitada não existe ou foi removida.</p>
      <Link
        className="primary-button"
        to="/"
        search={{ q: '', category: 'Todas', sort: 'recent', page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }}
      >
        Voltar ao mercado
      </Link>
    </main>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  validateSearch: (search: Record<string, unknown>) => {
    const requestedSort = String(search.sort ?? 'recent')

    return {
      q: typeof search.q === 'string' ? search.q : '',
      category: typeof search.category === 'string' ? search.category : 'Todas',
      sort: sortOptions.includes(requestedSort as (typeof sortOptions)[number])
        ? requestedSort as (typeof sortOptions)[number]
        : 'recent',
      page: Math.max(1, Number(search.page) || 1),
      minPrice: Math.max(0, Number(search.minPrice) || 0),
      maxPrice: Math.max(0.1, Number(search.maxPrice) || 12.3),
      network: typeof search.network === 'string' ? search.network : 'Todas',
    }
  },
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null })
const nftDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nft/$nftId', component: NftDetailPage })
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: CartPage })
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: CheckoutPage })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/$orderId', component: OrderPage })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: ProfilePage })
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/wallets', component: WalletsPage })

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({ routeTree, defaultNotFoundComponent: NotFoundPage })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
