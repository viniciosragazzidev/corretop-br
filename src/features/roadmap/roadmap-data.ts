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
    item("4.4", "Detalhe do lead com acoes", "P0", "done", "Contato, status, responsavel, timeline e inicio do atendimento ficam na mesma tela.", "Corretor responsavel pode iniciar atendimento, registrar o status in_contact e abrir o WhatsApp Web/app do lead."),
    item("4.5", "Confirmacao para acoes criticas", "P0", "done", "Dialog de perda e validacoes de status implementados."),
    item("4.6", "Home do Corretor", "P1", "done", "Dashboard pessoal com dados reais da carteira, fila atribuída, disponibilidade e estados vazios.", "Leads e interações agora vêm do PostgreSQL no escopo do corretor; metas, SLA e renovações permanecem mascarados como backlog."),
    item("4.7", "Home do Gestor", "P1", "done", "Resumo real da equipe e da filial com indicadores de leads, responsáveis e atendimento.", "Equipe e funil básico agora vêm do PostgreSQL; alertas SLA, documentos e metas permanecem explicitamente planejados."),
    item("4.8", "Seletor de filial ativa", "P1", "done", "Gestores e Diretores podem filtrar a fila por filial ativa sem quebrar o isolamento do tenant.", "LeadsFilters carrega filiais reais do tenant e aplica o branch_id na consulta server-side."),
    item("4.9", "Estado vazio da fila", "P2", "done", "Estado vazio com orientacao de proximo passo implementado."),
    item("4.10", "Tarefas colaborativas", "P1", "done", "A rota /tarefas lista ações no escopo do usuário; tarefas urgentes aceitam múltiplos corretores ativos da filial, com validação e auditoria."),
    item("4.11", "Kanban de leads responsivo", "P2", "done", "Kanban refinado com colunas de largura estável, rolagem horizontal e cards com quebra segura para evitar sobreposição de textos.", "LeadsWorkspace recebeu uma composição de funil mais legível, com cabeçalhos semânticos, estados vazios e cards com limites de texto. Lint específico e build de produção validados em 14/07/2026."),
    item("4.12", "Central de conversas", "P1", "done", "Inbox de WhatsApp por escopo, com lista pesquisável, histórico, perfil do cliente e ações de atendimento sem simular integrações externas.", "Nova rota /conversas consulta leads e mensagens no tenant da sessão, restringe corretores à própria carteira e gestores à filial ativa. O workspace reutiliza as Server Actions do chat, inclui atalhos de cotação/planos, ligação e WhatsApp. Refinamento de hierarquia, leitura dos cards, item de conversa compacto, painel rápido e perfil retrátil/redimensionável concluído; rolagem isolada evita ultrapassar a viewport. Lint e build de produção validados em 14/07/2026."),
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
];

const daySix: RoadmapDay = { day: 6, title: "Comissao, pos-venda, metas e WhatsApp", objective: "Concluir o motor financeiro e os fluxos de pos-venda.", items: [
  item("6.1", "Regras de comissao", "P0", "planned", "Configuracao de comissao ainda pendente."),
  item("6.2", "Cronograma de repasse", "P0", "planned", "Geracao de repasses ainda pendente."),
  item("6.3", "Marcacao manual de comissao paga", "P1", "planned", "Baixa de comissoes ainda pendente."),
  item("6.4", "Exportacao de relatorio de comissao", "P0", "planned", "Relatorio financeiro ainda pendente."),
  item("6.5", "Cliente ativo ao converter venda", "P1", "done", "Conversao cria cliente isolado por tenant e o disponibiliza em /clientes."),
  item("6.6", "Alertas de renovacao/aniversario", "P2", "done", "Job diario cria notificacoes in-app para aniversarios de contrato nos proximos 30 dias, deduplicadas por cliente e destinatario.", "Usa clients.convertedAt como aniversario de contrato ate existir uma data contratual especifica; push permanece dependencia externa."),
  item("6.7", "Reengajamento automatico de perdidos", "P2", "planned", "Automacao de mensagens ainda pendente."),
  item("6.8", "Metas comerciais", "P1", "planned", "Persistencia e calculo de metas ainda pendentes."),
  item("6.9", "WhatsApp via Meta Cloud API", "P1", "external", "Depende da verificacao Meta e configuracao de webhook/template."),
  item("6.10", "Fallback WhatsApp Web", "Risco externo", "done", "Abertura controlada do WhatsApp Web/app pelo telefone do lead."),
] };

export const roadmapDays: RoadmapDay[] = rawRoadmapDays.flatMap((day) => {
  if (day.day !== 5) return [day];
  return [{ ...day, items: dayFiveItems }, daySix];
});

export const roadmapItems = roadmapDays.flatMap((day) => day.items);
