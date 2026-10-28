import { useState, type FormEvent } from 'react'
import { ArrowRight, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const catalogSearch = {
  q: '',
  category: 'Todas',
  sort: 'recent' as const,
  page: 1,
  minPrice: 0,
  maxPrice: 12.3,
  network: 'Todas',
}

const articles = [
  {
    image: '/assets/neon-vessel.png',
    date: '12 de setembro',
    readingTime: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    image: '/assets/emerald-ape.png',
    date: '13 de setembro',
    readingTime: '2 min',
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    image: '/assets/sage-nomad.png',
    date: '15 de setembro',
    readingTime: '3 min',
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    image: '/assets/golden-beat.png',
    date: '15 de setembro',
    readingTime: '2 min',
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

const benefits = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de lançamentos de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

function FeaturedBanners() {
  return (
    <section className="grid gap-5 md:grid-cols-2" id="creators" aria-label="Destaques da Kurio">
      <article className="grid min-h-48 grid-cols-2 overflow-hidden rounded-lg bg-market-surface">
        <img className="size-full min-h-48 object-cover" src="/assets/emerald-ape.png" alt="Colecionável digital Emerald Ape" />
        <div className="flex flex-col items-end justify-center p-5 text-right">
          <h2 className="text-xl font-bold max-w-60%">Lançamentos gênesis de edição limitada</h2>
          <p className="mt-2 text-md max-w-60% leading-relaxed text-market-ink-muted">Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
          <a className="mt-3 max-w-30 inline-flex items-center justify-center gap-1 rounded bg-primary px-4 py-2 text-xs font-bold text-market-deep" href="#catalog">Explorar <ArrowRight size={14} /></a>
        </div>
      </article>

      <article className="grid min-h-48 grid-cols-2 overflow-hidden rounded-lg bg-market-surface">
        <img className="size-full min-h-48 object-cover" src="/assets/neon-vessel.png" alt="Arte digital Neon Vessel" />
        <div className="flex flex-col items-end justify-center p-5 text-right">
          <h2 className="text-xl font-bold max-w-60%">Arte digital selecionada e muito mais</h2>
          <p className="mt-2 text-md max-w-60% leading-relaxed text-market-ink-muted">Explore novos artistas, coleções verificadas e obras digitais que definem o futuro.</p>
          <a className="mt-3 max-w-30 inline-flex items-center justify-center gap-1 rounded bg-primary px-4 py-2 text-xs font-bold text-market-deep" href="#catalog">Explorar <ArrowRight size={14} /></a>
        </div>
      </article>
    </section>
  )
}

function MintJournal() {
  return (
    <section className="py-16" id="learn" aria-labelledby="mint-journal-title">
      <div className="mb-7 text-center">
        <h2 className="text-4xl font-bold" id="mint-journal-title">Diário da Cunhagem</h2>
        <p className="mt-2 text-lg text-market-ink-muted">Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <article className="overflow-hidden rounded-md bg-market-surface" key={article.title}>
            <img className="aspect-[4/3] w-full object-cover" src={article.image} alt="" loading="lazy" />
            <div className="p-3">
              <p className="text-[10px] text-market-ink-muted">{article.date} <span className="px-1.5">|</span> Leitura de {article.readingTime}</p>
              <h3 className="mt-2 text-sm font-bold leading-snug">{article.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-market-ink-muted">{article.description}</p>
              <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary" href="#learn">Ler mais <ArrowRight size={12} /></a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function NewsletterSignup() {
  const [subscribed, setSubscribed] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubscribed(true)
  }

  return (
    <form className="min-w-0" onSubmit={handleSubmit}>
      <label className="mb-2 block text-sm font-bold" htmlFor="newsletter-email">Antecipe-se ao próximo lançamento</label>
      <div className="newsletter-fields flex overflow-hidden rounded border border-border">
        <input
          className="min-w-0 flex-1 bg-market-deep px-3 py-2 text-xs text-foreground placeholder:text-market-ink-muted"
          id="newsletter-email"
          type="email"
          placeholder="Digite seu e-mail..."
          required
          onChange={() => setSubscribed(false)}
        />
        <button className="bg-primary px-3 text-xs font-bold text-market-deep" type="submit">Enviar</button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-market-ink-muted" role={subscribed ? 'status' : undefined}>
        {subscribed
          ? 'Inscrição recebida! Você verá novidades da Kurio por aqui.'
          : 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </form>
  )
}

function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-market-surface font-mono" id="site-footer">
      <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-4 xl:p-9">
        {benefits.map(({ mark, title, description }) => (
          <section className="flex gap-3 border-b border-border pb-5 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5" key={title}>
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-market-deep">{mark}</span>
            <div>
              <h2 className="text-sm font-bold">{title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-market-ink-muted">{description}</p>
            </div>
          </section>
        ))}
        <NewsletterSignup />
      </div>

      <div className="grid gap-4 bg-[#402713] px-6 py-4 text-xs md:grid-cols-4 md:items-center xl:px-8">
        <strong className="tracking-widest">KURIO</strong>
        <p className="m-0 max-w-50">Feito para colecionadores, criadores e cultura.</p>
        <a href="mailto:contato@email.com">contato@email.com</a>
        <a href="tel:+551140028922">+55 11 4002 8922</a>
      </div>

      <div className="grid gap-7 p-6 sm:grid-cols-2 xl:grid-cols-4 xl:px-8 xl:py-7">
        <FooterLinkGroup title="Meu perfil" links={[
          { label: 'Meu perfil', to: '/profile' },
          { label: 'Minha coleção', to: '/profile' },
          { label: 'Atividade', to: '/profile' },
          { label: 'Estúdio do criador', to: '/profile' },
          { label: 'Lista de interesse', to: '/profile' },
        ]} />
        <FooterLinkGroup title="Central de ajuda" links={[
          { label: 'Central de ajuda', to: '#learn' },
          { label: 'Como comprar NFTs', to: '#learn' },
          { label: 'Carteira e segurança', to: '#learn' },
          { label: 'Política do mercado', to: '#learn' },
          { label: 'Denunciar item', to: '#catalog' },
        ]} />
        <FooterLinkGroup title="Coleções" links={[
          { label: 'Arte digital', to: '#catalog' },
          { label: 'Fotografia', to: '#catalog' },
          { label: 'Música', to: '#catalog' },
          { label: 'Arte 3D', to: '#catalog' },
          { label: 'Utilidade', to: '#catalog' },
        ]} />
        <section>
          <h2 className="text-sm font-bold">Redes sociais</h2>
          <div className="mt-3 flex gap-2" aria-label="Redes sociais da Kurio">
            {[Instagram, Twitter, Linkedin, Youtube].map((Icon, index) => (
              <span className="grid size-7 place-items-center rounded border border-primary text-primary" key={index}><Icon size={14} /></span>
            ))}
            <span className="grid size-7 place-items-center rounded border border-primary text-sm font-bold text-primary" aria-label="Facebook">f</span>
          </div>
          <h3 className="mb-2 mt-5 text-sm font-bold">Carteiras compatíveis</h3>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-semibold text-market-ink-muted">
            <span className="rounded border border-border px-2 py-1">METAMASK</span>
            <span className="rounded border border-border px-2 py-1">WALLETCONNECT</span>
            <span className="rounded border border-border px-2 py-1">COINBASE</span>
          </div>
        </section>
      </div>

      <p className="border-t border-border px-4 py-3 text-center text-[10px] text-market-ink-muted">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}

type FooterLink = { label: string; to: '/profile' | '#learn' | '#catalog' }

function FooterLinkGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <section>
      <h2 className="text-sm font-bold">{title}</h2>
      <ul className="mt-2 grid gap-2 text-xs text-market-ink-muted">
        {links.map(({ label, to }) => (
          <li key={label}>
            {to === '/profile'
              ? <Link to={to} search={catalogSearch}>{label}</Link>
              : <a href={to}>{label}</a>}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function MarketplaceBelowSections() {
  return (
    <div className="mt-8">
      <FeaturedBanners />
      <MintJournal />
      <SiteFooter />
    </div>
  )
}
