import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, KeyRound, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarketHeader } from '../components/market-header'
import { marketShellClass } from '../lib/marketplace-styles'
import { getSession, logoutAccount } from '../features/auth/auth-api'
import { changePassword, getProfile, updateProfile } from '../features/profile/profile-api'
import { ProfileAvatarCard } from '../components/profile-avatar-card'

const avatarOptions = [
  '/assets/emerald-ape.png',
  '/assets/hero-vessel.png',
  '/assets/cosmic-bloom.png',
  '/assets/golden-beat.png',
  '/assets/sage-nomad.png',
  '/assets/violet-nomad.png',
]

const catalogSearch = { q: '', category: 'Todas', sort: 'recent' as const, page: 1, minPrice: 0, maxPrice: 12.3, network: 'Todas' }

export function ProfilePage() {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: ['session'], queryFn: getSession })
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: Boolean(session.data),
  })

  // Estado do formulário de perfil
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Estado da alteração de senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Preenche os campos quando o perfil carregar
  const profile = profileQuery.data
  const activeAvatar = selectedAvatar || profile?.avatar || avatarOptions[0]!

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      void queryClient.setQueryData(['profile'], updated)
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      setProfileSuccess('Perfil atualizado com sucesso!')
      setProfileError('')
    },
    onError: (err) => {
      const msg = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message ?? 'Falha ao atualizar perfil.'
        : 'Erro inesperado.'
      setProfileError(msg)
      setProfileSuccess('')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (res) => {
      setPasswordSuccess(res.message || 'Senha alterada com sucesso!')
      setPasswordError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => {
      const msg = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message ?? 'Não foi possível alterar a senha.'
        : 'Erro inesperado.'
      setPasswordError(msg)
      setPasswordSuccess('')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutAccount,
    onSuccess: () => {
      queryClient.setQueryData(['session'], null)
    },
  })

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    setProfileSuccess('')
    setProfileError('')
    profileMutation.mutate({
      username: username || profile?.username,
      bio: bio !== '' ? bio : profile?.bio,
      avatar: activeAvatar,
    })
  }

  function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPasswordSuccess('')
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    passwordMutation.mutate({ currentPassword, newPassword })
  }

  if (session.isLoading) {
    return (
      <main className={`${marketShellClass} flex min-h-detail-state flex-col items-center justify-center`}>
        <p className="text-sm text-market-ink-muted">Carregando perfil…</p>
      </main>
    )
  }

  if (!session.data) {
    return (
      <main className={`${marketShellClass} flex min-h-detail-state flex-col items-center justify-center text-center`}>
        <h1 className="mb-2 text-2xl font-bold">Acesso restrito</h1>
        <p className="mb-4 text-sm text-market-ink-muted">Você precisa estar logado para visualizar seu perfil.</p>
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
        <span>Conta</span>
        <span>/</span>
        <span>Perfil do Colecionador</span>
      </div>

      <div className="profile-heading mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="eyebrow mb-1 text-xs text-market-accent">CONTA DO COLECIONADOR</p>
          <h1 className="m-0 text-2xl font-bold text-foreground">Perfil e Segurança</h1>
        </div>
        <div className="flex gap-2">
          <Link className="inline-flex h-8 items-center gap-1.5 rounded border border-border bg-market-surface px-3 text-xs text-market-accent hover:border-primary" to="/wallets" search={catalogSearch}>
            Gerenciar Carteiras
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <ProfileAvatarCard profile={profile} activeAvatar={activeAvatar} avatarOptions={avatarOptions} onAvatarSelect={setSelectedAvatar} />



        {/* Formulários de Edição de Perfil e Senha */}
        <div className="space-y-6 md:col-span-2">
          {/* Formulário de Dados */}
          <section className="rounded border border-border bg-market-surface p-5" aria-label="Dados do perfil">
            <h2 className="mb-3 text-sm font-bold text-foreground">Editar Dados Pessoais</h2>
            {profileSuccess && (
              <p className="mb-3 rounded border border-market-success/40 bg-market-success/10 p-2.5 text-xs text-market-success" role="status">
                {profileSuccess}
              </p>
            )}
            {profileError && (
              <p className="mb-3 rounded border border-market-danger/40 bg-market-danger/10 p-2.5 text-xs text-market-danger" role="alert">
                {profileError}
              </p>
            )}

            <form onSubmit={handleProfileSubmit} className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="profile-username">
                  Nome de usuário
                </label>
                <Input
                  id="profile-username"
                  name="username"
                  defaultValue={profile?.username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome no marketplace"
                  required
                  minLength={2}
                  className="h-9 border-border bg-market-deep text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="profile-email">
                  E-mail (fixo)
                </label>
                <Input
                  id="profile-email"
                  value={profile?.email}
                  disabled
                  className="h-9 border-border bg-market-deep/50 text-xs opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="profile-bio">
                  Biografia
                </label>
                <textarea
                  id="profile-bio"
                  defaultValue={profile?.bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre suas coleções e interesses…"
                  rows={3}
                  className="w-full rounded border border-border bg-market-deep p-2 text-xs text-foreground placeholder:text-market-ink-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="h-9 bg-primary text-xs font-bold text-market-deep hover:bg-primary"
                >
                  {profileMutation.isPending ? 'Salvando alterações…' : 'Salvar Perfil'}
                </Button>
              </div>
            </form>
          </section>

          {/* Formulário de Alteração de Senha */}
          <section className="rounded border border-border bg-market-surface p-5" aria-label="Alterar senha">
            <h2 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
              <KeyRound size={16} className="text-market-accent" /> Alterar Senha
            </h2>
            {passwordSuccess && (
              <p className="mb-3 rounded border border-market-success/40 bg-market-success/10 p-2.5 text-xs text-market-success" role="status">
                {passwordSuccess}
              </p>
            )}
            {passwordError && (
              <p className="mb-3 rounded border border-market-danger/40 bg-market-danger/10 p-2.5 text-xs text-market-danger" role="alert">
                {passwordError}
              </p>
            )}

            <form onSubmit={handlePasswordSubmit} className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="current-password">
                  Senha atual
                </label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  required
                  className="h-9 border-border bg-market-deep text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="new-password">
                    Nova senha (mínimo 8 caracteres)
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha segura"
                    required
                    minLength={8}
                    className="h-9 border-border bg-market-deep text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-market-ink-muted" htmlFor="confirm-new-password">
                    Confirmar nova senha
                  </label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    minLength={8}
                    className="h-9 border-border bg-market-deep text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="h-9 bg-primary text-xs font-bold text-market-deep hover:bg-primary"
                >
                  {passwordMutation.isPending ? 'Validando…' : 'Atualizar Senha'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          className="h-9 border-border text-xs hover:border-primary"
        >
          <LogOut size={14} />
          {logoutMutation.isPending ? 'Saindo…' : 'Sair da conta'}
        </Button>
      </div>
    </main>
  )
}
