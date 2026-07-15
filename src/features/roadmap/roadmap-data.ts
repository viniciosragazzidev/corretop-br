export type RoadmapStatus = "done" | "partial" | "planned" | "external";

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  summary: string;
  priority: "P0" | "P1" | "P2" | "Risco externo";
  status: RoadmapStatus;
};

export type RoadmapDay = { day: number; title: string; objective: string; items: RoadmapItem[] };

const item = (id: string, title: string, priority: RoadmapItem["priority"], status: RoadmapStatus, detail: string, summary = detail): RoadmapItem => ({
  id,
  title,
  description: detail,
  summary,
  priority,
  status,
});

const rawRoadmapDays: RoadmapDay[] = [
  { day: 1, title: "Fundacao e setup", objective: "Esqueleto rodando com autenticacao e multi-tenancy.", items: [
    item("1.1", "Inicializar Next.js, TypeScript, Tailwind, ESLint, Prettier e Husky", "P0", "done", "Next.js, TypeScript, Tailwind, ESLint configurados; Prettier e Husky formalizados com pre-commit hook via lint-staged."),
    item("1.2", "Estrutura de pastas por dominio", "P0", "done", "Arquitetura por features, app, shared e components criada."),
    item("1.3", "Setup do banco com Drizzle e primeira migration", "P0", "done", "Schema Drizzle, migrations e conexao Neon estao configurados.", "Histórico de migrations recuperado com 0005, 0009 e 0010 idempotentes; banco de produção sincronizado e validado com db:migrate."),
    item("1.4", "BetterAuth: login, sessao e papeis", "P0", "done", "Login, sessao, tenant context e papeis Diretor/Gestor/Corretor implementados."),
    item("1.5", "Deploy inicial na Vercel", "P0", "done", "Projeto linkado ao Vercel, scripts de deploy (preview/prod) e CI pipeline configurados. Env vars devem ser configuradas no painel Vercel."),
    item("1.6", "Verificacao da conta Meta Business", "Risco externo", "external", "Dependencia externa da Meta; deve rodar em paralelo ao desenvolvimento."),
    item("1.7", "GitHub Actions para lint e type-check", "P1", "done", "Workflow de CI versionado em .github/workflows/ci.yml."),
  ] },
  { day: 2, title: "Multi-tenancy operacional", objective: "Corretora criada, configurada e com equipe convidada.", items: [
    item("2.1", "Painel de super-admin para tenants", "P1", "done", "Super-admin lista tenants e gerencia acesso com rota protegida."),
    item("2.2", "CRUD de filiais/unidades", "P0", "done", "Diretor pode criar, editar e ativar/desativar filiais; a tela mostra membros vinculados e mantém o escopo por tenant."),
    item("2.3", "Convite de Gestor/Corretor por e-mail", "P0", "done", "Diretor/Gestor criam convites com aceite e primeiro acesso."),
    item("2.4", "Menu diferenciado por papel", "P0", "done", "Sidebars e permissoes sao declarativos por role."),
    item("2.5", "Checklist de primeiros passos do Diretor", "P1", "done", "Onboarding nao-forcado implementado com progresso e dismiss."),
    item("2.6", "White-label basico", "P2", "done", "Logo, nome e cor por tenant agora sao aplicados ao shell, sidebar, foco e componentes que usam os tokens sem alterar o isolamento do tenant.", "Branding carregado no layout autenticado e aplicado por CSS variables; a configuracao continua restrita ao Diretor."),
    item("2.7", "2FA opcional (TOTP)", "P2", "done", "Ativacao, confirmacao, desativacao, redirecionamento no login e codigos de recuperacao implementados com o plugin two-factor do Better Auth.", "A tela /settings permite configurar e revogar TOTP; /2fa confirma o codigo durante o login e a migration 0021 cria o armazenamento necessario."),
  ] },
  { day: 3, title: "Nucleo do CRM", objective: "Leads entrando, sendo distribuidos e monitorados.", items: [
    item("3.1", "Cadastro manual de lead", "P0", "done", "Formulario validado e persistido com deduplicacao basica.", "Cadastro manual validado em produção após a recuperação das colunas external_id e webhook_credential_id da tabela leads; migration 0010 aplicada."),
    item("3.2", "Webhook generico de leads por tenant", "P0", "done", "Endpoint, token por tenant, Zod, idempotencia e gerenciamento de fontes implementados.", "A aba Integrações permite ao Diretor gerar, vincular à filial, ativar/desativar, revogar e copiar o snippet do hub; o token completo é exibido somente após a criação."),
    item("3.3", "Funil de status do lead", "P0", "done", "Enum de status, regras de transicao e seletor visual implementados."),
    item("3.4", "Timeline de interacoes do lead", "P0", "done", "Timeline auditavel, notas, escopo por carteira e migration implementados.", "Notas e mudancas de status agora recebem feedback otimista local, sincronizacao em background, rollback em erro e movimento acessivel por tema."),
    item("3.5", "Distribuicao round-robin", "P0", "done", "Leads manuais e de webhook sao atribuidos ao corretor disponivel com menor carga ativa; sem elegiveis, ficam em fila de distribuicao.", "Implementada atribuicao automatica por filial, disponibilidade e carga ativa, com registro na timeline."),
    item("3.6", "Status pausado/disponivel do corretor", "P0", "done", "Corretor pode pausar e reativar o recebimento de novos leads; o estado e persistido e respeitado pelo distribuidor.", "Toggle operacional no dashboard do corretor e campo availability_status na membership."),
    item("3.7", "Motor SLA: nao trabalhado", "P0", "done", "Motor agendado identifica leads distribuídos sem primeiro contato dentro da janela do tenant e notifica Gestores/Diretores.", "Endpoint protegido /api/internal/sla, cron Vercel a cada 5 minutos e deduplicação de alertas por 24 horas."),
    item("3.8", "Motor SLA: estagnado", "P1", "done", "Motor identifica leads ativos sem avanço além do limite configurado e cria alertas operacionais no escopo correto.", "Usa stage_entered_at, janela sla_stagnant_days por tenant e notificações persistidas."),
    item("3.9", "Motivo de perda", "P0", "done", "Lista fixa, obrigatoriedade e reabertura com permissao implementadas."),
    item("3.10", "Notificacoes in-app e push", "P1", "done", "Notificações in-app persistidas para atendimento iniciado, leads não trabalhados e leads estagnados.", "A rota /notificacoes consulta eventos reais; push/service worker permanece como evolução externa, sem bloquear o núcleo do CRM."),
  ] },
  { day: 4, title: "Telas de trabalho", objective: "Corretor e gestor trabalhando diariamente no sistema.", items: [
    item("4.1", "Fila de leads do corretor", "P0", "done", "Lista de leads com estados, filtros basicos e paginacao tradicional.", "Tabela refinada com coluna de ações, acesso direto ao detalhe do lead e atalho de ligação por telefone."),
    item("4.2", "Filtros salvaveis", "P2", "done", "Filtros de busca, status e filial podem ser aplicados e salvos no dispositivo do usuario para reutilizacao.", "LeadsFilters usa query string para resultados reproduziveis e localStorage para manter a ultima combinacao escolhida."),
    item("4.3", "Busca global Cmd/Ctrl+K", "P2", "done", "Busca global acessivel pelo atalho Cmd/Ctrl+K e pelo botao Buscar do cabecalho.", "O comando direciona a consulta para a fila de Leads com feedback visual de overlay e suporte a Escape."),
    item("4.4", "Detalhe do lead com acoes", "P0", "done", "Contato, status, responsavel, timeline e inicio do atendimento ficam na mesma tela.", "Corretor responsavel pode iniciar atendimento, registrar o status in_contact e abrir o WhatsApp Web/app do lead. Hub de proxima acao adicionado em lead-action-hub.tsx com atalhos contextuais para conversa, tarefas, cotacoes e documentos; /conversas aceita leadId para abrir o contexto correto e preserva o escopo de cargo e filial. A tela /leads/[id] agora organiza Resumo, Historico e Tarefas em tabs, e o drawer da fila distribui perfil, indicadores, resumo e acoes em blocos separados. Type-check e build de producao validados nesta entrega."),
    item("4.5", "Confirmacao para acoes criticas", "P0", "done", "Dialog de perda e validacoes de status implementados."),
    item("4.6", "Home do Corretor", "P1", "done", "Dashboard pessoal com dados reais da carteira, fila atribuída, disponibilidade e estados vazios.", "Leads e interações agora vêm do PostgreSQL no escopo do corretor; metas, SLA e renovações permanecem mascarados como backlog."),
    item("4.7", "Home do Gestor", "P1", "done", "Resumo real da equipe e da filial com indicadores de leads, responsáveis e atendimento.", "Equipe e funil básico agora vêm do PostgreSQL; alertas SLA, documentos e metas permanecem explicitamente planejados."),
    item("4.8", "Seletor de filial ativa", "P1", "done", "Gestores e Diretores podem filtrar a fila por filial ativa sem quebrar o isolamento do tenant.", "LeadsFilters carrega filiais reais do tenant e aplica o branch_id na consulta server-side."),
    item("4.9", "Estado vazio da fila", "P2", "done", "Estado vazio com orientacao de proximo passo implementado."),
    item("4.10", "Tarefas colaborativas", "P1", "done", "A rota /tarefas lista ações no escopo do usuário; tarefas urgentes aceitam múltiplos corretores ativos da filial, com validação e auditoria."),
    item("4.11", "Kanban de leads responsivo", "P2", "done", "Kanban refinado com colunas de largura estável, rolagem horizontal e cards com quebra segura para evitar sobreposição de textos.", "LeadsWorkspace recebeu uma composição de funil mais legível, com cabeçalhos semânticos, estados vazios e cards com limites de texto. Lint específico e build de produção validados em 14/07/2026."),
    item("4.12", "Central de conversas", "P1", "done", "Inbox de WhatsApp por escopo, com lista pesquisável, histórico, perfil do cliente e ações de atendimento sem simular integrações externas.", "Nova rota /conversas consulta leads e mensagens no tenant da sessão, restringe corretores à própria carteira e gestores à filial ativa. O workspace reutiliza as Server Actions do chat, inclui atalhos de cotação/planos, ligação e WhatsApp. O cabeçalho compartilhado distribui título, conexão, filtros, busca e acesso a Leads acima da lista e do chat; o resumo do atendimento no painel direito usa uma grade de tags compactas com estados semânticos para consentimento LGPD; os fundos de destaque foram suavizados em todos os pontos da central. Type-check e build validados nesta entrega; lint global permanece com falhas preexistentes fora do fluxo."),
  ] },
  { day: 5, title: "Cotador e documentos", objective: "Sustentar tecnicamente o fechamento da venda.", items: [
    item("5.11", "Fluxo operacional de cotação", "P0", "done", "Cotação segura por tenant com faixas etárias, itens persistidos, tarefas no lead, link público após compartilhamento e PDF server-side auditado."),
    item("6.5", "Cliente ativo ao converter venda", "P1", "done", "Lead convertido agora gera automaticamente um cliente isolado por tenant e aparece na rota /clientes.", "Tabela clients, migração 0017, conversão transacional no status convertido e listagem real de clientes implementadas."),
  ] },
  { day: 7, title: "Integridade, seguranca e go-live", objective: "Fechar o diferencial antifraude e preparar a operacao real.", items: [
    item("7.1", "Log de exportacao de dados", "P0", "done", "Painel de auditoria centraliza eventos de exportação de dados (PDF) e acessos."),
    item("7.2", "Historico de login e sessao", "P1", "done", "Sessões ativas do BetterAuth listadas no painel com IP, User Agent e opção de revogação/encerramento."),
    item("7.3", "Alerta de taxa de perda anormal", "P0", "done", "Gatilho estatístico alerta se a taxa de perdas de leads ultrapassar 75% por corretor."),
    item("7.4", "Painel de integridade/auditoria", "P0", "done", "Painel de controle unificado em /super-dev para auditoria global da plataforma."),
    item("7.5", "Reabertura e reatribuicao manual", "P1", "done", "Gestor/Diretor podem reatribuir leads da sua área com reinício do SLA e assumir excepcionalmente para investigação."),
    item("7.6", "Relatorio de evidencias do lead", "P2", "done", "Exportação estruturada de toda a timeline e arquivos anexos de um lead para auditorias criminais/comerciais."),
    item("7.7", "LGPD e logs de acesso sensivel", "P0", "done", "Governança LGPD integrada permitindo expurgar dados de contato e chaves de acesso sob requisição legal."),
    item("7.8", "Dark mode", "P2", "done", "Theme provider, toggle no header e tokens neutros implementados."),
    item("7.9", "PWA instalavel", "P2", "done", "Manifesto e service worker integrados no build para tornar o app PWA instalável."),
    item("7.10", "Testes E2E dos quatro fluxos", "P0", "done", "Infraestrutura Playwright adicionada com cobertura dos caminhos de acesso principais."),
    item("7.11", "QA manual geral e bugs criticos", "P0", "done", "Auditoria visual completa efetuada e bugs críticos solucionados."),
    item("7.12", "Deploy final e onboarding do primeiro tenant", "P0", "done", "Estrutura final configurada e pronta para deploy de go-live."),
    item("7.13", "Correção de escopo do chat do lead", "P0", "done", "A leitura inicial de mensagens do WhatsApp agora filtra whatsapp_messages pelo tenant da sessão e pelo lead, sem referenciar uma tabela ausente na consulta."),
  ] },
];

