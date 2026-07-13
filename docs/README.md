# Documentação do CorreTop

## Como usar este diretório

| Documento | Finalidade | Fonte/estado |
|---|---|---|
| `../CorreTop_Documento_Requisitos.md` | Requisitos, escopo e pesquisa de produto | Fonte de referência v1.0 |
| `../CorreTop_Arquitetura_Desenvolvimento.md` | Arquitetura e processo de engenharia | Fonte de referência |
| `../DESIGN.md` | Sistema de design e UX | Norma visual vigente |
| `ui-foundation.md` | Uso obrigatório de shadcn, Unlumen e motion | Norma de UI vigente |
| `../AI_RULES.md` | Instruções operacionais para IA | Norma de execução vigente |
| `business-rules.md` | Regras de domínio consolidadas e rastreáveis | Norma de comportamento vigente |
| `product/resume-dashboard-plan.md` | Conteúdo e prioridades da home executiva `/resume` | Plano de produto vigente |
| `product/corretor-resume-dashboard-plan.md` | Conteúdo e prioridades da home pessoal do Corretor | Plano de produto vigente |
| `decision-log.md` | Decisões tomadas e pendências | Controle de decisão vigente |
| `engineering-checklist.md` | Critérios para iniciar e concluir trabalho | Norma de qualidade vigente |
| `adr/` | Decisões de arquitetura imutáveis | Criar quando houver decisão relevante |

## Processo de mudança

1. Identifique o RF/RNF afetado e atualize a regra de negócio correspondente.
2. Caso haja escolha de produto ou arquitetura, registre-a em `decision-log.md`; crie
   ADR quando a decisão for duradoura e tiver alternativas relevantes.
3. Atualize requisitos ou design quando a mudança alterar contrato, experiência ou
   escopo.
4. Só então implemente e valide pelo checklist de engenharia.

O arquivo de requisitos preserva o contexto completo. O catálogo de regras não o
substitui: ele torna o que é implementável, testável e auditável mais fácil de localizar.
# Referencia de UX

Consulte `ux-audit-2026-07-13.md` para a auditoria heuristica, hipoteses de pesquisa
e backlog prioritario de clareza e reducao de carga cognitiva. As regras obrigatorias
correspondentes estao em `../AI_RULES.md` e no pre-flight de `engineering-checklist.md`.
