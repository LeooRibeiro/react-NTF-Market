import { Check, ShieldCheck, User } from 'lucide-react'
import type { CollectorProfile } from '../features/profile/profile-api'

type ProfileAvatarCardProps = {
  profile?: CollectorProfile
  activeAvatar: string
  avatarOptions: string[]
  onAvatarSelect: (avatar: string) => void
}

export function ProfileAvatarCard({
  profile,
  activeAvatar,
  avatarOptions,
  onAvatarSelect,
}: ProfileAvatarCardProps) {
  return (
    <section className="rounded border border-border bg-market-surface p-5 md:col-span-1" aria-label="Avatar do colecionador">
          <h2 className="mb-4 text-sm font-bold text-foreground flex items-center gap-2">
            <User size={16} className="text-market-accent" /> Avatar e Colecionador
          </h2>

          <div className="flex flex-col items-center text-center">
            <div className="relative size-24 overflow-hidden rounded-full border-2 border-primary bg-market-deep p-1">
              <img src={activeAvatar} alt="Avatar selecionado" className="size-full rounded-full object-cover" />
            </div>
            <strong className="mt-3 text-base text-foreground">{profile?.username}</strong>
            <small className="text-xs text-market-ink-muted">{profile?.email}</small>
            <span className="mt-2 inline-flex items-center gap-1 rounded bg-border px-2 py-0.5 text-xs text-market-accent">
              <ShieldCheck size={13} /> Verificado
            </span>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold text-market-ink-muted">Escolha um avatar:</label>
            <div className="grid grid-cols-3 gap-2">
              {avatarOptions.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => onAvatarSelect(src)}
                  className={`relative aspect-square overflow-hidden rounded border p-0.5 transition ${
                    activeAvatar === src ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-market-accent'
                  }`}
                  aria-label="Selecionar avatar"
                >
                  <img src={src} alt="Opção de avatar" className="size-full rounded object-cover" />
                  {activeAvatar === src && (
                    <span className="absolute bottom-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-primary text-market-deep">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
    </section>
  )
}
