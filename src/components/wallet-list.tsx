import { Star, Trash2, Wallet as WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Wallet } from '../features/wallets/wallets-api'

type WalletListProps = {
  wallets: Wallet[]
  isLoading: boolean
  isUpdating: boolean
  isDeleting: boolean
  onSetPrimary: (walletId: string) => void
  onDelete: (walletId: string) => void
}

export function WalletList({
  wallets,
  isLoading,
  isUpdating,
  isDeleting,
  onSetPrimary,
  onDelete,
}: WalletListProps) {
  return (
    <section className="space-y-3 md:col-span-2" aria-label="Carteiras cadastradas">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <WalletIcon size={16} className="text-market-accent" /> Carteiras Vinculadas ({wallets.length})
          </h2>

          {isLoading ? (
            <div className="rounded border border-border bg-market-surface p-6 text-center text-xs text-market-ink-muted">
              Carregando carteiras…
            </div>
          ) : wallets.length === 0 ? (
            <div className="rounded border border-border bg-market-surface p-6 text-center text-xs text-market-ink-muted">
              Nenhuma carteira cadastrada. Adicione sua primeira carteira ao lado.
            </div>
          ) : (
            <div className="grid gap-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded border p-4 transition ${
                    wallet.primary
                      ? 'border-primary bg-market-surface'
                      : 'border-border bg-market-surface/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded bg-market-deep text-market-accent">
                      <WalletIcon size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-foreground">{wallet.name}</strong>
                        {wallet.primary && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-2xs font-bold text-market-accent">
                            <Star size={10} fill="currentColor" /> PRINCIPAL
                          </span>
                        )}
                      </div>
                      <small className="block text-xs font-mono text-market-ink-muted">{wallet.address}</small>
                      <span className="text-2xs text-market-dim">Rede: {wallet.network}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!wallet.primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => onSetPrimary(wallet.id)}
                        className="h-7 text-xs border-border hover:border-primary"
                      >
                        Definir como Principal
                      </Button>
                    )}
                    {!wallet.primary && (
                      <button
                        type="button"
                        aria-label={`Remover carteira ${wallet.name}`}
                        disabled={isDeleting}
                        onClick={() => onDelete(wallet.id)}
                        className="grid size-7 place-items-center rounded text-market-ink-muted hover:bg-market-danger/20 hover:text-market-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
    </section>
  )
}