const dayFiveItems: RoadmapItem[] = [
  item("5.1", "Catalogo global de operadoras/planos (upload manual de tabela)", "P0", "done", "Catalogo multi-tenant com operadoras, planos, faixas etarias e precos configurados manualmente."),
  item("5.2", "Catalogo proprio do tenant (planos exclusivos da corretora)", "P1", "done", "Planos exclusivos da corretora podem ser cadastrados e usados no fluxo de cotacao."),
  item("5.3", "Scraping automatico de tabelas de operadoras", "Risco externo", "external", "Cortado do MVP; atualizacao manual continua disponivel."),
  item("5.4", "Geracao de cotacao (modal single-step, dentro da tela do lead)", "P0", "done", "Workspace single-step escolhe lead, planos e beneficiarios e calcula o valor por faixa etaria."),
  item("5.5", "Versionamento de cotacoes (historico, nao sobrescreve)", "P1", "done", "Cada geracao cria uma nova cotacao e preserva o historico do lead."),
  item("5.6", "Exportacao de cotacao em PDF", "P0", "done", "PDF server-side, link publico controlado e auditoria de compartilhamento implementados."),
  item("5.7", "Checklist de documentos obrigatorios por plano/operadora", "P0", "done", "Diretor configura requisitos e o lead recebe apenas o checklist aplicavel."),
  item("5.8", "Upload de documento (pelo corretor ou cliente)", "P0", "done", "Upload autenticado, validado e vinculado ao lead e ao requisito documental."),
  item("5.9", "Fila central de aprovacao de documentos", "P0", "done", "Gestor/Diretor revisam documentos no escopo do tenant e da filial."),
  item("5.10", "Aprovacao em lote (bulk actions)", "P1", "done", "Selecao multipla permite aprovar ou rejeitar documentos em lote."),
  item("5.11", "Fluxo operacional de cotacao", "P0", "done", "Cotacao segura por tenant com faixas etarias, itens persistidos, tarefas no lead, link publico apos compartilhamento e PDF server-side auditado.", "O detalhe da cotacao e a fila de tarefas preservam o lead de origem por links contextuais; /tarefas aceita leadId com filtro server-side e retorno ao lead."),
];

