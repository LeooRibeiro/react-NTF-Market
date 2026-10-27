import { expect, test } from '@playwright/test'

test('cria conta pela API simulada na tela de cadastro', async ({ page }) => {
  await page.setViewportSize({ width: 1032, height: 750 })
  await page.goto('/')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(9)
  await page.screenshot({ path: 'test-results/home-register.png', fullPage: true })
  await page.getByLabel('Nome de usuário').fill('Aline Teste')
  await page.getByLabel('E-mail').fill(`aline-${Date.now()}@example.test`)
  await page.getByLabel('Senha', { exact: true }).fill('KurioPass123')
  await page.getByLabel('Confirmar senha').fill('KurioPass123')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).last().click()
  await expect(page.getByRole('status')).toContainText('Conta criada para Aline Teste')

  await page.getByRole('button', { name: 'Continuar explorando' }).click()
  await expect(dialog).toBeHidden()
})

test('combina categoria e busca e mantém os filtros na URL', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()
  await page.getByRole('button', { name: /Arte digital/ }).first().click()
  await expect(page).toHaveURL(/category=Arte(?:%20|\+)digital/)
  await expect(page.getByRole('article')).toHaveCount(3)

  await page.getByRole('textbox', { name: 'Buscar NFTs' }).fill('Cosmic')
  await expect(page).toHaveURL(/q=Cosmic/)
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article').first()).toContainText('Cosmic Bloom #118')

  await page.reload()
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()
  await expect(page.getByRole('textbox', { name: 'Buscar NFTs' })).toHaveValue('Cosmic')
  await expect(page.getByRole('article')).toHaveCount(1)
})

test('abre filtros acessíveis no mobile sem causar overflow horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Fechar cadastro' }).click()
  await page.getByRole('button', { name: 'Filtros' }).click()

  const filterDialog = page.getByRole('dialog')
  await expect(filterDialog).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Filtros' })).toBeVisible()
  await page.getByRole('button', { name: /Arte digital/ }).last().click()
  await expect(page).toHaveURL(/category=Arte(?:%20|\+)digital/)
  await expect(page.getByRole('article')).toHaveCount(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
