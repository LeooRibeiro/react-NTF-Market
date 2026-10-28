import { http, HttpResponse } from 'msw'
import { accountsStorageKey, sessionStorageKey, type Wallet, readWallets, writeWallets, readFavorites, writeFavorites, readProfile, writeProfile, readAccounts, hashPassword, getMockSession } from './mock-data'
import { resetMockDatabase } from './socket-handlers'
import { takeNetworkFailure } from './network-scenarios'
export const accountHandlers = [
// Wallets CRUD
  http.get('/api/wallets', async () => {
    if (!getMockSession()) return HttpResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
    return HttpResponse.json(readWallets())
  }),

  http.post('/api/wallets', async ({ request }) => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
    const body = await request.json() as { name?: string; address?: string; network?: string; primary?: boolean }
    if (!body.name?.trim() || !body.address?.trim() || !body.network?.trim()) {
      return HttpResponse.json({ message: 'Preencha todos os campos da carteira.' }, { status: 400 })
    }
    const wallets = readWallets()
    const isPrimary = Boolean(body.primary) || wallets.length === 0
    if (isPrimary) {
      wallets.forEach((w) => { w.primary = false })
    }
    const newWallet: Wallet = {
      id: `wallet-${Date.now().toString(36)}`,
      name: body.name.trim(),
      address: body.address.trim(),
      network: body.network.trim(),
      primary: isPrimary,
    }
    wallets.push(newWallet)
    writeWallets(wallets)
    return HttpResponse.json(newWallet, { status: 201 })
  }),

  http.patch('/api/wallets/:walletId', async ({ params, request }) => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
    const body = await request.json() as Partial<Wallet>
    const wallets = readWallets()
    const target = wallets.find((w) => w.id === params.walletId)
    if (!target) return HttpResponse.json({ message: 'Carteira não encontrada.' }, { status: 404 })
    if (body.primary) {
      wallets.forEach((w) => { w.primary = false })
      target.primary = true
    }
    if (body.name) target.name = body.name.trim()
    if (body.network) target.network = body.network.trim()
    writeWallets(wallets)
    return HttpResponse.json(target)
  }),

  http.delete('/api/wallets/:walletId', async ({ params }) => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
    let wallets = readWallets()
    const target = wallets.find((w) => w.id === params.walletId)
    if (!target) return HttpResponse.json({ message: 'Carteira não encontrada.' }, { status: 404 })
    if (target.primary) {
      return HttpResponse.json({ message: 'Não é possível remover a carteira principal.' }, { status: 400 })
    }
    wallets = wallets.filter((w) => w.id !== params.walletId)
    writeWallets(wallets)
    return HttpResponse.json({ success: true })
  }),

  // Favorites (Consulta, inclusão e remoção)
  http.get('/api/favorites', async () => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ items: [] })
    const user = session
    return HttpResponse.json({ items: readFavorites(user.id) })
  }),

  http.post('/api/favorites', async ({ request }) => {
    const failure = takeNetworkFailure('POST /api/favorites')
    if (failure) return failure
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Entre na sua conta para favoritar.' }, { status: 401 })
    const user = session
    const body = await request.json() as { nftId?: string }
    const nftId = String(body.nftId ?? '')
    const favorites = readFavorites(user.id)
    if (!favorites.includes(nftId)) {
      favorites.push(nftId)
      writeFavorites(user.id, favorites)
    }
    return HttpResponse.json({ items: favorites }, { status: 201 })
  }),

  http.delete('/api/favorites/:nftId', async ({ params }) => {
    const failure = takeNetworkFailure('DELETE /api/favorites/:nftId')
    if (failure) return failure
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Entre na sua conta para alterar favoritos.' }, { status: 401 })
    const user = session
    const nftId = String(params.nftId)
    const favorites = readFavorites(user.id).filter((id) => id !== nftId)
    writeFavorites(user.id, favorites)
    return HttpResponse.json({ items: favorites })
  }),

  // Profile (Consulta, atualização e alteração de senha)
  http.get('/api/profile', async () => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Sessão inválida.' }, { status: 401 })
    const user = session
    return HttpResponse.json(readProfile(user.id, user.username, user.email))
  }),

  http.patch('/api/profile', async ({ request }) => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Sessão inválida.' }, { status: 401 })
    const user = session
    const body = await request.json() as { username?: string; avatar?: string; bio?: string }
    const profile = readProfile(user.id, user.username, user.email)
    if (body.username?.trim()) {
      profile.username = body.username.trim()
      user.username = profile.username
      localStorage.setItem(sessionStorageKey, JSON.stringify(user))
    }
    if (body.avatar?.trim()) profile.avatar = body.avatar.trim()
    if (body.bio !== undefined) profile.bio = body.bio.trim()
    writeProfile(profile)
    return HttpResponse.json(profile)
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const session = getMockSession()
    if (!session) return HttpResponse.json({ message: 'Sessão inválida.' }, { status: 401 })
    const user = session
    const body = await request.json() as { currentPassword?: string; newPassword?: string }
    const currentPassword = body.currentPassword ?? ''
    const newPassword = body.newPassword ?? ''

    if (newPassword.length < 8) {
      return HttpResponse.json({ message: 'A nova senha deve ter no mínimo 8 caracteres.' }, { status: 400 })
    }

    const accounts = readAccounts()
    const account = accounts.find((a) => a.email === user.email)
    const isDemo = user.email === 'demo@kurio.art'
    const currentHash = await hashPassword(currentPassword)

    if (isDemo) {
      if (currentPassword !== 'KurioPass123') {
        return HttpResponse.json({ message: 'Senha atual incorreta.' }, { status: 400 })
      }
    } else if (!account || account.passwordHash !== currentHash) {
      return HttpResponse.json({ message: 'Senha atual incorreta.' }, { status: 400 })
    }

    if (account) {
      account.passwordHash = await hashPassword(newPassword)
      localStorage.setItem(accountsStorageKey, JSON.stringify(accounts))
    }
    return HttpResponse.json({ success: true, message: 'Senha alterada com sucesso.' })
  }),

  // Reset helper endpoint
  http.post('/api/dev/reset', async () => {
    resetMockDatabase()
    return HttpResponse.json({ success: true })
  }),
]
