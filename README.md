# Resposta ao teste técnico — Kurio NFT Marketplace

## Entrega

Aplicação de marketplace de NFTs construída com React e TypeScript, baseada no layout do Figma. A implementação contempla descoberta de NFTs, conta do colecionador, carrinho e compra simulada, com responsividade, acessibilidade, cenários de rede e medição de performance.

**Legenda:** ✅ Implementado; 🟡 Implementado no código, validação final pendente; ⏳ Pendente de entrega.

## Requisitos do enunciado e implementação

| Tópico | Pedido | O que está sendo entregue | Estado |
| --- | --- | --- | --- |
| 1. Escopo | Fluxos de descoberta, compra e conta em desktop e mobile, usando dados simulados. | Marketplace responsivo com catálogo, detalhe, carrinho, checkout, confirmação, login, cadastro, perfil e carteiras. | ✅ |
| 2. Stack | React, TypeScript, TanStack Router/Query, Axios, REST, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright e Lighthouse. | React/TypeScript; rotas com TanStack Router; estado remoto com TanStack Query; chamadas Axios para contratos REST simulados; Tailwind CSS; componentes próprios no padrão shadcn/ui usando primitives Radix; MSW e binding Socket.IO; Playwright e Lighthouse. | ✅ |
| 3. Telas e fluxos | Início, detalhe do NFT, carrinho, pagamento, confirmação, login/cadastro, perfil e carteiras. | As telas estão conectadas por fluxos navegáveis. Favoritos, quantidades, cupons, cotação, seleção de carteira, edição de perfil e alterações de senha funcionam no cenário simulado. | ✅ |
| 4. Integração e estado | Estados de carregamento/erro/sucesso, cache coerente, URL navegável e prevenção de respostas obsoletas. | Busca, filtros, ordenação e paginação mantêm o estado na URL; queries e mutations atualizam ou invalidam o cache; favoritos usam atualização otimista com rollback. | ✅ |
| 5. Contratos REST | Recursos para conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras. | Contratos tipados e endpoints simulados cobrem esses recursos, incluindo erros de validação, autorização, conflito e falha transitória. Pedido registra snapshot e chave de idempotência. | ✅ |
| 6. MSW e rede | Mocking na camada de rede, persistência e cenários reproduzíveis. | MSW inicia antes da interface. Os cenários incluem catálogo vazio, latência variável, falha HTTP/rede, cupom inválido, sessão expirada, disponibilidade/preço alterados e timeout recuperável. Os dados podem ser reiniciados. | ✅ |
| 7. Tempo real | Socket.IO para atualizações de NFT e pedido, reconexão e reconciliação com REST. | O cliente socket.io-client recebe eventos por WebSocket interceptado pelo binding do MSW. Atualizações de preço/estoque invalidam a cotação; pedidos podem ser reconciliados após recarga. | 🟡 |
| 8. Interface, responsividade e acessibilidade | Layout desktop/tablet/mobile, teclado, foco, semântica, mensagens associadas, alternativas textuais, contraste e zoom. | A interface reorganiza catálogo, detalhe, carrinho e checkout para telas estreitas; inclui foco visível, controle de foco em diálogos, labels, estados anunciados e suporte a viewport de 320 px. Ajustes visuais e substituição de asset estão documentados abaixo. | ✅ |
| 9. Playwright | E2E dos fluxos principais, erros, acessibilidade, rede e tempo real; execução desktop/mobile. | Há testes E2E para compra, conta, perfil/carteiras, sessão, falhas, timeout/idempotência e atualização de preço. A execução final no Edge e as baselines de regressão visual ainda precisam ser confirmadas. | 🟡 |
| 10. Lighthouse | Três medições por página e perfil; metas de Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 e SEO ≥ 90. | As medianas em três medições passaram as metas na home e no detalhe, em mobile e desktop. Resultados e limitações estão registrados em lighthouse-reports/README.md. | ✅ |
| 11. Critérios de avaliação | Fidelidade, fluxos, integração, tempo real, mocking, testes, acessibilidade, performance e documentação. | A tabela abaixo resume as evidências e as validações restantes. | — |