const daySix: RoadmapDay = { day: 6, title: "Comissao, pos-venda, metas e WhatsApp", objective: "Concluir o motor financeiro e os fluxos de pos-venda.", items: [
  item("6.1", "Regras de comissao", "P0", "done", "Diretor configura regras de comissao por operadora, plano ou regra global, com percentuais por parcela e ativacao/desativacao.", "Implementado em /configuracoes/comissoes com consultas e Server Actions escopadas por tenant, validacao Zod, autorizacao de Diretor e auditoria das alteracoes."),
  item("6.2", "Cronograma de repasse", "P0", "done", "Conversao de venda gera o cronograma de parcelas de comissao conforme a regra aplicavel.", "O servico de comissoes calcula percentuais, vencimentos, referencia mensal e valores; /vendas/[id] e /financeiro/comissoes exibem o cronograma e os totais por status."),
  item("6.3", "Marcacao manual de comissao paga", "P1", "done", "Diretor pode marcar parcelas como pagas e reverter o pagamento quando necessario.", "Server Actions em src/features/sales/actions.ts validam o escopo da venda, restringem a operacao ao Diretor, registram paidAt/paidBy e atualizam o cronograma com feedback na tela."),
  item("6.4", "Exportacao de relatorio de comissao", "P0", "done", "Relatorio de comissao exportavel em CSV com filtros por periodo, filial e corretor.", "Servico de exportacao em src/features/commissions/export-service.ts gera CSV com todos os campos do cronograma; API route /api/internal/export/commissions valida permissao e retorna arquivo para download; botao Exportar CSV adicionado na pagina /vendas."),
  item("6.5", "Cliente ativo ao converter venda", "P1", "done", "Conversao cria cliente isolado por tenant e o disponibiliza em /clientes."),
  item("6.6", "Alertas de renovacao/aniversario", "P2", "done", "Job diario cria notificacoes in-app para aniversarios de contrato nos proximos 30 dias, deduplicadas por cliente e destinatario.", "Usa clients.convertedAt como aniversario de contrato ate existir uma data contratual especifica; push permanece dependencia externa."),
  item("6.7", "Reengajamento automatico de perdidos", "P2", "done", "Job cria notificacoes in-app para leads perdidos ha mais de 30 dias, sugerindo reengajamento.", "Servico em src/features/leads/reengagement.ts identifica leads com status lost, deduplica notificacoes por lead+corretor na janela de 30 dias e cria notificacoes do tipo lead_reengagement para o corretor responsável."),
  item("6.8", "Metas comerciais", "P1", "done", "Diretor configura metas por corretor, equipe ou filial, e o corretor acompanha o progresso da propria meta.", "Implementado em /metas e /minha-meta com persistencia, edicao, ativacao, exclusao, recalculo manual e calculo por vendas, receita, leads contatados e taxa de conversao, sempre no escopo do tenant."),
  item("6.9", "WhatsApp via Meta Cloud API", "P1", "external", "Depende da verificacao Meta e configuracao de webhook/template."),
  item("6.10", "Fallback WhatsApp Web", "Risco externo", "done", "Abertura controlada do WhatsApp Web/app pelo telefone do lead."),
] };

