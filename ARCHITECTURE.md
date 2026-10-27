# Arquitetura e decisões atuais

Este documento descreve a implementação que existe no repositório. Não significa que todos os requisitos do desafio estejam concluídos; as pendências identificadas estão listadas no final.

## Inicialização e rotas

- `src/main.tsx` cria o `QueryClient`, inicia o worker MSW e monta o React.
- MSW inicia por padrão em navegadores com Service Worker. `VITE_ENABLE_MOCKS=false` impede sua inicialização; não há backend real ou proxy configurado neste projeto.
- `src/router.tsx` declara as rotas `/`, `/nft/$nftId`, `/cart`, `/checkout`, `/orders/$orderId`, `/profile` e `/wallets` e valida os filtros da URL.
- `src/features` agrupa clientes e tipos por domínio. As páginas usam Axios por meio de `src/lib/api.ts` e TanStack Query para consultas e mutations.

## Contratos REST usados pelos mocks

As URLs são relativas à origem da aplicação e são interceptadas pelo MSW.

| Método e caminho | Responsabilidade |
| --- | --- |
| `GET /api/nfts` | Lista, busca, filtra, ordena e pagina NFTs. |
| `GET /api/nfts/:nftId` | Consulta detalhes de um NFT. |
| `GET /api/auth/session` | Recupera a sessão mock atual. |
| `POST /api/auth/login` | Login por e-mail e senha. |
| `POST /api/auth/social` | Simulação de login Google/Facebook. |
| `POST /api/auth/register` | Cadastro com conflito de e-mail. |
| `POST /api/auth/logout` | Remove a sessão atual. |
| `GET /api/favorites` | Consulta favoritos da identidade atual. |
| `POST /api/favorites` | Inclui um NFT nos favoritos. |
| `DELETE /api/favorites/:nftId` | Remove um NFT dos favoritos. |
| `GET /api/cart` | Consulta itens do carrinho. |
| `POST /api/cart/items` | Adiciona item e quantidade. |
| `PATCH /api/cart/items/:nftId` | Altera quantidade. |
| `DELETE /api/cart/items/:nftId` | Remove item. |
| `POST /api/cart/quote` | Valida cupom e calcula subtotal, desconto, taxa e total. |
| `POST /api/orders` | Cria ou recupera pedido via `Idempotency-Key`. |
| `GET /api/orders/:orderId` | Recupera estado e snapshot do recibo. |
| `GET /api/profile`, `PATCH /api/profile` | Consulta e atualiza o perfil. |
| `POST /api/profile/password` | Valida e altera senha simulada. |
| `GET/POST /api/wallets`, `PATCH/DELETE /api/wallets/:walletId` | Consulta e gerencia carteiras. |
| `POST /api/dev/reset` | Limpa parte dos dados mock e restaura o catálogo. |

Os contratos TypeScript dos dados que a interface consome ficam em `src/features/*/*-api.ts`; os handlers e os dados compartilhados ficam em `src/mocks/`.

## Dados locais e sessão

O mock usa `localStorage` para sustentar recargas. As chaves principais são declaradas em `src/mocks/mock-data.ts`: contas, sessão, carrinho, pedidos, idempotência, favoritos, carteiras e perfis. Favoritos e perfis são indexados pelo identificador da conta. Hoje, carrinho e carteiras usam uma chave global, compartilhada ao trocar de usuário. Algumas consultas privadas também usam chaves TanStack Query globais, sem identidade de usuário.

A conta de demonstração é fixa (`demo@kurio.art` / `KurioPass123`). Senhas de contas cadastradas são comparadas por hash SHA-256 no mock local. Isso serve para a simulação no navegador; não substitui autenticação, armazenamento de senha ou sessão seguros de produção. A sessão não tem prazo de expiração reproduzível atualmente.

O endpoint de reset restaura catálogo, carrinho, cupom, pedidos, idempotência, favoritos, carteiras e perfis. Ele mantém a sessão e contas cadastradas. Portanto, o reset atual não retorna todo o navegador a um estado inicial completamente limpo.

## Carrinho, cotação e pedidos

