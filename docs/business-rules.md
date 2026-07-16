# Catálogo de Regras de Negócio

**Estado:** base de implementação · **Fonte:** `CorreTop_Documento_Requisitos.md` ·
**Convenção:** uma regra deve ter identificador, gatilho, resultado observável e
rastreabilidade. Pendências que impedem uma implementação definitiva ficam no
`decision-log.md`.

## Invariantes transversais

| ID | Regra | Critério verificável | Origem |
|---|---|---|---|
| BR-001 | Todo dado operacional pertence a um tenant; acesso entre tenants é proibido. | Acesso com sessão de outro tenant não retorna nem altera o registro. | RF002 |
| BR-002 | Papéis são Diretor, Gestor e Corretor; permissões não são confiadas ao cliente. | Autorização é decidida no servidor a partir da sessão. | RF004–005 |
| BR-003 | Corretor só acessa seus próprios leads e clientes, inclusive na mesma filial. | Listas, detalhes e ações recusam recursos de outro responsável. | RF005, RF198 |
| BR-004 | Dados sensíveis exigem consentimento, acesso restrito e auditoria. | Evento de consentimento e auditoria são persistidos. | RF080–083 |
| BR-005 | Ações sensíveis precisam ser rastreáveis sem expor o conteúdo sensível no log. | Log inclui ator, data, tipo e alvo; não inclui arquivo/mensagem em claro. | RF081, RF191–192 |

## Conta, tenancy e equipe

| ID | Regra | Gatilho → resultado | Origem |
|---|---|---|---|
| BR-010 | Tenant só é liberado após pagamento confirmado; não existe trial. | Onboarding pago → tenant ativo; inadimplência → acesso bloqueado após tolerância. | RF001, RF006–007, RF090–092 |
| BR-011 | Super-admin gerencia tenant, plano e ativação, fora do escopo das corretoras. | Ação administrativa → altera estado do tenant e gera auditoria. | RF090–091 |
| BR-012 | Diretor pode criar Gestores e Corretores; Gestor pode criar somente Corretores; Corretor não administra equipe. | Tentativa de criar papel acima do escopo → negada no servidor. | RF003–005, prompt 2.3 |
| BR-013 | Usuários operacionais pertencem a uma filial. | Criação/alteração → filial válida no mesmo tenant é obrigatória. | RF100–101 |
| BR-014 | Corretor disponível pode pausar o recebimento; Gestor pode fazê-lo pela equipe. | Pausa → corretor deixa de ser elegível à distribuição. | RF110–112 |
| BR-015 | Cargo organizacional e perfil de acesso são conceitos separados. | Criação/edição → cargo descritivo pode variar sem ampliar permissões; o perfil continua autorizado pelo servidor. | Gestão de equipe |
| BR-016 | Todo membro operacional deve estar vinculado a uma filial ativa. | Criação/edição → unidade selecionada pertence ao tenant e é registrada na associação. | RF100–101 |

## Leads, funil e distribuição

| ID | Regra | Gatilho → resultado | Origem |
|---|---|---|---|
| BR-020 | Lead pode entrar manualmente ou por canal autenticado do tenant. | Entrada válida → lead, origem e evento de timeline são criados. | RF010–012, RF015 |
| BR-021 | O funil tem etapas ordenadas e terminais. | Mudança de etapa → respeita transição permitida e entra na timeline. | RF013 |
| BR-022 | Perda exige motivo. | Transição para `perdido` sem motivo → recusada. | RF014 |
| BR-023 | Novo lead é distribuído por round-robin entre corretores elegíveis da filial. | Lead recebido → próximo elegível recebe atribuição, conforme política do tenant. | RF020–021, RF102 |
| BR-024 | Elegibilidade considera usuário ativo, filial/escopo aplicável, disponibilidade e limite de carga. | Corretor fora de qualquer critério → excluído do round-robin. | RF021, RF110–112 |
| BR-025 | O SLA tem dois relógios: primeiro contato e última interação. | Limite ultrapassado → marca não trabalhado, notifica e/ou redistribui conforme configuração. | RF022–024 |
| BR-026 | Estagnação é diferente de SLA de interação. | Lead permanece na etapa além do limite, ainda que haja interação → alerta de estagnação. | RF194 |
| BR-027 | Reabertura e reatribuição são decisões de Gestor/Diretor e preservam histórico. | Reabertura → lead volta ao fluxo com evento de auditoria/timeline. | RF196 |
| BR-028 | Estouro de SLA remove o corretor responsável antes de redistribuir. | Lead do Diretor tenta outro corretor elegível da unidade e, sem elegível, retorna à fila central da corretora mãe; lead do Gestor retorna à fila da própria unidade para distribuição manual. | DEC-027 |
| BR-029 | Notificação operacional é um evento coordenado. | Capacidade ativa → cria notificação in-app para Realtime/toast e tenta push; capacidade desativada pelo Super-admin → nenhum canal é emitido, com auditoria da alteração. | DEC-028 |

## Cotação, documentos e venda