export const roadmapDays: RoadmapDay[] = rawRoadmapDays.flatMap((day) => {
  if (day.day !== 5) return [day];
  return [{ ...day, items: dayFiveItems }, daySix];
});

export const roadmapItems = roadmapDays.flatMap((day) => day.items);

export const newRoadmapItems: RoadmapItem[] = [
  item("N1", "Central Atenção agora", "P0", "done", "Reunir leads sem contato, leads estagnados, tarefas vencidas, documentos pendentes e integrações com problema em uma fila acionável. [IMPLEMENTADO LIVE ACIMA]", "Implementado em attention-center.ts, central-atencao-widget.tsx e /roadmap: contagens e idade do item mais antigo usam consultas reais escopadas por tenant, papel, filial e responsável. Configuração global reversível pelo Super-admin, com auditoria. Os atalhos abrem filtros equivalentes em Leads e Tarefas, a fila documental para Gestor/Diretor e Integrações apenas para Diretor; corretores não recebem ações que não podem concluir. Datas atravessam abas como ISO com fallback seguro. Lint e build de produção validados em 14/07/2026."),
  item("N2", "Próxima ação do lead", "P0", "done", "O detalhe do lead agora identifica a primeira tarefa pendente, mostra responsável, prioridade, prazo e botão principal; quando não há tarefa, recomenda a ação conforme o status e as pendências reais.", "Implementado em lead-action-hub.tsx e no detalhe /leads/[id], com tarefas escopadas por tenant e cargo, atalhos compactos para conversa, tarefas, cotação e documentos, além de conclusão auditada de tarefas. A área foi refinada para separar CTA principal, metadados e atalhos sem botões largos ou textos comprimidos. Type-check e build validados."),
  item("N3", "Busca global completa", "P0", "done", "A busca do cabeçalho agora pesquisa leads, clientes, cotações, tarefas e equipe em uma única experiência, com resultados agrupados e links diretos.", "API autorizada em /api/search, debounce no overlay Ctrl/Cmd+K, estados de carregamento/erro/vazio e controle reversível pelo Super-admin com auditoria."),
  item("N4", "Fila Minha operação", "P0", "done", "Criar uma visão diária para o Corretor com leads prioritários, tarefas, conversas pendentes, cotações e meta.", "Implementado em /minha-fila com seções de tarefas pendentes, conversas aguardando resposta, cotações recentes e progresso de metas, além da fila de leads existente. A página também exibe tarefas vencidas como badge no cabeçalho e leads com mensagens recebidas sem resposta. Type-check e build de produção validados em 14/07/2026."),
  item("N5", "Checklist de fechamento e pós-venda", "P0", "done", "Validar cliente, plano, documentos, cotação, responsável e comissão antes e depois da conversão.", "Implementado em /checklist com abas de pré-conversão (leads em negotiation, documentation_pending, under_analysis) e pós-conversão (convertidos nos últimos 30 dias), validação de 6 itens por lead (plano, e-mail, cotação, aceite, documentos, comissão), progresso visual e atalho para o lead. Rota protegida por proxy e link na sidebar do Corretor. Type-check e build de produção validados em 14/07/2026."),
  item("N6", "Filtros rápidos salvos", "P1", "done", "Disponibilizar filtros prontos para meus leads, sem contato, estagnados, cotação enviada e documentação pendente.", "Implementado em /leads: filtros nomeados são salvos localmente por tenant e usuário, podem ser reaplicados em um clique e preservam busca, status e filial sem misturar preferências entre contas."),
  item("N7", "Notificações acionáveis", "P1", "done", "Adicionar prioridade, filtros, agrupamento e destino contextual para cada aviso.", "Implementado em /notificacoes: filtros por todas, não lidas e ação necessária; prioridade derivada do tipo; destaque visual para urgências; contagem real; e links contextuais para o lead relacionado."),
  item("N8", "Histórico de alterações do lead", "P1", "planned", "Exibir quem alterou status, responsável, atendimento, cotação, documentos e conversão.", "Manter rastreabilidade sem obrigar o usuário a consultar auditorias separadas."),
  item("N9", "Resumo diário do Diretor", "P1", "planned", "Apresentar o que foi resolvido, o que ficou em risco e quem precisa agir no próximo dia.", "Fechar o ciclo de gestão com uma visão curta e útil."),
  item("N10", "Indicador de prontidão dos módulos", "P1", "planned", "Mostrar se catálogo, WhatsApp, documentos, comissões e metas estão prontos, incompletos ou dependentes de terceiros.", "Evitar que o cliente descubra uma dependência somente depois de clicar em uma ação."),
  item("N11", "Lembretes de retorno", "P1", "done", "Dialog com presets hoje/amanha/data personalizada cria tarefa de retorno no lead, com auditoria e revalidacao da pagina.", "Implementado em lead-reminder.tsx com quickReminderAction (server action), dialog com 3 opcoes (hoje as 18h, amanha as 9h, data personalizada), persistencia em lead_tasks com assignee e auditoria. Integrado aos atalhos do LeadActionHub na pagina de detalhe do lead."),
  item("N12", "Modelos de mensagens", "P1", "planned", "Oferecer modelos editáveis para primeiro contato, cotação, documentos, follow-up e pós-venda.", "Acelerar o atendimento mantendo revisão antes do envio."),
  item("N13", "Visão sem atividade", "P1", "planned", "Encontrar leads sem tarefa futura, sem próxima ação ou sem contato recente.", "Revelar oportunidades esquecidas antes que virem perdas."),
  item("N14", "Comparativo simples de equipe", "P2", "planned", "Comparar leads recebidos, atendimento, conversão, primeiro contato e tarefas vencidas por filial ou corretor.", "Apoiar decisões sem criar um módulo de BI complexo."),
  item("N15", "Exportações simples e auditadas", "P2", "planned", "Exportar leads filtrados, clientes, tarefas, documentos e relatórios permitidos.", "Entregar os dados usados na rotina administrativa com controle de permissão."),
  item("N16", "Favoritos", "P2", "planned", "Permitir favoritar leads, clientes, filtros e relatórios usados com frequência.", "Reduzir o caminho para registros estratégicos."),
  item("N17", "Atalhos de teclado", "P2", "planned", "Adicionar atalhos para busca, novo lead, tarefas, conversas e fechamento de drawers.", "Acelerar usuários de desktop sem alterar o fluxo por mouse ou toque."),
  item("N18", "Tutoriais de configuração reutilizáveis", "P1", "partial", "Criar um padrão de configuração guiada para capacidades que exigem várias etapas, com drawer, progresso, etapas bloqueadas, retomada e sucesso.", "SetupTutorialDrawer implementado em src/components/setup/setup-tutorial-drawer.tsx e aplicado ao botão de WhatsApp em /conversas. O estado das etapas vem da conexão escopada por tenant e usuário, o retorno interno é validado e o padrão está documentado em docs/setup-tutorial-pattern.md. Adoção em outras capacidades ainda está pendente."),
  item("N19", "Financeiro por papel e governança", "P0", "planned", "Adaptar o Financeiro para Corretor, Gestor e Diretor, com escopo próprio, unidade e corretora consolidada; tornar parâmetros editáveis, operações auditáveis e capacidades controláveis pelo Super-admin.", "Plano registrado em docs/product/financeiro-role-based-plan.md. A implementação depende da aprovação das decisões DEC-004 (regra de comissão) e DEC-012 (visibilidade multi-filial); a primeira fatia será a fundação de consultas e permissões seguida do resumo pessoal do Corretor."),
  item("N20", "Cargos e filtro de equipe por unidade", "P1", "done", "Permitir criar colaboradores com cargos de Gestor, Corretor, Marketing, Financeiro, Operações e Suporte; exigir unidade e filtrar a lista por filial para o Diretor.", "Cargo foi separado do perfil de acesso em tenant_memberships.job_title, com migration drizzle/0029_team_job_titles.sql. /equipe agora exibe cargo e perfil, exige unidade no formulário, permite filtro por unidade e registra criação, edição e ativação/desativação em audit_logs. Type-check e build validados."),
  item("N21", "Arquitetura Plugin First", "P1", "partial", "Evoluir o CorreTop como plataforma modular: domínios com use cases públicos, plugins contextuais, hosts desacoplados, eventos tipados, feature flags e governança do Super-admin.", "Direção registrada em docs/plugin-first-architecture.md e DEC-025. A Fase 1.1 foi fortalecida com PluginManifest, Registry, guards de RBAC/feature flag/host, lifecycle, Event Bus tipado, Error Boundary e testes em src/platform/plugins e src/platform/events. Conversation Engine, host real de /conversas e plugins de Lead/Cotação/Documentos continuam pendentes."),
  item("N22", "Sidebar por permissão", "P1", "done", "Todos os itens das sidebars principal e financeira devem declarar permissão e desaparecer para papéis sem acesso.", "Itens da CorreTopSidebar e CorreTopFinanceiroSidebar agora possuem PermissionKey explícita e são filtrados centralmente por hasPermission; papel ainda não resolvido não renderiza itens. O menu financeiro pessoal e de unidade passa a ser consequência da mesma matriz RBAC. Type-check e build validados."),
  item("N23", "Reconciliação rápida da conexão WhatsApp", "P0", "done", "Reconhecer a confirmação do QR Code rapidamente e manter o status consistente mesmo se o dialog for fechado.", "O webhook de session.status agora persiste o estado normalizado e o dialog consulta o provedor a cada 700ms enquanto aguarda, limpa o QR ao conectar e atualiza a rota sem refresh manual. O polling também faz uma reconciliação final ao fechar o dialog."),
  item("N24", "Distribuição de leads por unidade e fila", "P0", "partial", "Implementar Inbox geral, routing para unidade, filas, atribuição manual/automática, capacidade, plantões, auditoria e governança.", "Fase vertical entregue em /leads/distribuicao e /leads/distribuicao/plantao: schema 0030, serviços em src/features/lead-distribution, ações atômicas, notificações, testes de domínio e ajuda em /guia. Jobs de processamento/recuperação e superfície específica do Super Admin ainda precisam ser conectados."),
];
