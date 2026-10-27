import { Search, ShoppingBag, UserRound } from 'lucide-react'

export function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Jungle Market, página inicial"><span className="brand-mark">J</span><span>NTF<span className="brand-light">MARKET</span></span></a>
        <nav className="desktop-nav" aria-label="Navegação principal"><a className="active" href="#discover">Explorar</a><a href="#collections">Coleções</a><a href="#artists">Artistas</a></nav>
        <div className="header-actions"><button className="icon-button" aria-label="Buscar"><Search size={19}/></button><button className="icon-button" aria-label="Carrinho"><ShoppingBag size={19}/></button><button className="profile-button"><UserRound size={17}/><span>Entrar</span></button></div>
      </header>

      <section className="hero" id="discover">
        <div className="hero-copy"><p className="eyebrow"><span className="live-dot"/> MARKETPLACE DE NFTs</p><h1>Encontre sua próxima <span>peça única.</span></h1><p className="hero-subtitle">Explore arte digital criada por artistas independentes e encontre algo que fale com você.</p><a className="primary-button" href="#catalog">Explorar coleção <span aria-hidden="true">↗</span></a></div>
        <div className="hero-art" role="img" aria-label="Arte digital abstrata em destaque"><div className="art-glow"/><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core">J</div><div className="art-caption"><span>FEATURED DROP</span><strong>Genesis / 001</strong></div></div>
      </section>

      <section className="catalog" id="catalog"><div className="section-heading"><div><p className="eyebrow">CURADORIA JUNGLE</p><h2>Explore o marketplace</h2></div><a className="text-link" href="#catalog">Ver tudo <span>↗</span></a></div>
        <div className="catalog-toolbar"><label className="search-field"><Search size={18}/><input aria-label="Buscar NFTs" placeholder="Buscar NFTs, coleções ou artistas"/></label><button className="filter-button">Todas as categorias <span>⌄</span></button><button className="filter-button sort-button">Mais recentes <span>⌄</span></button></div>
        <div className="empty-stage"><div className="empty-symbol">✳</div><p>O catálogo está sendo preparado.</p><span>Em breve, novas peças para descobrir.</span></div>
      </section>
      <footer className="footer"><span>© 2026 Jungle Market</span><span>Feito para descobrir o extraordinário.</span></footer>
    </main>
  )
}
