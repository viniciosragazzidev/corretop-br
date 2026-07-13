# Design QA - Dashboard `/diretor/resume`

## Referências comparadas

- **Fonte visual:** `C:/Users/kyper/AppData/Local/Temp/codex-clipboard-9a40fc47-9ade-47dd-a15a-8b8fbf729248.png`
- **Implementação:** `artifacts/design-qa/resume-dashboard-dark.png`
- **Viewport:** 1280 × 720, desktop, estado inicial.
- **Escopo:** a referência define o shell escuro, sidebar, header, tabs, cards, painéis
  analíticos e tabela. O conteúdo foi substituído pelos dados executivos demonstrativos
  do CorreTop.

## Histórico de comparação

1. **P1 - tema e tipografia divergentes.** A primeira captura usava a paleta clara e
   fallback serif do shadcn. Corrigido centralizando os tokens escuros em
   `src/app/globals.css`, ativando o tema no layout e declarando Geist como fonte raiz.
2. **P2 - alertas comprimidos junto à sidebar.** Corrigido com grade de duas colunas na
   largura intermediária e quatro colunas somente em telas extra largas.
3. **P2 - dashboard genérica duplicada.** O exemplo do `dashboard-01` foi removido
   depois da extração de seus primitivos. A rota CorreTop usa o mesmo shell shadcn sem
   manter uma segunda página de demonstração.

## Evidência funcional

- A tab `Conversões` recebe `aria-selected="true"` e move o indicador `t-tabs`.
- `Atualizar` mostra quatro instâncias do `ShimmerSkeleton` Unlumen antes de restaurar
  os indicadores.
- Busca por filial reduz as linhas da tabela.
- Console do navegador: nenhum erro.

## Superfícies de fidelidade

- **Tipografia:** Geist, títulos compactos, métricas com números tabulares e metadados
  discretos.
- **Layout e ritmo:** sidebar de largura fixa, header baixo, divisórias finas, cards
  compactos e grid de análise seguem a hierarquia da referência.
- **Cores e tokens:** canvas `#111111`, superfícies `#171717`, bordas `#2B2B2B` e
  ação primária clara. Azul fica reservado aos estados do CorreTop.
- **Ícones e assets:** Phosphor é a única família de ícones usada pela dashboard.
  Não há fotos, ilustrações ou logos raster necessários neste fluxo operacional.
- **Copy:** textos refletem SLA, documentos, integridade, conversão e metas, todos os
  valores estão marcados como demonstrativos.

## Follow-up polish

- [P3] Capturar novamente a visão mobile quando o controle de viewport do navegador
  estiver disponível para validar a abertura do sidebar off-canvas.
- [P3] Conectar os dados demonstrativos às queries escopadas por tenant após os módulos
  de domínio estarem disponíveis.

## Final result

passed

---

# Design QA - Resumo `/corretor/resumo`

## Referências comparadas

- **Fonte visual:** o shell escuro de referência usado no dashboard CorreTop.
- **Implementação:** `artifacts/design-qa/corretor-resume-dark.png`.
- **Viewport:** 1280 × 720, desktop, estado inicial.
- **Escopo:** o mesmo sistema visual do painel executivo, adaptado para uma rotina pessoal
  de corretor: ação imediata, urgências, placar individual e fila de trabalho.

## Evidência funcional

- A navegação não expõe Equipe, Filiais, Integridade, Relatórios globais ou itens de tenant.
- O botão `SLA em risco` filtra a busca da fila e leva o foco visual para a tabela.
- `Atualizar` preserva o contorno da página com `ShimmerSkeleton` Unlumen.
- `Disponível para leads` alterna de forma explícita para `Recebimento pausado`.
- O documento e o elemento principal não possuem overflow horizontal no viewport desktop.

## Superfícies de fidelidade

- O cartão de próxima ação recebe a maior prioridade visual e comunica risco com texto e cor.
- Sidebar, header baixo, divisórias, cards, tabela e tipografia preservam a densidade do
  dashboard de referência sem repetir os indicadores de direção.
- Todos os controles usam componentes shadcn existentes; ícones seguem a família Phosphor.
- Valores estão identificados como demonstrativos até a integração com dados do domínio.

## Final result

passed
