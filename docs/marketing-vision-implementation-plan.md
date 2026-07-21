# Plano adaptado — visão de Marketing no CorreTop

## Objetivo

Entregar uma área de Marketing analítica e operacional, com dados de captação,
qualidade, velocidade de atendimento e conversão, sem transformar Marketing em
gestão comercial nem ampliar permissões por acidente.

Este plano adapta o material recebido ao estado real do projeto em 21/07/2026.
Ele é um plano de implementação; nenhuma fase futura deve ser tratada como
capacidade já disponível.

## Ajustes obrigatórios ao plano original

| Plano original | Regra aplicada no CorreTop |
|---|---|
| Criar `MARKETING_HEADQUARTERS` e `MARKETING_UNIT` | Não criar novos valores no enum de cargo agora. O sistema já usa `tenantMemberships.role` e `jobTitle`; Marketing será representado por `jobTitle = marketing` e o escopo pela `branchId`. |
| Marketing da unidade conecta Meta | Bloqueado nesta fase por DEC-039. A integração Meta continua exclusiva da matriz. |
| Marketing da matriz altera campanhas e destinos | Inicialmente leitura, saúde da integração e mapeamento controlado. Qualquer mudança de distribuição exige permissão explícita e auditoria. |
| Criar `/resume` separado imediatamente | Primeiro criar um host de Marketing em rota própria e reutilizar apenas componentes de leitura. A home atual do Diretor não deve ser mascarada para Marketing. |
| Receber receita, ROAS e custo por venda | Só exibir quando houver dados confiáveis e autorização financeira. Até lá, mostrar conversão, qualificação e atendimento. |
| Criar `contacts`, `campaigns` e `lead_attributions` em lote | Não duplicar entidades. Reutilizar `leads`, `marketing_connections`, `marketing_webhook_events`, `marketing_daily_metrics` e metadados de origem; novas tabelas só após contrato aprovado. |
| Worker obrigatório para o primeiro webhook | O webhook Meta já processa a captura de forma síncrona e idempotente. Reprocessamento administrativo será fase posterior, sem quebrar o endpoint atual. |

## Escopo de acesso

O servidor deve derivar o escopo da sessão:

```ts
type MarketingScope = {
  tenantId: string;
  branchId: string | null;
  isHeadquarters: boolean;
};
```

- Marketing da matriz: `jobTitle = marketing` e `branchId = null`; vê métricas
  agregadas do próprio tenant e comparações entre unidades.
- Marketing da unidade: `jobTitle = marketing` e `branchId != null`; fica
  planejado, mas só deve ser liberado quando todas as consultas usarem esse
  `branchId` no servidor.
- Diretor: mantém a administração já existente e pode acessar a visão consolidada.
- Gestor e corretor: não recebem a área de Marketing por inferência de cargo.

O frontend pode esconder rotas, mas a proteção real deve existir em queries,
Server Actions, Route Handlers, exportações e atualizações em tempo real.

## Dados permitidos

Marketing pode receber dados agregados de:

- volume de leads por origem, campanha, anúncio, formulário e unidade;
- status de marketing normalizado;
- qualificação, perdas padronizadas e tempo até primeiro contato;
- SLA, duplicidade, inválidos, falhas de integração e última captura;
- custo e receita somente quando o tenant liberar a permissão financeira.

Ao abrir um lead individual, usar drawer resumido com nome abreviado, identificador,
origem, unidade, etapa resumida e qualificação. Mascarar telefone e e-mail e não
exibir conversa, documentos, CPF, dados médicos, notas privadas ou proposta completa.

## Fases de implementação

### Fase 0 — contrato e governança

1. Registrar a decisão de escopo e criar permissões `marketing.*` sem conceder
   automaticamente permissões comerciais.
2. Criar feature flag global para a área de Marketing, controlada pelo
   Super-admin e auditada.
3. Definir política por tenant para custos, receita e exportação.
4. Especificar os estados normalizados de Marketing a partir dos estados atuais
   de `leads`; não criar um segundo funil.

