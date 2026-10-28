import { expect, test, type Page } from '@playwright/test'

async function loginDemo(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  const closeRegister = page.getByRole('button', { name: 'Fechar cadastro' })
  if (await closeRegister.isVisible()) await closeRegister.click()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()
}

async function addTestNft(page: Page) {
  await page.goto('/nft/neon-vessel-552')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.locator('.detail-feedback')).toContainText('adicionado ao carrinho')
}

async function prepareCheckout(page: Page) {
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
}

test('isola carteiras e carrinho ao alternar entre contas', async ({ page }) => {
  await loginDemo(page)
  await addTestNft(page)
  await page.goto('/wallets')
  await page.getByLabel('Identificador / Nome').fill('Carteira exclusiva Demo')
  await page.getByLabel('Endereço da carteira').fill('0xDEMO...001')
  await page.getByRole('button', { name: 'Salvar Carteira' }).click()
  await expect(page.getByText('Carteira exclusiva Demo')).toBeVisible()

  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('button', { name: 'Continuar com Facebook' }).click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()

  await page.goto('/wallets')
  await expect(page.getByText('Carteira exclusiva Demo')).toHaveCount(0)
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('retoma o carrinho do usuário no checkout após expiração da sessão', async ({ page }) => {
  await loginDemo(page)
  await addTestNft(page)
  await prepareCheckout(page)
  await page.evaluate(() => (window as unknown as { __kurioExpireSession?: () => void }).__kurioExpireSession?.())
  await expect(page.getByRole('heading', { name: 'Entre para continuar' })).toBeVisible()
  await expect(page.getByText('Seu carrinho será preservado ao entrar.')).toBeVisible()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha').fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar e continuar' }).click()
  await expect(page.getByText('Neon Vessel #552 × 1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeVisible()
})

test('pagamento recusado mantém o carrinho e timeout recupera o pedido pendente após refresh', async ({ page }) => {
  await loginDemo(page)
  await addTestNft(page)
  await prepareCheckout(page)
  await page.getByLabel('Recusar pagamento').check()
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: 'O pagamento não foi concluído' })).toBeVisible()
  await page.goto('/cart')
  await expect(page.locator('.cart-item')).toHaveCount(1)

  await page.goto('/checkout')
  await page.getByLabel('Simular timeout').check()
  await page.getByRole('button', { name: 'Enviar e simular timeout' }).click()
  await expect(page.getByRole('alert')).toContainText('recuperar o mesmo pedido')
  const recover = page.getByRole('button', { name: 'Recuperar tentativa' })
  await expect(recover).toBeEnabled()
  await recover.click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible()

  const orderId = new URL(page.url()).pathname.split('/').pop()!
  const updated = await page.evaluate((id) => {
    const w = window as unknown as { __kurioUpdateOrderStatus?: (orderId: string, status: 'confirmed', version: number) => void }
    return w.__kurioUpdateOrderStatus?.(id, 'confirmed', Date.now() + 10) ?? null
  }, orderId)
  expect(updated).not.toBeNull()
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
})

test('mostra erro HTTP reproduzível do catálogo e permite tentar novamente', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  const closeRegister = page.getByRole('button', { name: 'Fechar cadastro' })
  if (await closeRegister.isVisible()) await closeRegister.click()
  await page.evaluate(() => {
    const w = window as unknown as { __kurioQueueNetworkFailure?: (route: string, failure: { kind: 'http'; status: number }, count?: number) => void }
    w.__kurioQueueNetworkFailure?.('GET /api/nfts', { kind: 'http', status: 503 }, 2)
  })
  await page.getByRole('textbox', { name: 'Buscar NFTs' }).fill(`falha-${Date.now()}`)
  await expect(page.getByText('Falha ao atualizar; exibindo os últimos itens carregados.')).toBeVisible()
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
})

test('faz rollback de favorito após falha HTTP e permite nova tentativa', async ({ page }) => {
  await loginDemo(page)
  await page.goto('/nft/neon-vessel-552')
  await expect(page.getByRole('button', { name: /Favoritar, adicionar aos favoritos/ })).toBeVisible()
  await page.evaluate(() => {
    const w = window as unknown as { __kurioQueueNetworkFailure?: (route: string, failure: { kind: 'http'; status: number }, count?: number) => void }
    w.__kurioQueueNetworkFailure?.('POST /api/favorites', { kind: 'http', status: 503 })
  })

  await page.getByRole('button', { name: /Favoritar, adicionar aos favoritos/ }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível atualizar os favoritos')
  await expect(page.getByRole('button', { name: /Favoritar, adicionar aos favoritos/ })).toBeVisible()

  await page.getByRole('button', { name: /Favoritar, adicionar aos favoritos/ }).click()
  await expect(page.getByRole('button', { name: /Favoritado, remover dos favoritos/ })).toBeVisible()
})
