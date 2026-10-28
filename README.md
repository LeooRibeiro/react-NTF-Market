# Desafio Frontend — Marketplace de NFTs

Implemente o **NFT Marketplace** em React e TypeScript, seguindo o [layout no Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

O desafio avalia fidelidade visual, qualidade das interações, integração com APIs, gerenciamento de estado assíncrono, tempo real, acessibilidade e performance.

> Este README mantém a especificação original do desafio como referência. A seção [Estado da implementação](#estado-da-implementação) registra as entregas confirmadas e as pendências; os requisitos da especificação não devem ser interpretados como funcionalidades já concluídas.

## Execução local

### Requisitos e instalação

- Node.js e npm compatíveis com as versões declaradas pelo Vite 7.
- Para os testes E2E, Microsoft Edge instalado. O Playwright usa o projeto Chromium pelo canal `msedge`.

```bash
npm ci
npm run dev
```

O Vite informa a URL local ao iniciar. Os mocks MSW são ativados por padrão antes da montagem da aplicação. Não há API externa necessária para navegar pelos fluxos simulados.

### Credenciais fictícias

- E-mail: `demo@kurio.art`
- Senha: `KurioPass123`

O login social também é simulado. Essas credenciais e os dados salvos no navegador são apenas para demonstração local.

### Variáveis de ambiente

Não há variável obrigatória para executar o projeto. `VITE_ENABLE_MOCKS` é opcional e permanece ativada quando não está definida. Defina `VITE_ENABLE_MOCKS=false` somente se existir uma API compatível em `/api`; este repositório não configura um backend real nem um proxy para ele.

### Comandos disponíveis

| Objetivo | Comando | Observação |
| --- | --- | --- |
| Desenvolvimento com MSW | `npm run dev` | Os mocks iniciam por padrão. |
| Verificação de tipos | `npm run typecheck` | Executa `tsc -b --pretty`. |
| Build de produção | `npm run build` | Executa typecheck do build e `vite build`. |
| Preview local do build | `npm run preview -- --host 127.0.0.1 --port 4173` | Execute após o build. |
| Lint | `npm run lint` | ESLint flat config, TypeScript e regras de hooks React. |
| Testes E2E | `npm run test:e2e` | Playwright, Chromium pelo canal Edge; requer navegador instalado. |
| Instalar navegador E2E | `npx playwright install msedge` | Baixa o navegador usado pela configuração atual. |
| Auditoria Lighthouse | `npm run audit:lighthouse` | Roda 12 auditorias e grava HTML, JSON e medianas em `lighthouse-reports/`. |

### Cenários manuais com os mocks

1. Entre com as credenciais de demonstração e navegue pelo catálogo, detalhe e carrinho.
2. No checkout, selecione o resultado de pagamento desejado. O cenário de timeout cria o pedido e simula uma resposta de rede perdida; use **Recuperar tentativa** para repetir com a mesma chave de idempotência.
3. Para observar eventos em tempo real, abra o console do navegador na aplicação e execute, por exemplo:

```js
__kurioUpdateNftPrice('neon-vessel-552', '2.49')
__kurioUpdateNftAvailability('neon-vessel-552', false)
__kurioUpdateOrderStatus('ID_DO_PEDIDO', 'confirmed')
```

Os helpers estão disponíveis quando o worker MSW inicia. `__kurioResetData()` limpa sessão, contas cadastradas, carrinhos, cupons, pedidos, favoritos, carteiras e perfis; restaura o catálogo e zera os cenários de rede. O usuário demo continua disponível como fixture fixa.

Para reproduzir condições de rede no console:

```js
__kurioConfigureNetwork({ variableLatency: true })
__kurioConfigureNetwork({ latencySequence: [800, 35, 140] })
__kurioQueueNetworkFailure('GET /api/nfts', { kind: 'http', status: 503 }, 2)
__kurioQueueNetworkFailure('POST /api/orders', { kind: 'network' })
__kurioConfigureNetwork({ emptyCatalog: true })
__kurioResetNetwork()
```

Latência variável alterna 280, 35 e 140 ms para permitir respostas fora de ordem. `latencySequence` aceita outra sequência por rota, por exemplo `[800, 35, 140]`. Também é possível usar `?__delay=1200` para definir o atraso de uma requisição. Os helpers `__kurioExpireSession()` e `__kurioResetNetwork()` controlam a sessão e os cenários.

### Auditoria Lighthouse

A auditoria deve usar o build de produção em preview, não o servidor de desenvolvimento. O Lighthouse não é dependência do projeto; `npx` o executa sem adicioná-lo ao `package.json` ou ao lockfile.

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Em outro terminal PowerShell, execute a matriz mobile/desktop de início e detalhe, três vezes cada:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-lighthouse.ps1
```

O script usa a versão fixa em `lighthouse-audit.json`, escolhe Edge/Chrome instalado ou aceita `-ChromePath`, e grava os 24 relatórios HTML/JSON e o resumo com medianas em `lighthouse-reports/`. Consulte [os resultados e as limitações observadas](./lighthouse-reports/README.md). Os números representam este ambiente e o cenário padrão dos mocks.

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos REST, sessão, persistência, cache, eventos Socket.IO e limitações conhecidas.

## 1. Escopo

Entregue os fluxos de descoberta, compra e conta do colecionador, com versões desktop e mobile. APIs, autenticação, carteiras e pagamentos devem funcionar com dados simulados. Integrações reais com blockchain, extensões de carteira e gateways de pagamento estão fora do escopo.

O Figma define a identidade visual e a composição das telas. Este enunciado define os comportamentos e os cenários de avaliação. Estados não desenhados devem seguir o mesmo padrão visual.

## 2. Stack obrigatória

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React |
| Linguagem | TypeScript |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Integração de dados | REST APIs |
| Tempo real | Socket.IO |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui |
| Mocking | MSW |
| Testes E2E e regressão visual | Playwright |
| Auditoria de performance e qualidade | Lighthouse |

As tecnologias devem participar efetivamente da solução. A ferramenta de build, a organização do projeto e as bibliotecas complementares ficam a critério do candidato.

## 3. Telas e fluxos

| Tela | Funcionalidades obrigatórias |
| --- | --- |
| Início | Destaques, catálogo, busca, filtros, ordenação e navegação para o NFT |
| Detalhes do NFT | Galeria, informações, edição, quantidade, favoritos e compra |
| Carrinho de NFTs | Edição de quantidades, remoção, cupom e resumo de valores |
| Pagamento | Dados do colecionador, seleção de carteira e rede, revisão e envio do pedido |
| Confirmação de pedido | Resultado, identificação da transação, itens, taxas e total |
| Login | Autenticação, validação e retorno ao fluxo anterior |
| Cadastro | Criação de conta, validação e tratamento de conflito |
| Perfil do colecionador | Edição dos dados, avatar e alteração de senha |
| Carteiras | Cadastro e edição de carteiras principal e secundária |

Implemente os frames desktop e mobile disponíveis. Perfil, carteiras e confirmação também devem funcionar em mobile, mesmo sem um frame específico.

Páginas editoriais, suporte, atividade, ofertas e downloads não fazem parte da entrega. Links externos e ações auxiliares devem ter comportamento coerente; ações fora do escopo não devem aparentar sucesso funcional.

### Catálogo e detalhe

- Busca, filtros, ordenação e paginação devem compor o estado da URL e sobreviver a refresh e navegação pelo histórico.
- Filtros devem ser combináveis; mudança de filtro deve reiniciar a paginação.
- As consultas devem refletir os parâmetros enviados à API, com tratamento de resultados vazios, falhas e respostas fora de ordem.
- O detalhe deve suportar acesso direto, NFT inexistente, edição indisponível e limite de quantidade.
- Favoritos devem persistir para o usuário autenticado.

### Carrinho

- Adicionar, alterar e remover itens, respeitando a disponibilidade por NFT e edição.
- Manter o carrinho após refresh e preservar os itens do visitante ao autenticar.
- Aplicar e remover cupom, com tratamento de código inválido ou expirado.
- Exibir subtotal, desconto, taxa de rede e total coerentes com a resposta da API.
- Refletir alterações de preço e disponibilidade recebidas enquanto o carrinho estiver aberto.

Valores em ETH devem trafegar como strings decimais e manter precisão nos cálculos e na apresentação. Quantidades são inteiras. A cotação da API é a referência para finalizar o pedido.

### Pagamento e confirmação

- Validar os campos do layout e permitir revisão antes do envio.
- Utilizar as carteiras cadastradas, com seleção de rede e simulação de conexão, recusa e desconexão.
- Revalidar preço, disponibilidade, cupom e taxas antes de confirmar a compra. Mudanças devem exigir nova confirmação do usuário.
- Impedir pedidos duplicados em cliques repetidos ou reenvios após timeout.
- Representar pedido pendente, confirmado e recusado, com recuperação após refresh ou reconexão.
- Exibir a confirmação somente para pedido efetivamente confirmado na simulação.
- Preservar os itens em falhas; após confirmação, remover do carrinho apenas os itens e quantidades comprados.

O recibo deve reproduzir o snapshot do pedido. Alterações posteriores no catálogo não podem modificar seus valores. Referências de transação e links de exploração são simulados.

### Conta e sessão

Cadastro, login, logout e sessão são obrigatórios, integrados à API simulada. Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação.

A sessão deve ser recuperável após refresh. Trate expiração durante a navegação e durante o checkout, preservando o contexto para retomada. Logout e troca de usuário devem limpar dados privados em cache e subscriptions da sessão anterior.

Valide os formulários de cadastro, perfil, senha e carteiras, incluindo erros retornados pela API. Alterações confirmadas devem permanecer após refresh. Use credenciais fictícias e não armazene senhas em claro.

## 4. Integração e estado

Use TanStack Router nas rotas, parâmetros de busca e proteção dos fluxos privados. Use TanStack Query nas consultas, mutations e sincronização do cache. As chamadas REST devem passar pelo Axios.

A solução deve garantir:

- contratos tipados entre transporte, estado e interface;
- estados de carregamento, vazio, erro, sucesso e atualização em segundo plano;
- invalidação coerente após mutations e eventos;
- cancelamento ou descarte de respostas obsoletas;
- isolamento dos dados por usuário e pelos parâmetros da consulta;
- recuperação de falhas sem duplicar operações;
- tratamento de rotas inexistentes e acesso direto a qualquer tela prevista.

Aplique atualização otimista em pelo menos uma interação, com rollback em caso de falha. A política de cache, retries e sincronização deve ser documentada.

## 5. Contratos REST

Defina e documente os contratos utilizados. Os recursos mínimos são:

| Recurso | Operações |
| --- | --- |
| Sessão e conta | Cadastro, login, consulta da sessão, logout e expiração |
| NFTs | Listagem com busca/filtros/ordenação/paginação e detalhe por identificador |
| Favoritos | Consulta, inclusão e remoção |
| Carrinho | Consulta, inclusão, alteração e remoção de itens |
| Cotação | Validação de cupom, disponibilidade, descontos, taxas e total |
| Pedidos | Criação idempotente e consulta do estado e recibo |
| Perfil | Consulta, atualização de dados/avatar e alteração de senha |
| Carteiras | Consulta, cadastro e atualização |

As respostas devem representar erros de validação, sessão inválida, falta de permissão, recurso inexistente, conflito de disponibilidade e falha transitória.

As mutations de pedido devem aceitar uma chave de idempotência. Na simulação, a mesma tentativa deve recuperar o mesmo pedido; reutilizar a chave com conteúdo diferente deve gerar conflito.

## 6. Mocking com MSW

Implemente os mocks na camada de rede, reutilizando contratos e cenários entre desenvolvimento, demonstração e testes. Componentes, hooks e cliente Axios não devem conter respostas fictícias ou caminhos alternativos de negócio.

Os mocks devem manter estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos. Persistência local é permitida para sustentar refresh; o reset deve restaurar integralmente um cenário conhecido.

### Simulating Network Conditions and Failures

Simule condições de rede e falhas com MSW, incluindo lentidão, latência variável, timeouts, indisponibilidade de conexão e respostas HTTP de erro. Os cenários devem ser configuráveis e reproduzíveis, permitindo avaliar o carregamento, o feedback de erro e a recuperação da interface.

Disponibilize fixtures com variedade suficiente para exercitar filtros e paginação, pelo menos dois usuários e cenários determinísticos de:

- sucesso e resultado vazio;
- latência variável e respostas fora de ordem;
- falhas de conexão e respostas HTTP 4xx/5xx;
- sessão expirada e acesso não autorizado;
- conflito de cadastro ou de validação de formulário;
- cupom inválido ou expirado;
- preço alterado ou edição esgotada durante a compra;
- timeout após criação do pedido, com recuperação por idempotência;
- pagamento confirmado e pagamento recusado.

Use MSW também na simulação dos eventos, com uma integração compatível com o protocolo Socket.IO, como [@mswjs/socket.io-binding](https://github.com/mswjs/socket.io-binding). Documente o transporte utilizado e suas limitações no ambiente de mocks.

Os cenários devem exercitar `socket.io-client`. Substituir o socket por chamadas diretas a setters, callbacks ou ao cache não atende ao requisito.

A camada de mocks deve ser ativada por configuração e estar disponível no build de demonstração. Mudanças nos dados simulados devem ser refletidas tanto nas respostas REST quanto nos eventos correspondentes.

## 7. Tempo real com Socket.IO

Implemente, no mínimo, os seguintes eventos:

| Evento | Comportamento esperado |
| --- | --- |
| `nft.updated` | Atualizar preço e disponibilidade no catálogo, detalhe e carrinho |
| `order.updated` | Atualizar o estado do pedido e apresentar confirmação ou recusa |

Os eventos devem carregar identidade estável, recurso afetado e versão. O cliente deve tolerar duplicatas e eventos antigos, sem regredir um estado mais recente nem reaplicar efeitos.

Após reconexão, reconcilie os recursos ativos com a API REST. Eventos de uma sessão anterior não podem atualizar dados de outro usuário. Listeners e subscriptions devem ser liberados ao encerrar seu ciclo de vida.

Implemente o cenário:

1. Um NFT está no carrinho.
2. Seu preço ou disponibilidade muda durante a navegação.
3. A interface informa a alteração e atualiza o resumo.
4. O checkout impede a confirmação com uma cotação desatualizada.

Também deve funcionar uma interrupção de conexão enquanto o pedido está pendente. Após reconectar ou recarregar a página, o usuário deve recuperar seu estado sem criar outra compra. Pedidos confirmados ou recusados são terminais.

## 8. Interface, responsividade e acessibilidade

Preserve tipografia, cores, espaçamentos, hierarquia, imagens, proporções e composição do Figma. Adapte os componentes shadcn/ui à identidade visual do projeto.

Todas as telas devem funcionar em desktop, tablet e mobile, com atenção a filtros, navegação, formulários, carrinho e checkout. Avalie, no mínimo, larguras de 390, 768 e 1440 pixels.

Use **skeletons com shimmer effect** nos componentes dependentes de dados durante o carregamento, incluindo catálogo, detalhe e resumo do carrinho. Preserve as dimensões do conteúdo para evitar deslocamentos de layout e respeite a preferência por movimento reduzido.

São obrigatórios:

- navegação por teclado e foco visível;
- controle de foco em diálogos e drawers;
- semântica adequada, labels e mensagens de erro associadas aos campos;
- alternativas textuais para imagens relevantes;
- contraste legível e estados não dependentes apenas de cor;
- feedback acessível para mutations e alterações em tempo real;
- ausência de overflow horizontal indevido e perda de conteúdo com zoom.

Use os assets do arquivo quando disponíveis e mantenha imagens e fontes necessárias acessíveis à execução local. Documente qualquer substituição de asset ou ajuste de acessibilidade em relação ao layout.

### Ajustes implementados de responsividade e acessibilidade

- Os layouts de catálogo, detalhe, carrinho e checkout passam a uma coluna abaixo de 781 px; a grade de NFTs reduz para duas colunas e drawers mantêm rolagem própria. A largura mínima global é 320 px para suportar celulares estreitos e viewport reduzida por zoom. Modais limitam a altura à janela e permitem rolagem interna.
- No início mobile, a busca e o filtro ficam no topo; o destaque usa composição lado a lado, categorias rolam horizontalmente, NFTs permanecem em duas colunas e uma barra inferior leva a início, exploração, carrinho e perfil. Carrinho e checkout usam drawer de tela cheia em celulares.
- A confirmação foi redesenhada como recibo central com resumo da transação, data, total, carteira, itens, edições e taxas; no mobile os metadados viram grade 2×2 e cada NFT vira uma linha compacta.
- O foco visível usa contorno de alto contraste; campos de senha e newsletter preservam indicador de foco apesar do estilo visual customizado. Os diálogos e drawers usam o gerenciamento de foco e a tecla Escape do Radix.
- Filtros e avatares expõem seleção por `aria-pressed`; abas do detalhe aceitam setas, Home/End e mantêm um único ponto de tabulação. Mensagens de erro são ligadas aos campos relevantes, e os resultados de mutations e atualizações de cotação são anunciados como status/alerta.
- Imagens e fontes permanecem locais. Não houve substituição de assets. O ajuste visual foi limitar a largura mínima a 320 px, tornar o conteúdo de modais rolável e adicionar contorno/indicadores de seleção; o desenho e a paleta do Figma foram preservados.

## 9. Testes com Playwright

Entregue testes E2E executáveis com os mocks, cobrindo:

1. Busca, filtros combinados, ordenação, paginação e restauração pelo histórico.
2. Acesso direto ao detalhe e tratamento de recurso inexistente.
3. Cadastro, login, expiração de sessão, logout e troca de usuário.
4. Favoritos, incluindo falha de mutation e recuperação do estado.
5. Carrinho, quantidades, remoção, cupom e persistência após refresh/login.
6. Compra completa, do catálogo ao recibo confirmado.
7. Falha de pagamento, clique repetido e timeout com recuperação do mesmo pedido.
8. Edição de perfil, avatar, senha e carteiras, com erros de validação.
9. Alteração de preço/disponibilidade via Socket.IO durante o checkout.
10. Eventos duplicados ou antigos, desconexão e retomada de pedido pendente.
11. Navegação por teclado, foco de diálogos e validação de formulários.
12. Skeletons durante carregamento lento, feedback de falha e recuperação após nova tentativa.

Execute os fluxos principais em Chromium, nos viewports desktop e mobile. Inclua regressão visual de início, detalhe, carrinho e pagamento, com baselines versionadas e dados estáveis.

Cada teste deve partir de um estado isolado. Controle relógio, latência e disparo dos eventos nos cenários sensíveis a tempo. Entregue relatório HTML e traces das falhas.

As verificações devem observar a interface e os resultados das operações. Os testes de tempo real precisam passar pelo cliente Socket.IO e os de REST pelos handlers MSW.

## 10. Performance e Lighthouse

Audite início e detalhe do NFT com Lighthouse em perfis mobile e desktop, usando build otimizado e o cenário padrão dos mocks.

| Categoria | Meta |
| --- | ---: |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

Execute três medições por página e perfil e reporte a mediana de cada categoria. Versione a configuração da auditoria e entregue relatórios HTML/JSON, versões das ferramentas, ambiente e condições de execução.

Registre LCP, CLS e TBT. Justifique resultados abaixo das metas e identifique as causas. A auditoria deve carregar as imagens, fontes e funcionalidades da entrega, sem simplificações exclusivas para melhorar a pontuação.

## 11. Critérios de avaliação

| Critério | Pontos | Evidência esperada |
| --- | ---: | --- |
| Fidelidade visual e responsividade | 20 | Aderência ao Figma e consistência entre tamanhos de tela |
| Fluxos e experiência de uso | 20 | Compra e conta completas, validações e recuperação de erros |
| Integração e estado | 15 | Router, Query, Axios, contratos e cache coerentes |
| Tempo real | 10 | Eventos, reconexão, ordenação e sincronização com REST |
| Mocking | 10 | MSW, cenários determinísticos, persistência e reset |
| Testes | 10 | Cobertura dos fluxos e falhas com Playwright |
| Acessibilidade | 5 | Operação por teclado, semântica, foco e feedback |
| Performance | 5 | Resultados e análise das auditorias Lighthouse |
| Arquitetura e documentação | 5 | Tipagem, responsabilidades e execução reproduzível |
| **Total** | **100** | |

São eliminatórios: ausência de uso efetivo da stack obrigatória, fluxos principais apenas visuais, compra confirmada sem resposta da simulação, exposição de dados entre usuários, eventos simulados diretamente na UI ou ausência de testes E2E executáveis.

## 12. Entrega

Entregue código-fonte, lockfile, assets, mocks, fixtures, testes e configurações de auditoria.

O **deploy é obrigatório**. Envie o link do repositório e uma URL pública da aplicação. Recomenda-se [Vercel](https://vercel.com/docs/frameworks/frontend/vite); [Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) e [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) também são aceitos.

A versão publicada deve corresponder ao código entregue e permanecer acessível durante a avaliação, com os mocks e os fluxos de tempo real funcionando. Acesso direto e refresh das rotas devem funcionar no ambiente publicado.

O `README.md` da solução deve conter setup, variáveis de ambiente, credenciais fictícias, seleção e reset dos cenários, comandos de execução e instruções para reproduzir os fluxos de falha.

Documente os contratos REST e eventos, a política de sessão, o estado do carrinho, a estratégia de cache e a reconciliação entre REST e Socket.IO. Registre limitações, decisões de UX e eventuais desvios do Figma em `ARCHITECTURE.md`.

Disponibilize comandos para desenvolvimento com mocks, build, preview, verificação de tipos, lint, testes Playwright e auditoria Lighthouse.

A entrega deve executar a partir de um checkout limpo, sem depender de serviços privados ou do backend de produção.

## Estado da implementação

| Área | Estado nesta branch | Pendência objetiva |
| --- | --- | --- |
| Sessão e isolamento | Persistência e consultas privadas são por conta; logout/troca removem cache privado; sessão mock expira e o checkout preserva a retomada. | Reexecutar E2E de troca/expiração no Edge após a última alteração. |
| Rede e MSW | Latência variável, atraso por consulta, falhas HTTP/rede, catálogo vazio e reset foram adicionados. MSW foi alinhado à faixa compatível com o binding Socket.IO e o worker foi regenerado. | Confirmar handshake do socket no navegador. |
| Socket.IO | Cliente `socket.io-client` é carregado após o start do MSW; handlers usam o binding e filtros de versão/conta. | O último E2E executado ainda não conectou no Edge; a tentativa de nova execução foi bloqueada pela revisão de aprovação. Não tratar tempo real como validado até repetir o cenário. |
| Playwright | Testes de fluxos e recuperação cobrem login, conta, checkout, timeout/idempotência e falhas. Relatório HTML e trace em falha estão configurados. | Baselines visuais versionadas e a matriz E2E final desktop/mobile ainda precisam ser geradas/executadas. |
| Lighthouse | Configuração fixa, script e 12 execuções finais com relatórios HTML/JSON e medianas em `lighthouse-reports/`. | Metas da seção 10 atingidas nas páginas e perfis medidos. Detalhe mobile ficou no limite de Performance (90) e mantém LCP de 3,5 s. |
| Lint e build | `npm run lint`, `npm run typecheck` e `npm run build` foram executados nesta branch. | Corrigir qualquer regressão encontrada nas validações finais. |
| Deploy público | Não foi publicado. | Precisa de conta/credencial de hospedagem e da URL pública final para validar refresh das rotas. |

O escopo funcional e as decisões de sincronização estão descritos em [ARCHITECTURE.md](./ARCHITECTURE.md). A seção acima distingue implementação no código de validação ainda não confirmada em navegador.

## Mapa do frontend

| Área | Local |
| --- | --- |
| Menu compartilhado | `src/components/market-header.tsx` |
| Tela inicial e catálogo | `src/pages/home-page.tsx` (`HomePage`, `FilterPanel`, `FeaturedDeal`, `ProductCard`) |
| Detalhe do NFT | `src/pages/nft-detail-page.tsx` |
| Painel modal do carrinho e pagamento | `src/components/cart-checkout-modal.tsx` |
| Itens, cupons e resumo do carrinho | `src/pages/cart-page.tsx` |
| Login do checkout, carteira e pedido | `src/pages/checkout-page.tsx` |
| Confirmação do pedido | `src/pages/order-page.tsx` |
| Rotas e layout raiz | `src/main.tsx` |
| Regras e dados simulados da API | `src/mocks/handlers.ts` |
| Clientes de API por funcionalidade | `src/features/{catalog,cart,auth,orders}` |
| Componentes de interface base (shadcn/ui) | `src/components/ui` |
| Shell compartilhado em utilitários Tailwind | `src/lib/marketplace-styles.ts` |
| Tema, tipografia, templates de grid e ajustes de Radix/animação | `src/styles.css` |
| Fluxos de navegador | `tests/e2e/home.spec.ts` |

Os layouts e estilos comuns ficam nas classes Tailwind junto ao JSX. Valores de cor recorrentes usam nomes do tema, como `bg-market-surface` e `text-market-accent`; para colunas específicas, o JSX usa classes nomeadas como `marketplace-grid` e `detail-layout-grid`. `src/styles.css` concentra os tokens, templates que não cabem na escala padrão, tipografia global, animações e ajustes internos do Radix.