Critério: uma matriz de permissões aprovada e testes de acesso cruzado escritos.

### Fase 1 — escopo seguro e navegação

1. Criar `getMarketingScope()` no domínio de autorização.
2. Adicionar uma sidebar mínima somente para usuários elegíveis.
3. Criar rota inicial `/marketing` ou `/marketing/resumo`; não reutilizar o
   dashboard do Diretor como se fosse Marketing.
4. Bloquear `/marketing/*` para unidade até a Fase 5, exibindo motivo e alternativa.

Critério: alterar `branchId` na URL nunca amplia o resultado; o usuário só vê os
módulos permitidos pelo servidor.

### Fase 2 — resumo de captação e saúde

Entregar primeiro os indicadores que já possuem evidência no banco:

- leads recebidos e processados;
- fontes ativas/inativas;
- eventos com erro;
- última captura;
- leads por origem, formulário, campanha e unidade;
- distribuição pendente e tempo até primeira resposta, quando disponível.

Não mostrar números fixos, custo ou vendas se a consulta não possuir fonte confiável.

Critério: filtros de período e origem funcionam no servidor e todos os cards têm
estado de carregamento, vazio, erro e permissão negada.

### Fase 3 — campanhas e qualidade

1. Criar `/marketing/campanhas` como leitura inicialmente.
2. Consolidar a atribuição usando `sourceChannel`, `sourceCampaign`, `sourceAd`,
   `sourceForm`, `sourceMetadata` e `externalId` existentes.
3. Criar tabela agregada somente se as consultas reais demonstrarem necessidade de
   desempenho; começar com queries escopadas e índices existentes.
4. Exibir qualidade: inválidos, duplicados, sem consentimento, sem resposta e
   motivos padronizados de perda.

Critério: a mesma campanha aparece com a mesma taxonomia em Meta, Landing Page e
WhatsApp, sem duplicar o lead ou expor PII.

### Fase 4 — leads limitados e relatórios

1. Criar `/marketing/leads` separado da fila operacional.
2. Adicionar drawer de resumo mascarado.
3. Permitir exportação somente com permissão própria, auditoria e o mesmo
   mascaramento da tela.
4. Nunca permitir assumir, redistribuir, excluir ou alterar status comercial.

Critério: testes comprovam que Marketing não acessa conversas, documentos ou
campos privados mesmo manipulando requisições.

### Fase 5 — unidade de Marketing (futura e bloqueada)

Só iniciar após nova decisão aprovada:

1. liberar `jobTitle = marketing` com `branchId` ativo;
2. escopar todas as consultas à unidade;
3. mostrar apenas campanhas e fontes destinadas à unidade;
4. manter comparação entre unidades indisponível;
5. criar conexão Meta por unidade somente com mapeamento explícito de Página,
   formulário e destino.

Critério: testes multi-tenant e multi-unidade sem vazamento, incluindo exportação,
Realtime e endpoints diretos.

### Fase 6 — integrações e atribuição avançada

1. Evoluir o OAuth Meta para seleção de Página/formulário, em vez de conectar
   automaticamente todas as Páginas retornadas.
2. Adicionar sincronização de campanhas e Insights somente com permissões aprovadas.
3. Preservar UTMs e `fbclid` na Landing Page.
4. Fazer primeira mensagem WhatsApp de número desconhecido criar contato, conversa
   e lead.
5. Só depois planejar Instagram Direct e Messenger no mesmo contrato de ingestão.

Critério: cada origem passa pelo mesmo contrato de normalização, deduplicação,
auditoria e distribuição.

### Fase 7 — conversões para a Meta

Implementar somente após existir rastreabilidade confiável de:

```text
lead recebido → contato → qualificado → proposta → venda/perda
```

O envio para a Meta deve ser configurável, auditado, consentido e desativável pelo
Super-admin. Não enviar PII desnecessária nem criar eventos duplicados.

## Modelo de permissões inicial