- Os valores ETH são strings decimais na API. A cotação mock usa unidades inteiras de seis casas decimais para calcular subtotal, desconto, taxa e total.
- O frontend envia os itens selecionados, carteira, cenário de pagamento e chave `Idempotency-Key` ao criar um pedido.
- O mock guarda a chave junto a uma representação do corpo e do pedido: a mesma chave e o mesmo conteúdo recuperam o pedido; a mesma chave com conteúdo diferente retorna conflito.
- No cenário de timeout, o mock persiste o pedido pendente antes de devolver erro de conexão. O checkout guarda a tentativa e pode reenviá-la para recuperar o mesmo pedido.
- O pedido contém um snapshot de itens, quantidades, valores e total. A página de pedido consulta o snapshot e atualiza estados pendentes via REST/evento.
- O helper de mock `updateOrderStatus` recusa transições após `confirmed` ou `declined`. Ao confirmar uma pendência, atualiza o carrinho e a disponibilidade dos itens.

## Socket.IO e cache

O `socket.io-client` conecta à origem da aplicação. `src/mocks/socket-handlers.ts` intercepta a conexão WebSocket com MSW e `@mswjs/socket.io-binding`; assim, os cenários locais usam o cliente Socket.IO real sem servidor externo.

| Evento | Campos usados | Efeito no cliente |
| --- | --- | --- |
| `nft.updated` | `id`, `price`, `version`, `available` opcional | Atualiza detalhe, catálogo e carrinho; se o item estiver no carrinho, registra aviso e invalida a cotação. |
| `order.updated` | `id`, `status`, `version`, `transactionId` | Atualiza pedido e invalida o carrinho após confirmação. |

`src/lib/socket.ts` mantém um rastreador de versão por recurso para descartar duplicatas e eventos mais antigos. `src/features/realtime/use-realtime-sync.ts` registra e remove listeners no ciclo de vida do React e invalida recursos após reconexão. Os helpers disponíveis no console do navegador são `__kurioUpdateNftPrice`, `__kurioUpdateNftAvailability`, `__kurioUpdateOrderStatus`, `__kurioBroadcastSocket` e `__kurioResetData`.

O binding simula o transporte WebSocket compatível com Socket.IO por meio do worker MSW. Latência configurável, interrupções reproduzíveis em qualquer etapa e reconciliação completa de todos os recursos após reconexão ainda precisam de cobertura adicional.

## Estratégia de cache atual

As páginas consultam TanStack Query com chaves como `['catalog', filtros]`, `['nft', id]`, `['cart']`, `['profile']`, `['wallets']`, `['session']` e `['order', id]`. Filtros do catálogo integram a chave e também aparecem na URL. Mutations invalidam ou atualizam as consultas relacionadas; eventos Socket.IO ajustam o cache em `src/features/realtime/realtime-cache.ts`.

**Limitação conhecida:** cache e persistência não são particionados pela identidade da sessão em todos os domínios. O logout atual atualiza `['session']`, sem remover todas as consultas privadas nem limpar subscriptions/dados relacionados. A separação completa por usuário é uma prioridade pendente antes de tratar o mock como adequado a alternância de contas.

## Comandos e validação

Os comandos presentes no `package.json` são `npm run dev`, `npm run typecheck`, `npm run build`, `npm run preview` e `npm run test:e2e`. A configuração Playwright aponta para `tests/e2e`, inicia o servidor local na porta 4183 e usa Chromium via canal Microsoft Edge. Não há script de lint, script Lighthouse, configuração de baselines visuais nem relatórios Lighthouse versionados. Consulte o README para instalação, credenciais, comandos de auditoria e cenários manuais.

## Pendências observadas

1. Isolar carrinho, carteiras, perfil e cache privado por usuário; limpar dados e listeners ao sair ou trocar de sessão.
2. Implementar expiração de sessão determinística, incluindo retomada no checkout.
3. Configurar cenários determinísticos de latência variável, resposta fora de ordem, HTTP 4xx/5xx e indisponibilidade de conexão, com reset integral.
4. Completar e executar a matriz E2E descrita no README, incluindo troca de usuário, pagamentos falhos/timeout, eventos duplicados/antigos e retomada pendente.
5. Executar e versionar auditorias Lighthouse e regressões visuais; registrar ambiente e resultados reais.
6. Completar validação manual de acessibilidade e responsividade nos viewports exigidos.
7. Publicar o deploy e validar as rotas diretas/refresh após a publicação.

Esta lista é uma auditoria estática; nenhum teste, build, typecheck, Lighthouse ou inspeção de tela foi executado ao escrever este documento.
