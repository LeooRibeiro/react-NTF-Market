import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

/** Exibe carrinho ou pagamento num painel modal sob o menu, fechando de volta ao catálogo. */
export function CartCheckoutModal({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const close = () => void navigate({ to: '/', search: (previous) => ({
    q: previous.q ?? '', category: previous.category ?? 'Todas', sort: previous.sort ?? 'recent',
    page: previous.page ?? 1, minPrice: previous.minPrice ?? 0, maxPrice: previous.maxPrice ?? 12.3,
    network: previous.network ?? 'Todas',
  }) })

  return <Sheet open onOpenChange={(open) => { if (!open) close() }}>
    <SheetContent side="top" showCloseButton={false} className="cart-checkout-sheet" aria-describedby="cart-checkout-modal-description">
      <div className="cart-modal-header">
        <div><span>KURIO · MARKETPLACE</span><SheetTitle>{title}</SheetTitle></div>
        <Button variant="ghost" type="button" aria-label="Fechar carrinho e pagamento" onClick={close}><X size={18} /></Button>
      </div>
      <SheetDescription id="cart-checkout-modal-description" className="sr-only">Painel de carrinho e finalização da compra.</SheetDescription>
      {children}
    </SheetContent>
  </Sheet>
}
