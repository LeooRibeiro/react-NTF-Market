import { expect, test, type Page } from '@playwright/test'

const desktop = { width: 1440, height: 1000 }
const mobile = { width: 390, height: 844 }

async function dismissSignup(page: Page) {
  await page.goto('/')
  const dismiss = page.getByRole('button', { name: 'Fechar cadastro' })
  if (await dismiss.isVisible()) await dismiss.click()
  await expect(page.locator('.nft-grid article').first()).toBeVisible()
}

async function addDemoNft(page: Page) {
  await page.goto('/nft/neon-vessel-552')
  await expect(page.getByRole('heading', { name: 'Neon Vessel #552' })).toBeVisible()
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.locator('.detail-feedback')).toContainText('adicionado ao carrinho')
}

async function loginDemo(page: Page) {
  await dismissSignup(page)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('E-mail').fill('demo@kurio.art')
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByRole('status')).toContainText('Bem-vindo de volta, Demo Kurio')
  await page.getByRole('button', { name: 'Continuar explorando' }).click()
}

async function compareDesktopAndMobile(page: Page, name: string) {
  await page.setViewportSize(desktop)
  await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  })

  await page.setViewportSize(mobile)
  const dismiss = page.getByRole('button', { name: 'Fechar cadastro' })
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click()
  await expect(page.locator('.auth-dialog')).toBeHidden()
  await expect(page).toHaveScreenshot(`${name}-mobile.png`, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  })
}

test('regressão visual da página inicial em desktop e mobile', async ({ page }) => {
  await dismissSignup(page)
  await compareDesktopAndMobile(page, 'home')
})

test('regressão visual do detalhe do NFT em desktop e mobile', async ({ page }) => {
  await page.setViewportSize(desktop)
  await page.goto('/nft/neon-vessel-552')
  await expect(page.getByRole('heading', { name: 'Neon Vessel #552' })).toBeVisible()
  await compareDesktopAndMobile(page, 'nft-detail')
})

test('regressão visual do carrinho em desktop e mobile', async ({ page }) => {
  await dismissSignup(page)
  await addDemoNft(page)
  await page.goto('/cart')
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await compareDesktopAndMobile(page, 'cart')
})

test('regressão visual do pagamento em desktop e mobile', async ({ page }) => {
  await page.setViewportSize(desktop)
  await loginDemo(page)
  await addDemoNft(page)
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeEnabled()
  await compareDesktopAndMobile(page, 'checkout')
})