```text
marketing.dashboard.read
marketing.campaign.read
marketing.lead.read_limited
marketing.funnel.read
marketing.report.read
marketing.source.read
marketing.integration_status.read
marketing.unit_comparison.read   (somente matriz)
marketing.cost.read              (se autorizado pelo tenant)
marketing.report.export          (se autorizado e auditado)
marketing.integration.connect   (Diretor/Marketing da matriz, conforme DEC-039)
```

Não conceder ao Marketing:

```text
lead.assign
lead.update_status
lead.delete
conversation.read_full
conversation.send
sale.create
rbac.manage
finance.manage
distribution.manage
```

## Critérios de aceite finais

1. Marketing da matriz vê apenas o próprio tenant.
2. Marketing da unidade, quando liberado, não atravessa unidades pela URL ou API.
3. A integração Meta continua centralizada enquanto DEC-039 estiver vigente.
4. PII permanece mascarada na lista, drawer e exportação.
5. O Marketing não altera o processo comercial.
6. Campanhas, origens e formulários são comparáveis sem duplicar leads.
7. Falhas de webhook e conexão aparecem com próximo passo operacional.
8. Toda alteração de integração, campanha, escopo e exportação gera auditoria.
9. O Super-admin consegue ativar, desativar e revisar a capacidade.
10. Build, type-check, testes de autorização e cenários multi-tenant passam.

## Não priorizar agora

- criação de IA autônoma para otimização de campanhas;
- relatórios programados;
- edição de anúncios dentro do CorreTop;
- ROAS/receita antes da Conversions API e da política financeira;
- conexão de Instagram Direct/Messenger antes de concluir o fluxo WhatsApp;
- materialized views antes de medir gargalo real de consulta.

## Importacao alternativa enquanto a Meta aguarda liberacao

Enquanto o webhook de Lead Ads nao estiver liberado para producao, o CorreTop oferece **Importar leads** em `/leads`. O arquivo e validado no servidor, cada contato e deduplicado pelo telefone dentro da corretora, encaminhado para a unidade escolhida e distribuido pelo motor de capacidade existente.

- **Arquivo:** CSV UTF-8 com `nome,telefone,email`; **Baixar modelo CSV** fornece um exemplo pronto.
- **Limites:** 500 linhas e 2 MB por arquivo. Linhas invalidas sao reportadas sem interromper as demais; duplicados sao ignorados e contabilizados.
- **Escopo:** Diretor e Marketing da matriz escolhem a unidade de destino; Gestor importa somente para sua propria unidade. Corretores nao possuem a acao.
- **Protecao de dados:** a importacao exige confirmacao de base legal/consentimento, nao aceita `tenant_id` do cliente e grava auditoria por lead.
- **Operacao:** leads com corretor disponivel entram como distribuidos; sem capacidade, entram na fila para o processamento resiliente existente.

Esta e uma ponte operacional, nao substitui a atribuicao de campanhas da Meta. Para volumes maiores, a proxima evolucao deve usar staging assincrono, progresso e reprocessamento pelo Super-admin.
## Entrega inicial implementada

- A rota `/marketing` é exclusiva para Diretor e Marketing da matriz e apresenta somente agregados tenant-scoped: volume de leads, funil, fontes e estado das conexões Meta.
- O cartão de teste cria e exclui um lead fictício usando `/{FORM_ID}/test_leads` no servidor. O Page Access Token é recuperado da conexão cifrada e nunca é aceito no formulário nem devolvido ao navegador.
- Para validar o webhook, informe o ID do formulário em `/marketing`, clique em **Criar lead de teste**, aguarde alguns segundos e confira o lead em `/leads`. A Meta permite um lead de teste por formulário; use **Excluir lead para repetir** antes de criar outro.
- A ferramenta oficial também pode ser usada em [Lead Ads Testing](https://developers.facebook.com/tools/lead-ads-testing). Ela exige acesso de Advertiser (ou superior) à Página e não funciona quando o app está em modo de desenvolvimento.