| ID | Regra | Gatilho → resultado | Origem |
|---|---|---|---|
| BR-030 | Catálogo pode ser global ou exclusivo do tenant; ambos seguem o mesmo fluxo de cotação. | Consulta de catálogo → retorna global + itens do tenant autorizados. | RF140–142 |
| BR-031 | Atualização manual de tabela é o fallback obrigatório; scraping é complementar. | Falha/desatualização do scraper → alerta e manutenção manual disponível. | RF030–032 |
| BR-032 | Cada cotação é imutável como versão histórica. | Nova cotação → cria novo registro e mantém as anteriores. | RF033–034, RF150–151 |
| BR-033 | Checklist documental depende de operadora/tipo de plano. | Solicitação de documentos → checklist aplicável é materializado e acompanhado. | RF040–041 |
| BR-034 | Documento rejeitado requer observação; avanço para análise só ocorre com checklist aprovado. | Tentativa de avançar incompleta → recusada. | RF042–044 |
| BR-035 | Conversão cria venda e Cliente Ativo ligado a plano e aniversário. | Lead convertido → venda, cliente e eventos subsequentes são criados. | RF130 |

| BR-036 | Todo atendimento pode representar mais de uma pessoa beneficiária e possui exatamente um titular. | Triagem/cotação cria beneficiários persistidos com vínculo ao lead e titular identificado. | Simulação ponta a ponta |
| BR-037 | Requisitos marcados como individuais são exigidos para cada beneficiário; requisitos familiares são exigidos uma vez. | Checklist materializa itens por pessoa de forma idempotente. | Solução de beneficiários |
| BR-038 | Venda só é registrada com evidência da aprovação da operadora, apólice, início de vigência e valor final aprovado. | Registro incompleto é recusado e apresenta pendências explícitas. | Solução de registro de venda |
| BR-039 | Cancelamento não apaga histórico nem desconta dinheiro automaticamente. | Parcelas futuras são canceladas e parcelas pagas na janela são sinalizadas para decisão manual. | Solução de cancelamento |

## Comissão, pós-venda e metas

| ID | Regra | Gatilho → resultado | Origem |
|---|---|---|---|
| BR-040 | Comissão é definida por operadora/plano como única ou escalonada. | Venda convertida → usa a regra vigente aplicável e gera cronograma. | RF050–051 |
| BR-041 | Comissão prevista, paga e pendente são estados distintos e conferíveis por período. | Marcação de pagamento → atualiza parcela e mantém rastreabilidade. | RF052–054 |
| BR-042 | Renovação gera alerta antecipado; interações pós-venda permanecem no cliente. | Proximidade do aniversário → notificação; interação → histórico do cliente. | RF131–132 |
| BR-043 | Metas podem ser por corretor e por equipe/filial, em período definido. | Registro de venda → recalcula progresso do alvo aplicável. | RF120–121 |

## Comunicação, relatórios e integridade

| ID | Regra | Gatilho → resultado | Origem |
|---|---|---|---|
| BR-050 | Integração oficial de WhatsApp é posterior ao atalho controlado para WhatsApp Web. | MVP → sem histórico integrado; fase posterior → conversa vinculada ao lead. | RF060–063 |
| BR-051 | Eventos relevantes geram notificação in-app; push depende de consentimento do navegador. | Evento elegível → notificação persistida; push apenas quando permitido. | RF170–172 |
| BR-052 | Relatórios respeitam tenant, papel, filial, equipe, corretor e período. | Consulta → filtros de segurança são aplicados antes dos filtros de interface. | RF070–073, RF103 |
| BR-053 | Exportação não é bloqueada por papel, mas sempre é auditada. | Exportação → loga ator, momento, filtros e quantidade. | RF191 |
| BR-054 | Taxa de perda anormal compara corretor com referência configurável da equipe/filial. | Desvio excede limite → alerta para Gestor/Diretor. | RF193, RF199–200 |
| BR-055 | Reengajamento de perdido obedece prazo e canal aprovados, com conteúdo neutro. | Prazo configurado alcançado → cria ação de reengajamento auditável. | RF195 |
| BR-056 | Relatório de evidências preserva timeline, status e mensagens autorizadas do lead. | Solicitação autorizada → gera exportação auditada e limitada ao escopo. | RF197 |

## Regras que exigem decisão antes do código

- Transições exatas de funil e permissões por transição (DEC-001).
- Critério de round-robin, desempate e reatribuição (DEC-002).
- Relógio, calendário e efeitos de cada SLA (DEC-003).
- Fórmula, vigência e reversão de comissões (DEC-004).
- Base legal, retenção e consentimento LGPD (DEC-005).
- Canal, aprovação e opt-out do reengajamento (DEC-006).
| BR-030 | A apresentaÃ§Ã£o de uma rota Ã© exibida uma vez por usuÃ¡rio e tenant, e pode ser reativada pelo Super-admin. | Primeira visita sem conclusÃ£o â†’ dialog contextual; conclusÃ£o/dispensa â†’ progresso persistido; reset administrativo â†’ todas as rotas voltam a ficar disponÃ­veis e a aÃ§Ã£o Ã© auditada. | DEC-029 |
