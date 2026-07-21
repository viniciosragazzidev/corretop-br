# Tutorial — Meta Lead Ads centralizada na matriz

## Estado atual

O CorreTop já possui o endpoint global de webhook e registra eventos recebidos da Meta, mas ainda **não busca os dados pelo `leadgen_id` nem cria o lead automaticamente**. Portanto, não cadastre um webhook individual por unidade e não entregue tokens, App Secret ou token de verificação a Gestores.

No estágio atual, somente Diretor e Marketing vinculados à matriz operam a captação geral. Gestores e usuários de unidades não recebem acesso à integração. A conexão por unidade será liberada somente depois do OAuth/Embedded Login e do fluxo completo de criação idempotente de leads.

## Links oficiais úteis

- [Painel do app Meta CorreTop](https://developers.facebook.com/apps/780859815090303/)
- [Casos de uso do app](https://developers.facebook.com/apps/780859815090303/use_cases/)
- [Configurações de Páginas no Meta Business Suite](https://business.facebook.com/latest/settings/pages?business_id=37173915645589885)
- [Ferramenta oficial de teste de Lead Ads](https://developers.facebook.com/tools/lead-ads-testing/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Documentação de recuperação de leads](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving)
- [Documentação de Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [Referência de Webhook de Página](https://developers.facebook.com/docs/graph-api/webhooks/reference/page/)

## Parte A — preparação única da plataforma

Responsável: Super-admin ou Diretor da corretora dona do App Meta.

1. Abra o [painel do app Meta](https://developers.facebook.com/apps/780859815090303/).
2. Em **Casos de uso**, confirme que está ativo **Capturar e gerenciar leads de anúncios com a API de Marketing**.
3. Confirme que o app está publicado e que as permissões necessárias foram solicitadas/aprovadas pela Meta antes de conectar Páginas reais.
4. Em **Configurações do app**, mantenha URL de Política de Privacidade, Termos e e-mail de contato válidos.
5. Mantenha no ambiente de servidor, nunca no navegador:
   - o App Secret da Meta; na versão atual ele é lido pelo webhook como `META_WHATSAPP_APP_SECRET`, pois o mesmo App Meta também atende ao WhatsApp. A implementação da conexão deve normalizar esse nome para uma variável neutra de Meta;
   - `META_LEAD_WEBHOOK_VERIFY_TOKEN`;
   - `CRON_SECRET` para os jobs internos;
   - tokens de Página obtidos pela autorização futura.
6. Não configure callbacks distintos para cada filial. O endpoint será único: `https://corretop.vercel.app/api/webhooks/meta/leads`.

> O callback recebe, valida e processa o `leadgen_id` no servidor. O CRM busca os dados completos pela Graph API e cria o lead de forma idempotente na fila central.

## Conexão no CRM (matriz)

1. Entre no CRM como Diretor ou Marketing sem vínculo de filial.
2. Abra **Configurações > Integrações > Meta Lead Ads**.
3. Clique em **Conectar com a Meta**, autorize apenas as Páginas desejadas e volte ao CRM.
4. Confirme que cada Página aparece como **Ativa**. Pause ou exclua qualquer Página que não deva alimentar a fila geral.

O retorno OAuth configurado na Meta deve ser exatamente:

`https://corretop.vercel.app/api/integrations/meta/lead-ads/callback`

As variáveis de produção necessárias são `META_LEAD_ADS_APP_ID`,
`META_LEAD_ADS_APP_SECRET`, `META_LEAD_ADS_TOKEN_ENCRYPTION_KEY`,
`META_LEAD_ADS_REDIRECT_URI`, `META_GRAPH_API_VERSION` e
`META_LEAD_WEBHOOK_VERIFY_TOKEN`. O token de Página é gerado pelo OAuth e não é
copiado nem exibido ao usuário.

## Parte B — preparação de cada unidade

Responsável: Diretor da corretora e responsável de redes sociais da unidade.

Para cada unidade, registrar esta ficha antes da conexão:

1. Nome da unidade no CorreTop.
2. Nome e URL da Página do Facebook usada nos anúncios.
3. ID da Página.
4. Nome e ID de cada Formulário Instantâneo usado no anúncio.
5. Conta de anúncios/campanha correspondente, quando houver.
6. Pessoa que tem acesso administrativo legítimo à Página e ao portfólio empresarial.

Depois, no [Meta Business Suite — Páginas](https://business.facebook.com/latest/settings/pages?business_id=37173915645589885), confirme que essa pessoa possui acesso suficiente para administrar os leads da Página. O responsável de redes sociais não precisa, e não deve, receber segredos técnicos do app.

## Fluxo atual na matriz

1. Diretor ou Marketing da matriz acessa **Configurações > Integrações > Meta Lead Ads**.
2. Cadastra a Página e o formulário usados pela captação geral.
3. A fonte não permite escolher unidade: qualquer lead futuro entra primeiro na fila central.
4. O motor de distribuição define a unidade e o corretor conforme as regras operacionais.

## Fase futura — conexão plug-and-play por unidade

1. Acessar **Configurações > Integrações** no CorreTop.
2. Clicar em **Conectar Meta**.
3. Entrar na Meta usando a conta já autorizada para a Página daquela unidade.
4. Escolher somente a Página e o Formulário Instantâneo da própria unidade.
5. Confirmar a unidade de destino no CorreTop, após a liberação global dessa fase.
6. Ver o estado **Ativa**, a data de última sincronização e o botão de teste.
7. Criar um lead de teste na [ferramenta de teste da Meta](https://developers.facebook.com/tools/lead-ads-testing/).
8. Confirmar no CRM: origem Meta, Página, formulário, campanha/anúncio quando disponível, unidade correta, timeline e distribuição.

## Critério de aceite por unidade

- O Gestor consegue conectar apenas ativos da própria unidade.
- O token não aparece na interface, em URL, logs ou banco sem criptografia.
- Um lead de teste chega uma única vez, mesmo que a Meta reenvie o evento.
- O lead recebe unidade e entra na fila/distribuição normal do CRM.
- A tela mostra evento recebido, lead criado ou motivo seguro de falha.

## O que não fazer

- Não criar webhook por unidade.
- Não colar App Secret, token de Página ou token de verificação em campos do CRM.
- Não compartilhar conta pessoal da Meta entre unidades.
- Não considerar um evento `leadgen` recebido como lead criado: a criação só estará concluída quando a integração consultar o `leadgen_id` e persistir o contato no CRM.
