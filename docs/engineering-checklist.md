# Checklist de Engenharia

## Antes de iniciar uma feature

- [ ] Requisito/RF e regras de negocio afetadas identificados.
- [ ] Nao ha decisao bloqueante pendente para o comportamento proposto.
- [ ] Rota, dominio e contrato de dados definidos sem misturar UI e regra de negocio.
- [ ] Componentes existentes em `src/components/ui/` e `src/components/unlumen-ui/` avaliados antes de criar controles.
- [ ] Documentacao local da versao instalada do Next.js consultada.
- [ ] Nenhuma dependencia nova e necessaria sem autorizacao explicita.
- [ ] Dados pessoais, LGPD, tenant e permissoes avaliados.

## Antes de considerar pronta

- [ ] Entradas externas validadas no servidor.
- [ ] Autorizacao, tenant e escopo de responsavel/filial aplicados no servidor.
- [ ] Operacoes sensiveis registram auditoria sem vazar conteudo.
- [ ] Logica critica testavel de modo deterministico e testes adequados incluidos.
- [ ] Interface possui estados de carregamento, vazio, erro e permissao quando aplicavel.
- [ ] Controles e estilos repetiveis usam componentes/tokens shadcn/Unlumen compartilhados.
- [ ] Interface segue `DESIGN.md`, e navegavel por teclado e nao usa apenas cor para estado.
- [ ] Regras, decisoes e ADRs atualizados quando comportamento/arquitetura mudou.
- [ ] Codigo passa por lint, type-check, testes e build disponiveis.
- [ ] `npm run build` foi executado e passou antes da entrega.
- [ ] Alteracao pequena, coesa e commit segue Conventional Commits.
- [ ] Item correspondente de `/roadmap` atualizado com status, descricao da implementacao,
  resumo tecnico, arquivos/fluxos afetados e validacoes executadas.
- [ ] Status `done` usado somente quando o escopo estiver completo; entregas incompletas usam
  `partial` e registram claramente o trabalho restante.
- [ ] Mutações interativas têm feedback otimista, rollback e invalidação/reconciliação
  após a resposta do servidor.
- [ ] Cache local usa chaves com `tenantId` e `userId`; estados local/confirmado/erro
  usam tokens semânticos compatíveis com claro e escuro.
