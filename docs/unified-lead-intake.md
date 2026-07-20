# Entrada unificada de leads

## Objetivo

O CorreTop é o hub de leads da corretora. Landing pages, Facebook Lead Ads,
Instagram Lead Ads e WhatsApp devem alimentar o mesmo motor de validação,
deduplicação, resolução de unidade, distribuição, SLA, notificações e auditoria.

## Contrato de origem

Todo lead deve preservar `tenant_id` e, quando aplicável, `branch_id`. A origem
operacional é registrada em `source_channel` (`landing_page`, `facebook`,
`instagram` ou `whatsapp`), com `source_campaign`, `source_ad`, `source_form`,
`source_metadata` e `external_id` para rastreabilidade e idempotência.

`tenant_id` nunca vem do navegador ou do payload externo como autoridade: ele é
resolvido pela credencial/canal conectado no servidor. A unidade é resolvida pela
configuração do canal, formulário/campanha ou regra de fallback da corretora.

## Fluxo obrigatório

1. autenticar o webhook e validar assinatura quando o provedor exigir;
2. validar e normalizar telefone, e-mail e campos do formulário;
3. registrar a entrega e aplicar idempotência por tenant, canal e identificador externo;
4. resolver a unidade de destino;
5. criar ou reconciliar o lead sem duplicação;
6. executar o motor existente de distribuição e SLA;
7. registrar interação, auditoria e metadados de origem sem tokens ou PII desnecessária;
8. permitir reprocessamento seguro quando a etapa posterior falhar.

## Estado atual

A entrada da landing page já executa autenticação, validação, idempotência,
resolução de filial, distribuição síncrona, notificações e auditoria. A migration
0054 adiciona o contrato de atribuição comum sem alterar esse comportamento.

Em Configurações > Integrações, o Diretor pode excluir fontes de webhook e
conectar uma fonte Meta à Página, formulário e unidade de destino. Cada conexão
expõe o estado operacional e os totais persistidos de eventos, cliques,
impressões e investimento. Pausar ou excluir é auditado; a exclusão remove apenas
a configuração da fonte e seus dados de métricas/eventos vinculados, nunca leads
já criados no CRM.

## Próxima integração: Meta Lead Ads

O receptor inicial está disponível em `POST /api/webhooks/meta/leads` e `GET`
para verificação da Meta. Ele valida `X-Hub-Signature-256`, respeita a feature flag
`feature_meta_lead_ads_enabled`, resolve a conexão pela Página e registra eventos
`leadgen` idempotentes. A busca dos dados completos do `leadgen_id`, criação do
lead e sincronização de Insights continuam bloqueadas até a conexão administrativa
e as permissões aprovadas da Meta estarem configuradas.

A conexão de Facebook/Instagram deve ser uma superfície administrativa do
Super-admin/Diretor, com status ativo/inativo, auditoria, última entrega e erro de
webhook. O webhook da Meta deve buscar os dados do `leadgen_id` no servidor e
entregar um payload interno ao contrato acima. O Pixel não é fonte de leads; ele
serve apenas para mensuração de eventos em páginas.

## WhatsApp

Mensagens recebidas pelo canal Meta Cloud devem primeiro tentar reconciliar um lead
aberto pelo telefone normalizado. Se não houver correspondência, a mensagem inicial
deve criar um lead com `source_channel = whatsapp` e entrar no mesmo fluxo de
distribuição. Mensagens repetidas devem ser deduplicadas pelo identificador do
provedor.

## Governança e segurança

- cada conexão é reversível por feature flag/configuração administrativa;
- tokens permanecem cifrados no servidor e nunca aparecem no frontend ou logs;
- webhooks são auditados e têm estado de entrega;
- acesso a leads continua escopado por tenant, filial e papel;
- campanhas e anúncios são metadados, não autorização de escopo;
- dados pessoais são minimizados e a política LGPD permanece pendência jurídica.

## Critérios de conclusão da fase Meta

- lead de Facebook e Instagram aparece na unidade correta;
- WhatsApp cria/reconcilia lead sem duplicação;
- origem/campanha/formulário permanecem visíveis no detalhe e relatórios;
- distribuição e SLA são idênticos aos da landing page;
- reprocessamento não duplica leads;
- conexão pode ser pausada e reconectada pelo administrador;
- testes de assinatura, isolamento de tenant e auditoria passam.
