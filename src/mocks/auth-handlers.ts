import { delay, http, HttpResponse } from 'msw'
import { accountsStorageKey, sessionStorageKey, readAccounts, hashPassword, getMockSession, establishMockSession } from './mock-data'
export const authHandlers = [
// Auth & Session
  http.get('/api/auth/session', async () => {
    try {
      const user = getMockSession()
      if (user) return HttpResponse.json({ id: user.id, username: user.username, email: user.email })
    } catch {
      localStorage.removeItem(sessionStorageKey)
    }
    return HttpResponse.json(null)
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(160)
    const body = await request.json() as { email?: string; password?: string }
    const email = (body.email ?? '').trim().toLocaleLowerCase('pt-BR')
    const password = body.password ?? ''
    const accounts = readAccounts()
    const account = accounts.find((candidate) => candidate.email === email)
    const demoMatch = email === 'demo@kurio.art' && password === 'KurioPass123'
    const passwordHash = account ? await hashPassword(password) : ''
    if (!demoMatch && (!account || account.passwordHash !== passwordHash)) {
      return HttpResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 })
    }
    const user = demoMatch
      ? { id: 'collector-demo', username: 'Demo Kurio', email }
      : { id: account!.id, username: account!.username, email: account!.email }
    establishMockSession(user)
    return HttpResponse.json(user)
  }),

  http.post('/api/auth/social', async ({ request }) => {
    await delay(200)
    const body = await request.json() as { provider?: string }
    const socialUsers = {
      google: { id: 'collector-google', username: 'Google Kurio', email: 'google@kurio.art' },
      facebook: { id: 'collector-facebook', username: 'Facebook Kurio', email: 'facebook@kurio.art' },
    }
    if (body.provider !== 'google' && body.provider !== 'facebook') {
      return HttpResponse.json({ message: 'Provedor de login inválido.' }, { status: 400 })
    }
    const user = socialUsers[body.provider]
    establishMockSession(user)
    return HttpResponse.json(user)
  }),

  http.post('/api/auth/logout', async () => {
    localStorage.removeItem(sessionStorageKey)
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(180)
    const body = await request.json() as { username?: string; email?: string; password?: string }
    const email = (body.email ?? '').trim().toLocaleLowerCase('pt-BR')
    if (!body.username?.trim() || !email || !body.password) {
      return HttpResponse.json({ message: 'Preencha todos os campos.' }, { status: 400 })
    }
    const accounts = readAccounts()
    if (accounts.some((account) => account.email === email) || email === 'demo@kurio.art') {
      return HttpResponse.json({ message: 'Este e-mail já possui uma conta.' }, { status: 409 })
    }
    const user = { id: `collector-${accounts.length + 1}`, username: body.username.trim(), email }
    accounts.push({ ...user, passwordHash: await hashPassword(body.password) })
    localStorage.setItem(accountsStorageKey, JSON.stringify(accounts))
    establishMockSession(user)
    return HttpResponse.json(user, { status: 201 })
  }),
]
