import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { registerAccount } from '../features/catalog/catalog-api'
import { loginAccount, loginWithProvider } from '../features/auth/auth-api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type AuthMode = 'login' | 'register' | null
/** Valida e envia cadastro/login, atualiza a sessão no cache e informa o resultado. */
export function AuthModal({ mode, onModeChange, onClose }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const register = useMutation({
    mutationFn: registerAccount,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      setSuccess(`Conta criada para ${user.username}. Bem-vindo à Kurio!`)
    },
  })
  const login = useMutation({
    mutationFn: loginAccount,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      setSuccess(`Bem-vindo de volta, ${user.username}!`)
    },
  })
  const socialLogin = useMutation({
    mutationFn: loginWithProvider,
    onSuccess: (user) => {
      queryClient.setQueryData(['session'], user)
      setSuccess(`Bem-vindo, ${user.username}!`)
    },
  })
  const mutationError = socialLogin.error ?? (mode === 'login' ? login.error : register.error)
  const apiMessage = mutationError
    ? isAxiosError<{ message?: string }>(mutationError)
      ? mutationError.response?.data?.message ?? 'Não foi possível validar sua conta. Tente novamente.'
      : 'Não foi possível concluir a autenticação. Tente novamente.'
    : ''

  useEffect(() => {
    if (!mode) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, onClose])

  if (!mode) return null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const password = String(values.get('password') ?? '')
    const email = String(values.get('email') ?? '')
    if (mode === 'login') {
      login.mutate({ email, password })
      return
    }
    const confirmation = String(values.get('confirmPassword') ?? '')
    if (password !== confirmation) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    setSuccess('')
    register.mutate({
      username: String(values.get('username') ?? ''),
      email: String(values.get('email') ?? ''),
      password,
    })
  }

  return (
      <Dialog open={Boolean(mode)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent showCloseButton={false} className="auth-dialog !block max-w-lg !min-h-96 !rounded-none !border-0 !border-b-4 !border-primary !bg-market-surface !px-16 !py-10 auth-modal-shadow outline-none max-tablet:!min-h-0 max-tablet:!px-10 max-tablet:!py-8 max-small:!px-7 max-small:!py-7">
        <DialogTitle className="sr-only">Entrar ou criar conta na Kurio</DialogTitle>
        <DialogDescription className="sr-only">Acesse sua conta de colecionador ou crie um novo perfil.</DialogDescription>
        <DialogClose className="absolute right-2 top-2 grid size-8 place-items-center border-0 bg-transparent p-0 text-primary" aria-label="Fechar cadastro"><X size={18} /></DialogClose>
        <p className="auth-mobile-brand" aria-hidden="true">KURIO</p>
        <div className="auth-tabs flex items-center justify-center gap-1.5 text-sm text-foreground">
          <button type="button" className={`border-0 bg-transparent p-0 text-primary ${mode === 'login' ? 'text-foreground' : ''}`} onClick={() => { onModeChange('login'); register.reset(); login.reset(); socialLogin.reset(); setSuccess('') }}>Entrar</button>
          <span>|</span>
          <button type="button" className={`border-0 bg-transparent p-0 text-primary ${mode === 'register' ? 'text-foreground' : ''}`} onClick={() => { onModeChange('register'); register.reset(); login.reset(); socialLogin.reset(); setSuccess('') }}>Criar conta</button>
        </div>
        <p className="auth-description -mx-5 mb-3 mt-5 text-center text-xs leading-5 text-foreground">Crie seu perfil de colecionador e conecte uma<br className="max-tablet:hidden" /> carteira quando quiser.</p>
        {mode === 'login' && (
          <p className="mb-3 text-center text-xs leading-5 text-market-ink-muted">
            Acesso de teste: <strong>demo@kurio.art</strong> · Senha: <strong>KurioPass123</strong>
          </p>
        )}

        {success ? (
          <div className="auth-success flex min-h-52 flex-col items-center justify-center gap-3.5 text-center text-xs text-foreground" role="status"><span className="grid size-10 place-items-center rounded-full border border-primary text-market-accent"><Check size={21} /></span><strong>{success}</strong><button className="rounded bg-primary px-3 py-2 text-xs font-bold text-market-deep" type="button" onClick={onClose}>Continuar explorando</button></div>
        ) : (
          <form className="auth-form grid gap-2" ref={formRef} onSubmit={submit}>
            {mode === 'register' && <label className="sr-only" htmlFor="register-username">Nome de usuário</label>}
            {mode === 'register' && <Input className="auth-field h-9 w-full rounded border border-input bg-market-surface px-2.5 text-xs text-foreground shadow-none placeholder:text-market-ink-muted" id="register-username" name="username" autoComplete="username" placeholder="Nome de usuário" minLength={2} required />}
            <label className="sr-only" htmlFor="register-email">E-mail</label>
            <Input className="auth-field h-9 w-full rounded border border-input bg-market-surface px-2.5 text-xs text-foreground shadow-none placeholder:text-market-ink-muted" id="register-email" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail" required />
            <label className="sr-only" htmlFor="register-password">Senha</label>
            <div className="password-input flex h-9 w-full items-center rounded border border-input bg-market-surface"><input className="h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-xs text-foreground placeholder:text-market-ink-muted" id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Senha" minLength={8} required /><button className="grid h-full w-8 place-items-center border-0 bg-transparent text-market-ink-muted" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
            {mode === 'register' && <label className="sr-only" htmlFor="register-confirm-password">Confirmar senha</label>}
            {mode === 'register' && <Input className="auth-field h-9 w-full rounded border border-input bg-market-surface px-2.5 text-xs text-foreground shadow-none placeholder:text-market-ink-muted" id="register-confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirmar senha" minLength={8} required aria-invalid={passwordMismatch || undefined} aria-describedby={passwordMismatch ? 'auth-password-error' : undefined} />}
            {passwordMismatch && <p id="auth-password-error" className="form-error m-0 text-xs leading-5 text-market-danger" role="alert">As senhas não coincidem.</p>}
            {apiMessage && <p className="form-error m-0 text-xs leading-5 text-market-danger" role="alert">{apiMessage}</p>}
            <Button className="auth-submit mt-1.5 h-10 rounded bg-primary text-xs font-bold text-market-deep hover:bg-primary disabled:cursor-wait disabled:opacity-65" type="submit" disabled={register.isPending || login.isPending}>{register.isPending ? 'Criando conta…' : login.isPending ? 'Validando…' : mode === 'register' ? 'Criar conta' : 'Entrar'}</Button>
          </form>
        )}

        {!success && <>
          <div className="auth-divider relative my-3.5 mb-2.5 flex justify-center text-xs text-foreground"><span className="relative z-10 bg-market-surface px-2">Ou continue com</span></div>
          <Button className="social-button mb-2 flex h-9 w-full items-center justify-center gap-2 rounded border border-input bg-market-surface text-xs text-market-ink-muted disabled:cursor-not-allowed" type="button" disabled={register.isPending || login.isPending || socialLogin.isPending} onClick={() => socialLogin.mutate('google')}><span className="font-sans text-sm font-bold text-market-success">G</span> {socialLogin.isPending && socialLogin.variables === 'google' ? 'Conectando ao Google…' : 'Continuar com Google'}</Button>
          <Button className="social-button mb-2 flex h-9 w-full items-center justify-center gap-2 rounded border border-input bg-market-surface text-xs text-market-ink-muted disabled:cursor-not-allowed" type="button" disabled={register.isPending || login.isPending || socialLogin.isPending} onClick={() => socialLogin.mutate('facebook')}><span className="font-sans text-base font-bold text-market-social">f</span> {socialLogin.isPending && socialLogin.variables === 'facebook' ? 'Conectando ao Facebook…' : 'Continuar com Facebook'}</Button>
        </>}
      </DialogContent>
      </Dialog>
  )
}
