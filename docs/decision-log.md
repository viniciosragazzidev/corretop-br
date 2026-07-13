# Registro de Decisões de Produto e Arquitetura

Use este registro para decisões que alteram comportamento, escopo, custo, risco ou
contrato. Uma pendência marcada como **bloqueante** não deve ser implementada por
suposição. Quando decidida, mova para "Decididas" com data, responsável e referência
para ADR se aplicável.

## Decididas

| ID | Decisão | Estado | Evidência |
|---|---|---|---|
| DEC-000 | O desenvolvimento começa sem instalar dependências adicionais. | Aprovada — 2026-07-11 | Solicitação de preparação do projeto |
| DEC-007 | App Router é o padrão; Server Actions servem mutações internas e Route Handlers, integrações/webhooks. | Aprovada | Arquitetura §6 |
| DEC-008 | Atualização manual de tabelas é obrigatória; scraping é complementar e não bloqueia o MVP. | Aprovada | RF030–032, roadmap |
| DEC-009 | WhatsApp no MVP é abertura controlada do WhatsApp Web; inbox/API oficial ficam para fase posterior. | Aprovada | RF060–063 |
| DEC-010 | Não há trial; acesso depende de pagamento confirmado. | Aprovada | RF092 |
| DEC-013 | shadcn via MCP, Unlumen UI e `transitions-dev` são a fundação obrigatória para decisões de UI e motion. | Aprovada — 2026-07-11 | Solicitação do projeto |
| DEC-014 | Controles e estilos repetíveis devem usar componentes e tokens compartilhados; variações locais só podem existir para composição única. | Aprovada — 2026-07-11 | Solicitação do projeto |
| DEC-015 | shadcn é obrigatório para primitivas de UI; `dashboard-01` é a base de dashboards e Unlumen complementa estados e feedback animados. | Aprovada — 2026-07-11 | Solicitação do projeto |

## Pendentes bloqueantes

| ID | Decisão necessária | Impacto | Dono sugerido |
|---|---|---|---|
| DEC-001 | Definir máquina de estados do funil: transições permitidas, reabertura e quem pode executá-las. | Dados, UX, relatórios e automações. | Produto |
| DEC-002 | Definir round-robin: ordem inicial, desempate, comportamento quando não há elegível, limite de carga e reatribuição. | Distribuição e SLA. | Produto/Operação |
| DEC-003 | Definir SLAs: duração, fuso, dias úteis/corridos, pausa e política de notificação/redistribuição. | Jobs, alertas e fila. | Operação |
| DEC-004 | Definir comissão: moeda, percentual/base, vigência de regra, estorno/cancelamento e arredondamento. | Motor financeiro e relatórios. | Financeiro/Produto |
| DEC-005 | Definir matriz LGPD: base legal, texto/versionamento de consentimento, retenção, exclusão/anonimização e responsáveis. | Segurança e conformidade. | Jurídico/Produto |
| DEC-006 | Definir reengajamento: canal permitido, opt-out, prazo, templates aprovados e exceções. | Comunicação e LGPD. | Produto/Jurídico |
| DEC-011 | Definir planos comerciais, limites, cobrança, tolerância e provedor de pagamento. | Billing e bloqueio. | Negócio |
| DEC-012 | Definir política de filial: gestores multi-filial, fallback de distribuição e visibilidade consolidada. | Permissões e relatórios. | Produto |

## Pendentes não bloqueantes para o MVP inicial

| ID | Decisão necessária | Observação |
|---|---|---|
| DEC-020 | Provedor de banco, storage e autenticação. | Avaliar e instalar somente quando a fundação técnica for iniciada. |
| DEC-021 | Integração de Meta Lead Ads. | Pode começar pelo webhook genérico. |
| DEC-022 | Estratégia de PWA e push. | Requer escopo de browser e políticas de permissão. |
| DEC-023 | White-label por tenant. | Definir limites de marca e contraste antes da UI. |
