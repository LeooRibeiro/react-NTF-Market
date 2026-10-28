import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

/** Inicia os mocks antes de montar a aplicação. */
async function startMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false' || !('serviceWorker' in navigator)) return

  // Some Chromium-based desktop shells expose WebSocket through the Window
  // prototype while reporting an own descriptor with value=undefined. The
  // MSW interceptor checks the own descriptor first, so materialize the native
  // constructor before enabling its WebSocket source.
  const webSocketDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket')
  const nativeWebSocket = globalThis.WebSocket
  if (webSocketDescriptor?.value == null && typeof nativeWebSocket === 'function') {
    Reflect.deleteProperty(globalThis, 'WebSocket')
  }

  const { worker } = await import('./mocks/browser')
  await worker.start()
}

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
