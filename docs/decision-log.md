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
| DEC-025 | CorreTop adota evolução modular Plugin First: domínios expõem use cases públicos; páginas e Workspace são hosts; plugins não acessam banco; comunicação entre módulos usa eventos; toda capacidade é multi-tenant, auditável, governável e preparada para feature flags. A migração será incremental, começando por Lead e Financeiro. | Aprovada — 2026-07-15 | Solicitação do projeto |

| DEC-026 | O pós-venda distingue data de registro, início de vigência, valor aprovado e evidência da operadora; cancelamento nunca desconta valores automaticamente. A janela de chargeback é configurável por tenant, inicia em 90 dias e toda alteração é auditada. | Aprovada como política de segurança — 2026-07-16 | Simulação ponta a ponta e solução de beneficiários |
| DEC-027 | No estouro do SLA de primeiro contato, o owner anterior é removido antes de qualquer nova atribuição. Leads originados pelo Diretor usam a fila central da corretora mãe: tentam outro corretor elegível na unidade e, se não houver, retornam à fila central para nova distribuição. Leads originados pelo Gestor permanecem na fila da unidade para distribuição manual. A origem é persistida, toda transição é auditada e o corretor que perdeu o SLA é excluído da tentativa imediata. | Aprovada — 2026-07-16 | Solicitação do usuário; implementação de `feedback-sla` e distribuição |
| DEC-028 | Notificações operacionais devem ser publicadas por um serviço central com registro in-app/Realtime e push coordenados. Cada capacidade possui uma chave global reversível controlada pelo Super-admin; quando desativada, nenhum dos dois canais é emitido para o evento. O catálogo e a auditoria da configuração são obrigatórios. | Aprovada — 2026-07-16 | Solicitação do usuário; correção de toast junto com push |

## DEC-033 — WhatsApp Cloud API oficial com Embedded Signup

**Estado:** Aceita
**Data:** 2026-07-16

O CorreTop migra de OpenWA para a Cloud API oficial da Meta em etapas. `communication_channels` é o domínio do canal; o webhook confirma assinatura HMAC e resolve o tenant pelo `phone_number_id`. Diretor conecta/pausa canais do seu tenant, Super-admin controla a capacidade global e OpenWA permanece apenas como fallback reversível durante a transição. Tokens são cifrados em repouso e nunca chegam ao frontend.

## DEC-034 — Motion de navegação governado e sem sobreposição de rotas

**Estado:** Aceita
**Data:** 2026-07-19

As rotas do aplicativo usam a integração experimental de View Transitions do Next.js para transições curtas entre snapshots do navegador. A rota anterior e a nova não coexistem no DOM do aplicativo, evitando o efeito de tela dividida. A capacidade é reversível pela chave global `feature_interface_motion_enabled`, administrada exclusivamente pelo Super-admin e auditada em `platform_audit_logs`. A preferência `prefers-reduced-motion` sempre prevalece. Tabelas, filas e métricas não recebem animação de entrada ou reordenação; nelas só são permitidas transições de estado de baixo impacto, como hover e foco.

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

## DecisÃµes registradas durante a implementaÃ§Ã£o

| ID | DecisÃ£o | Estado | EvidÃªncia |
|---|---|---|---|
| DEC-023A | White-label usa nome, logo e uma cor primÃ¡ria por tenant; o servidor valida hex e assets, o shell calcula foreground legÃ­vel e a alteraÃ§Ã£o Ã© auditada. | Aprovada â€” 2026-07-13 | Settings, AppShell e sidebar |
| DEC-024 | TOTP Ã© opcional por usuÃ¡rio; ativaÃ§Ã£o e desativaÃ§Ã£o exigem senha, login aceita aplicativo autenticador ou cÃ³digo de recuperaÃ§Ã£o e a geraÃ§Ã£o de novos cÃ³digos invalida os anteriores. | Aprovada â€” 2026-07-13 | Better Auth two-factor, /settings e /2fa |
## DEC-029 — Onboarding contextual por rota

Estado: aprovada em 2026-07-16. A apresentação é persistida por tenant, usuário e rota; o Super-admin pode desativar globalmente ou reiniciar o conjunto de rotas de um usuário. A operação gera auditoria.

## DEC-030 — Lembrete de feedback configurável por tenant com push

Estado: aprovada em 2026-07-16. O lembrete de feedback agora opera com intervalo configurável por tenant (default 30 min), máximo de tentativas (default 5), e flags independentes para push e toast. O job roda a cada N minutos em vez de 1x/dia. Quando o limite de tentativas é excedido, a urgência da mensagem escala. O push respeita a capacidade global DEC-028.

## DEC-031 — Catálogo oficial global com extensão privada por corretora

**Estado:** Aceita
**Data:** 2026-07-16

O CorreTop manterá uma base oficial global de operadoras, planos, tabelas e versões comerciais, publicada exclusivamente pelo Super-admin. Cada corretora pode manter uma extensão privada para acordos exclusivos, isolada pelo seu `tenant_id` e administrada somente pelo Diretor. A consulta de cotação usará um resolvedor único que combina itens oficiais publicados, visíveis por padrão a todos os tenants e sujeitos apenas a ocultações explícitas por tenant/unidade, com itens privados do próprio tenant.

Tabelas comerciais serão versionadas e vigentes; registros históricos devem manter snapshot e referência da versão utilizada. Importação assistida por IA poderá gerar propostas de alteração, mas jamais publicar ou alterar o catálogo sem revisão explícita do Super-admin.

**Consequência:** o CRUD legado por tenant permanece apenas como adaptador de migração. Nenhum consumidor novo deve consultar as tabelas legadas diretamente.

## DEC-032 — Termos públicos de uso e responsabilidade do CRM

**Estado:** Aceita como versão operacional
**Data:** 2026-07-16

O CorreTop disponibilizará uma rota pública de termos que explica o uso permitido do CRM, a responsabilidade da corretora sobre seus usuários e dados de clientes, os limites da plataforma e orientações gerais de proteção de dados. O texto não substitui contrato, política de privacidade específica, definição formal de controlador/operador nem revisão jurídica. A versão jurídica definitiva exigirá identificação da pessoa jurídica, canal de privacidade e política de retenção aprovados.
