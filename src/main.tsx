import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { HomePage } from './pages/home-page'
import { NftDetailPage } from './pages/nft-detail-page'
import { CartPage } from './pages/cart-page'
import { CheckoutPage } from './pages/checkout-page'
import { OrderPage } from './pages/order-page'
import './styles.css'
import { sortOptions } from './features/catalog/catalog-api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

const rootRoute = createRootRoute({ component: () => <Outlet /> })
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Normaliza a busca da URL para que filtros inválidos não quebrem a consulta do catálogo.
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
  component: HomePage,
})
const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailPage,
})
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: CheckoutPage })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/$orderId', component: OrderPage })
const routeTree = rootRoute.addChildren([homeRoute, nftDetailRoute, cartRoute, checkoutRoute, orderRoute])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

/** Inicializa o service worker MSW quando os mocks estão habilitados no ambiente. */
async function startMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false' || !('serviceWorker' in navigator)) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

/** Aguarda os mocks e monta o app com cache de consultas e rotas configuradas. */
async function bootstrap() {
  await startMocks()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

void bootstrap()
