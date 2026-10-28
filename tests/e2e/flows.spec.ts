import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Restaura o mock e recarrega para que React Query não reidrate dados do cenário anterior.
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
    const w = window as unknown as { __kurioResetData?: () => void }
    w.__kurioResetData?.()
  })
  await page.reload()
})

test('favorita e desfavorita NFT com persistência e atualização otimista', async ({ page }) => {
  await page.goto('/')
  // Fecha o modal de cadastro inicial
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()

  // Faz login com a conta demo
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()

  // Navega até o detalhe de um NFT
  await page.goto('/nft/neon-vessel-552')
  const favoriteButton = page.getByRole('button', { name: /favoritos/i })
  await expect(favoriteButton).toBeVisible()

  // Clica para favoritar
  await favoriteButton.click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()

  // Recarrega a página para verificar se persistiu no usuário
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()

  // Clica para desfavoritar
  await page.getByRole('button', { name: 'Remover dos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeVisible()
})

test('executa o fluxo de compra completa do catálogo ao recibo confirmado', async ({ page }) => {
  // 1. Entra na aplicação e faz login
  await page.goto('/')
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()

  // 2. Adiciona item do detalhe ao carrinho
  await page.goto('/nft/neon-vessel-552')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await page.getByRole('link', { name: /Ver carrinho/ }).click()

  // 3. Aplica cupom KURIO10
  await page.getByLabel('Código do cupom').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('.coupon-feedback')).toContainText('Cupom KURIO10 aplicado')

  // 4. Vai para pagamento
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento' }).first()).toBeVisible()
  await expect(page.getByText('demo@kurio.art')).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  // 5. Confirma o pedido
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()

  // 6. Recibo confirmado exibido com sucesso
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await expect(page.getByText('Transação simulada')).toBeVisible()
  await expect(page.locator('.receipt-total')).toContainText('ETH')
})

test('gerencia perfil do colecionador e alteração de senha', async ({ page }) => {
  // Login
  await page.goto('/')
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()

  // Navega para /profile
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Perfil e Segurança' })).toBeVisible()
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('Demo Kurio')

  // Altera biografia
  await page.getByLabel('Biografia').fill('Colecionador verificado de NFTs raros.')
  await page.getByRole('button', { name: 'Salvar Perfil' }).click()
  await expect(page.getByRole('status')).toContainText('Perfil atualizado com sucesso!')

  // Tenta alterar senha com confirmação incorreta
  await page.getByLabel('Senha atual').fill('KurioPass123')
  await page.getByLabel('Nova senha (mínimo 8 caracteres)').fill('NovaSenhaForte99')
  await page.getByLabel('Confirmar nova senha').fill('SenhaDiferente99')
  await page.getByRole('button', { name: 'Atualizar Senha' }).click()
  await expect(page.getByRole('alert')).toContainText('As senhas não coincidem.')
})

test('cadastra nova carteira e gerencia carteira principal', async ({ page }) => {
  // Login
  await page.goto('/')
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()

  // Navega para /wallets
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Carteiras do Colecionador' })).toBeVisible()

  // Cadastra nova carteira
  await page.getByLabel('Identificador / Nome').fill('MetaMask Cofre')
  await page.getByLabel('Endereço da carteira').fill('0x99AA...BB11')
  await page.getByRole('button', { name: 'Salvar Carteira' }).click()

  await expect(page.getByRole('status')).toContainText('Carteira cadastrada com sucesso!')
  await expect(page.getByText('MetaMask Cofre')).toBeVisible()

  // Altera para principal
  const makePrimaryBtn = page.getByRole('button', { name: 'Definir como Principal' }).first()
  if (await makePrimaryBtn.isVisible()) {
    await makePrimaryBtn.click()
    await expect(page.getByRole('status')).toContainText('Carteira principal atualizada!')
  }
})

test('atualiza preço via Socket.IO durante checkout e exige nova confirmação', async ({ page }) => {
  // 1. Login e adição ao carrinho
  await page.goto('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  const closeSignup = page.getByRole('button', { name: 'Fechar cadastro' })
  if (await closeSignup.isVisible()) await closeSignup.click()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await page.getByRole('button', { name: 'Continuar explorando' }).click()

  await page.goto('/nft/neon-vessel-552')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.locator('.detail-feedback')).toContainText('adicionado ao carrinho')

  // Vai para checkout
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento' }).first()).toBeVisible()
  await expect(page.getByText('Neon Vessel #552 × 1')).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()

  // Aguarda conexão ativa do Socket.IO no browser e no MSW
  await page.waitForTimeout(500)
  await page.waitForFunction(() => {
    const w = window as unknown as {
      __kurioSocket?: { connected: boolean }
      __kurioActiveSocketClients?: Set<unknown>
    }
    return Boolean(w.__kurioSocket?.connected) && (w.__kurioActiveSocketClients?.size ?? 0) > 0
  }, { timeout: 5000 })

  // 2. Dispara evento nft.updated em tempo real simulando alteração na blockchain
  await page.evaluate(() => {
    const w = window as unknown as { __kurioUpdateNftPrice?: (id: string, price: string, v: number) => void }
    w.__kurioUpdateNftPrice?.('neon-vessel-552', '2.89', Date.now() + 100)
  })

  // 3. A interface deve alertar sobre a alteração em tempo real e exigir confirmação
  await expect(page.getByRole('alert')).toContainText('Atualização durante a compra')
  await expect(page.getByRole('alert')).toContainText('preço alterado de 1.99 para 2.89 ETH')
  const acceptUpdatedQuote = page.getByRole('button', { name: /Aceitar atualização \(2\.8925 ETH\)/ })
  await expect(acceptUpdatedQuote).toBeVisible()

  // O botão de confirmar pedido deve bloquear até aceite
  await expect(page.getByRole('button', { name: 'Confirme a nova cotação acima' })).toBeDisabled()

  // Clica para aceitar novo total
  await acceptUpdatedQuote.click()

  // Após aceitar, o pedido pode ser confirmado com a cotação atualizada
  await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeEnabled()
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  await expect(page.locator('.receipt-summary')).toContainText('2.8925 ETH')
})
