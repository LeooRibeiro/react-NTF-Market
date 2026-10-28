import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MarketHeader } from '../components/market-header'
import { marketShellClass } from '../lib/marketplace-styles'
import { getSession } from '../features/auth/auth-api'
import { createWallet, deleteWallet, getWallets, updateWallet } from '../features/wallets/wallets-api'
import { WalletList } from '../components/wallet-list'

const catalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

export function WalletsPage() {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: getSession })
  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: getWallets, enabled: Boolean(session.data) })

  // Estado do formulário de nova carteira
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState('Ethereum')
  const [makePrimary, setMakePrimary] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const createMutation = useMutation({
    mutationFn: createWallet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setSuccessMsg('Carteira cadastrada com sucesso!')
      setErrorMsg('')
      setName('')
      setAddress('')
      setMakePrimary(false)
    },
    onError: (err) => {
      const msg = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message ?? 'Falha ao cadastrar carteira.'
        : 'Erro inesperado.'
      setErrorMsg(msg)
      setSuccessMsg('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, primary }: { id: string; primary: boolean }) =>
      updateWallet(id, { primary }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setSuccessMsg('Carteira principal atualizada!')
      setErrorMsg('')
    },
    onError: (err) => {
      setErrorMsg(isAxiosError<{ message?: string }>(err) ? err.response?.data?.message ?? 'Não foi possível atualizar a carteira.' : 'Erro inesperado.')
      setSuccessMsg('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWallet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setSuccessMsg('Carteira removida.')
      setErrorMsg('')
    },
    onError: (err) => {
      const msg = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message ?? 'Não foi possível remover a carteira.'
        : 'Erro inesperado.'
      setErrorMsg(msg)
    },
  })

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')
    if (!name.trim() || !address.trim()) {
      setErrorMsg('Informe o nome e o endereço da carteira.')
      return
    }
    createMutation.mutate({
      name: name.trim(),
      address: address.trim(),
      network,
      primary: makePrimary,
    })
  }

  const wallets = walletsQuery.data ?? []

  if (session.isLoading) {
    return (
      <main className={`${marketShellClass} flex min-h-detail-state flex-col items-center justify-center`}>
        <p className="text-sm text-market-ink-muted">Carregando carteiras…</p>
      </main>
    )
  }

  if (!session.data) {
    return (
      <main className={`${marketShellClass} flex min-h-detail-state flex-col items-center justify-center text-center`}>
        <h1 className="mb-2 text-2xl font-bold">Acesso restrito</h1>
        <p className="mb-4 text-sm text-market-ink-muted">Você precisa estar logado para gerenciar suas carteiras.</p>
        <Link className="primary-button" to="/" search={catalogSearch}>Ir para início e entrar</Link>
      </main>
    )
  }

  return (
    <main className={`${marketShellClass} pb-16`}>
      <MarketHeader
        search={catalogSearch}
        accountAction={
          <Link className="inline-flex h-7 items-center gap-1.5 rounded-md bg-market-surface px-3 text-xs font-bold text-foreground border border-border hover:border-primary" to="/" search={catalogSearch}>
            Voltar ao Mercado
          </Link>
        }
      />

      <div className="detail-breadcrumb flex items-center gap-2 pb-3 pt-5 text-xs text-market-copy">
        <Link className="inline-flex items-center gap-1.5 text-market-accent" to="/" search={catalogSearch}>
          <ArrowLeft size={14} /> Voltar ao mercado
        </Link>
        <span>/</span>
        <Link className="hover:text-market-accent" to="/profile" search={catalogSearch}>Conta</Link>
        <span>/</span>
        <span>Carteiras</span>
      </div>

      <div className="profile-heading mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="eyebrow mb-1 text-xs text-market-accent">CONEXÃO E PAGAMENTO</p>
          <h1 className="m-0 text-2xl font-bold text-foreground">Carteiras do Colecionador</h1>
        </div>
        <div className="flex gap-2">
          <Link className="inline-flex h-8 items-center gap-1.5 rounded border border-border bg-market-surface px-3 text-xs text-market-accent hover:border-primary" to="/profile" search={catalogSearch}>
            Meu Perfil
          </Link>
        </div>
      </div>

      {successMsg && (
        <p className="mb-4 rounded border border-market-success/40 bg-market-success/10 p-3 text-xs text-market-success flex items-center gap-2" role="status">
          <CheckCircle2 size={16} /> {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="mb-4 rounded border border-market-danger/40 bg-market-danger/10 p-3 text-xs text-market-danger" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <WalletList
          wallets={wallets}
          isLoading={walletsQuery.isLoading}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onSetPrimary={(walletId) => updateMutation.mutate({ id: walletId, primary: true })}
          onDelete={(walletId) => deleteMutation.mutate(walletId)}
        />


        {/* Formulário de Cadastro de Nova Carteira */}
        <section className="rounded border border-border bg-market-surface p-5 md:col-span-1" aria-label="Adicionar carteira">
          <h2 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
            <Plus size={16} className="text-market-accent" /> Cadastrar Carteira
          </h2>
          <p className="mb-4 text-xs text-market-ink-muted">
            Adicione um endereço público simulado para utilizar durante o checkout.
          </p>

          <form onSubmit={handleCreate} className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="wallet-name">
                Identificador / Nome
              </label>
              <Input
                id="wallet-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha MetaMask, Ledger"
                required
                className="h-9 border-border bg-market-deep text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="wallet-address">
                Endereço da carteira
              </label>
              <Input
                id="wallet-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... ou chave pública"
                required
                className="h-9 border-border bg-market-deep text-xs font-mono"
              />
            </div>

            <div>
              <span id="wallet-network-label" className="mb-1 block text-xs text-market-ink-muted">Rede Blockchain</span>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger aria-labelledby="wallet-network-label" className="h-9 border-border bg-market-deep text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-market-surface text-foreground">
                  <SelectItem value="Ethereum">Ethereum</SelectItem>
                  <SelectItem value="Polygon">Polygon</SelectItem>
                  <SelectItem value="Solana">Solana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="mt-1 flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={makePrimary}
                onChange={(e) => setMakePrimary(e.target.checked)}
                className="rounded accent-primary"
              />
              Definir como carteira principal
            </label>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-9 w-full bg-primary text-xs font-bold text-market-deep hover:bg-primary"
              >
                {createMutation.isPending ? 'Cadastrando…' : 'Salvar Carteira'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
