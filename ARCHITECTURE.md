# Arquitetura e decisões da implementação

## Inicialização e rotas

`src/main.tsx` inicia o worker MSW antes de montar React. Os mocks ficam ativos por padrão; `VITE_ENABLE_MOCKS=false` desativa o worker e exige uma API compatível em `/api`. O `.env.example` registra a configuração da demonstração. O roteador está em `src/router.tsx`; páginas usam TanStack Query e Axios por meio de clientes por domínio em `src/features/`.

## Deploy

A aplicação está publicada em [react-ntf-market-iota.vercel.app](https://react-ntf-market-iota.vercel.app/). O build Vite gera `dist/` com `npm run build`; nenhuma variável secreta é necessária e `VITE_ENABLE_MOCKS` deve permanecer `true` ou não definida para manter os fluxos demonstrativos. `vercel.json` reescreve as rotas da SPA para `index.html`, permitindo deep links e refresh em rotas do TanStack Router. A versão implantada precisa ser atualizada após mudanças nessa configuração. Os mocks e fixtures são entregues no bundle do navegador e continuam independentes de backend privado.

## Contratos REST simulados

| Método e caminho | Responsabilidade |
| --- | --- |
| `GET /api/nfts`, `GET /api/nfts/:nftId` | Catálogo e detalhe, com busca, filtros, ordenação e paginação. |
| `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/social`, `POST /api/auth/register`, `POST /api/auth/logout` | Sessão, login, login social, cadastro e logout. Sessão anônima retorna `200 null`; credenciais inválidas e recursos protegidos retornam erros HTTP. |
| `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:nftId` | Favoritos da conta atual. |
| `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:nftId`, `DELETE /api/cart/items/:nftId`, `POST /api/cart/quote` | Carrinho, quantidades, remoção, cupom, disponibilidade e cotação. |
| `POST /api/orders`, `GET /api/orders/:orderId` | Criação idempotente e recuperação do pedido/recibo. |
| `GET/PATCH /api/profile`, `POST /api/profile/password` | Perfil e senha. |
| `GET/POST /api/wallets`, `PATCH/DELETE /api/wallets/:walletId` | Carteiras da conta. |
| `POST /api/dev/reset` | Reset integral dos dados e cenários de demonstração. |

Os contratos consumidos pela interface ficam em `src/features/*/*-api.ts`; handlers e fixtures ficam em `src/mocks/`. Valores ETH são strings decimais e os cálculos usam unidades inteiras de seis casas. Pedido armazena snapshot de preço, quantidade, taxas e total.

## Sessão e persistência

A sessão mock persiste por uma hora e contém apenas identidade, e-mail e expiração. A senha de contas cadastradas é comparada por SHA-256 no mock local; isso não substitui armazenamento seguro de produção. O usuário demo é uma fixture fixa (`demo@kurio.art` / `KurioPass123`). Login social usa identidades separadas.

Carrinho e cupom usam chaves locais por conta; visitante usa uma partição `guest`. Ao autenticar, itens de visitante são mesclados à conta sem exceder cinco unidades por NFT e o cupom é migrado se não houver um já salvo para a conta. Carteiras também usam chave por conta. Favoritos e perfis são indexados pelo ID; pedidos e chaves de idempotência têm partição por conta.

`__kurioExpireSession()` marca a sessão como expirada e dispara o evento `kurio:session-expired`. Respostas 401 de endpoints privados acionam o mesmo tratamento no cliente Axios. A retomada após login mantém a rota de checkout e o carrinho. Logout ou troca de identidade remove consultas privadas, avisos de preço e versões de eventos da conta anterior. A consulta de sessão é revalidada a cada 30 segundos durante sessão ativa e ao voltar o foco para a janela.

`__kurioResetData()` e `POST /api/dev/reset` removem todas as chaves `kurio-*`, limpam `sessionStorage`, zeram cenários de rede e versões de eventos e restauram o catálogo original. O usuário demo permanece disponível como fixture do handler.

## Carrinho, cotação e pedidos

O serviço de cotação recalcula os valores antes da compra. Alteração de preço ou disponibilidade invalida a cotação e exige confirmação explícita. A mutation de pedido envia `Idempotency-Key`; mesma chave e mesmo corpo recuperam o mesmo pedido, enquanto conteúdo diferente causa conflito. O cenário de timeout grava o pedido pendente antes de simular perda de conexão. Após confirmação, só os itens e quantidades comprados saem do carrinho; recusa e timeout preservam os itens. Estados `confirmed` e `declined` são terminais.

## MSW e cenários de rede

`src/mocks/network-scenarios.ts` fornece atraso variável (280, 35 e 140 ms), atraso via `?__delay=`, catálogo vazio e fila de falhas HTTP ou de rede por rota. Os helpers são `__kurioConfigureNetwork`, `__kurioQueueNetworkFailure` e `__kurioResetNetwork`. Os handlers de catálogo, cotação e pedidos consomem os cenários; timeout de pedido continua sendo controlado pelo próprio formulário.

## Socket.IO e cache

A interface usa `socket.io-client` com transporte WebSocket. O import do cliente é dinâmico e ocorre depois do start do MSW, para que o Engine.IO capture o WebSocket interceptado. `src/mocks/socket-handlers.ts` registra `ws.link` com `@mswjs/socket.io-binding`; helpers de mock alteram o estado compartilhado e publicam eventos por esse binding, não por callbacks da interface.

| Evento | Identidade e versão | Efeito |
| --- | --- | --- |
| `nft.updated` | `id`, `version`, preço e disponibilidade opcional | Atualiza consultas ativas; se o NFT estiver no carrinho, alerta e invalida a cotação. |
| `order.updated` | `id`, `accountId`, `status`, `version`, transação opcional | Atualiza o pedido da conta ativa e invalida carrinho após confirmação. |

`src/lib/socket.ts` descarta versões repetidas ou antigas por recurso. O hook `src/features/realtime/use-realtime-sync.ts` registra e limpa listeners, filtra eventos de pedidos por conta e invalida catálogo, carrinho, carteiras e pedidos após reconexão. Após refresh, a página de pedido reconcilia o estado via REST.

A conexão Socket.IO é validada pelo cenário E2E no Edge: o teste altera o preço durante o checkout, recebe o aviso de cotação atualizada, exige nova confirmação e verifica o total final. O setup normaliza um descriptor WebSocket específico do host antes de habilitar o worker MSW.

## Cache

Catálogo usa `['catalog', parâmetros]`; detalhe usa `['nft', id]`; consultas privadas mantêm chaves por domínio e são removidas ao mudar a sessão. Mutations invalidam os recursos relacionados; favoritos aplica atualização otimista e rollback. A configuração global do QueryClient usa `staleTime` de 30 segundos e uma tentativa de retry para consultas. Busca e filtros integram o estado da URL e a chave da consulta.

## Responsividade e acessibilidade

No início mobile a busca/filtros ficam no topo, o destaque mantém texto e arte lado a lado, as categorias rolam horizontalmente, o catálogo fica em duas colunas e há navegação inferior. Carrinho/checkout ocupam a tela inteira no mobile. A confirmação usa cartão de recibo com metadados e itens do snapshot, refluindo para grade/linhas compactas no celular. A página aceita viewport de 320 px e dialogs rolam dentro da altura disponível para conservar conteúdo com zoom. Imagens e fontes usadas pela interface vêm de `public/assets` ou da pilha local de fontes. Conforme solicitado para a entrega, `cosmic-bloom.png` foi removida e suas referências passaram a usar `golden-beat.png`.

Controles nativos e customizados exibem foco visível; drawers e dialogs são Radix Dialogs com contenção/restauração de foco e fechamento por Escape. Há link para pular ao conteúdo, filtros e avatares expõem seleção como pressed, e as abas do detalhe usam setas/Home/End com `tablist`/`tabpanel`. Labels nomeiam campos, erros de senha/cupom/login são associados por `aria-describedby`, e feedbacks de mutations/cotação usam regiões status ou alert. Estados selecionados incluem também semântica e marcas visuais além da cor.

Desvios visuais do Figma incluem o contorno de foco, o marcador de filtro selecionado, a largura mínima de 320 px, os overlays roláveis e a troca do link externo do explorador por cópia do ID simulado. A paleta, imagens e tipografia local foram mantidas.

## Validação e limitações

- `npm run typecheck`, `npm run lint` e `npm run build` foram executados após as mudanças de implementação.
- Playwright usa Chromium pelo canal Microsoft Edge, um worker, trace em falha e relatório HTML. A execução final em 28/10/2026 teve 25 testes aprovados; snapshots desktop/mobile estão versionados em `tests/e2e/visual.spec.ts-snapshots/`.
- `lighthouse-audit.json` fixa versão, páginas, perfis, metas e métricas. `scripts/audit-lighthouse.ps1` grava os relatórios individuais e as medianas em `lighthouse-reports/`; atualize o build/auditoria após qualquer mudança final de UI.
- A auditoria final registrou Performance mobile 96 na home e 90 no detalhe (meta mínima 90), Accessibility 100, Best Practices 96 e SEO 100 nas duas rotas. O CLS da home caiu de 0,325 para 0 ao reservar o espaço da imagem do hero. O detalhe mantém LCP mediano de 3,5 s: o relatório mostra que a imagem principal não é descoberta no HTML inicial, pois os dados do NFT são carregados no cliente antes da renderização. O detalhe também reporta 134 KiB de JavaScript não utilizado; divisão adicional de rotas/runtime pode reduzir esse custo.
- A primeira URL publicada respondia à home, mas as rotas internas `/cart` e `/nft/neon-vessel-552` retornavam 404 ao acesso direto. `vercel.json` foi adicionado para reescrever caminhos da SPA para `index.html`; após o próximo deploy, confirme essas rotas e refresh no domínio publicado.
