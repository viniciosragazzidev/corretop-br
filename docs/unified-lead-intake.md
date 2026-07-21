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

Em Configurações > Integrações, Diretor e Marketing da matriz podem excluir fontes de webhook e
conectar Páginas Meta pelo OAuth oficial. Cada conexão
expõe o estado operacional e os totais persistidos de eventos, cliques,
impressões e investimento. Pausar ou excluir é auditado; a exclusão remove apenas
a configuração da fonte e seus dados de métricas/eventos vinculados, nunca leads
já criados no CRM.

## Próxima integração: Meta Lead Ads

### Escopo temporário: matriz

Até a conclusão do fluxo plug-and-play por unidade, fontes Meta são cadastradas
somente na matriz e não recebem `branch_id`. Diretor e Marketing sem vínculo de
unidade são os únicos administradores permitidos. O webhook ignora fontes inativas
ou vinculadas a unidade, e a distribuição posterior decide a unidade atendente.

O Super-admin controla a capacidade por `feature_meta_lead_ads_enabled`. A conexão
oficial usa OAuth no servidor, cifra o token de Página em repouso e inscreve a Página
no campo `leadgen`. A futura liberação por unidade depende apenas de uma decisão de
escopo e superfície plug-and-play por unidade; não exige expor tokens no navegador.

O receptor está disponível em `POST /api/webhooks/meta/leads` e `GET` para
verificação da Meta. Ele valida `X-Hub-Signature-256`, respeita a feature flag,
resolve a conexão pela Página, registra o evento `leadgen` de forma idempotente,
recupera o `leadgen_id` pela Graph API e cria o lead na fila central. Nome, telefone,
e-mail, campanha, anúncio, formulário e identificador externo são normalizados sem
registrar token ou payload sensível em logs. Falhas permanecem no evento com erro
operacional para reprocessamento controlado posterior.

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

- lead de Facebook aparece na fila central correta, sem selecionar uma unidade por inferência;
- WhatsApp cria/reconcilia lead sem duplicação;
- origem/campanha/formulário permanecem visíveis no detalhe e relatórios;
- distribuição posterior e SLA usam as regras já existentes após a unidade ser definida;
- reprocessamento não duplica leads;
- conexão pode ser pausada e reconectada pelo administrador;
- testes de assinatura, isolamento de tenant e auditoria passam.