## Evidências dos critérios de avaliação

| Critério | Pontos | Evidência desta entrega | Estado |
| --- | ---: | --- | --- |
| Fidelidade visual e responsividade | 20 | Composição baseada no Figma; layouts adaptáveis; conteúdo de modais rolável em viewport reduzida. | ✅ |
| Fluxos e experiência de uso | 20 | Cadastro/login simulados, catálogo, carrinho, cotação e compra com resultado confirmado, recusado ou pendente. | ✅ |
| Integração e estado | 15 | Router, Query, Axios, contratos REST tipados, persistência e isolamento de dados por conta. | ✅ |
| Tempo real | 10 | Eventos de NFT/pedido e reconciliação implementados na simulação. | 🟡 Validar a conexão e o fluxo E2E final no Edge. |
| Mocking | 10 | MSW cobre dados de demonstração, persistência, falhas configuráveis e reset. | ✅ |
| Testes | 10 | Cenários Playwright estão implementados; execução final após as últimas alterações e baselines visuais estão pendentes. | 🟡 |
| Acessibilidade | 5 | Foco, teclado, labels, erros associados e feedbacks anunciados; Lighthouse Accessibility marcou 100 nas quatro medições medianas. | ✅ |
| Performance | 5 | Medianas registradas para home e detalhe em mobile e desktop; todas atingem as metas do enunciado. | ✅ |
| Arquitetura e documentação | 5 | Decisões, contratos, persistência, cache, eventos e limitações estão em ARCHITECTURE.md. | ✅ |

### Resultados Lighthouse

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP mediano | CLS mediano | TBT mediano |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 96 | 100 | 96 | 100 | 805 ms | 0 | 219 ms |
| Início | Desktop | 100 | 100 | 96 | 100 | 262 ms | 0 | 6 ms |
| Detalhe | Mobile | 90 | 100 | 96 | 100 | 3502 ms | 0 | 95 ms |
| Detalhe | Desktop | 99 | 100 | 96 | 100 | 851 ms | 0 | 0 ms |

Os valores são medianas de três execuções em build de produção local com MSW e throttling simulado do Lighthouse. O detalhe mobile atinge a meta de Performance no limite e apresenta LCP mais alto porque a arte principal só é renderizada após a consulta do NFT. Os relatórios completos estão em lighthouse-reports/.

## Ajustes de layout e assets

- O início mobile prioriza busca/filtros, cartões em duas colunas, categorias com rolagem horizontal e navegação inferior.
- Carrinho e checkout usam painel de tela cheia em celulares; o recibo da compra reorganiza resumo e itens para telas estreitas.
- Foco visível, indicação de seleção além de cor, rolagem interna dos diálogos e largura mínima de 320 px foram adicionados para acessibilidade e zoom.
- O arquivo public/assets/cosmic-bloom.png foi removido e as referências que o utilizavam passaram a usar public/assets/golden-beat.png, conforme solicitado. Os identificadores e títulos dos NFTs foram mantidos.
- As imagens e fontes da interface são locais. A paleta e a tipografia do layout foram preservadas.

## Limites do protótipo e estado da publicação

Autenticação, pagamentos, carteiras, catálogo e eventos são simulados no navegador por MSW. Não há backend de produção, transação blockchain, conexão com extensão de carteira ou gateway real de pagamento. As credenciais e contas de demonstração não devem ser usadas como autenticação real.

**Deploy público:** pendente de publicação na Vercel. A URL será adicionada após o deploy.
**Validação restante:** executar a suíte E2E final no Edge, confirmar o cenário Socket.IO no navegador e publicar/verificar o acesso direto e o refresh das rotas.

A arquitetura e as limitações técnicas estão detalhadas em [ARCHITECTURE.md](./ARCHITECTURE.md).

Roteiro de apresentação: [ROTEIRO_APRESENTACAO.txt](./ROTEIRO_APRESENTACAO.txt).
