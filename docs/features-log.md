# Histórico de Funcionalidades Adicionadas (Features Log)

Este documento registra todas as funcionalidades e melhorias de engenharia adicionadas ao **CorreTop**, organizadas por área e funcionalidade, para manter a rastreabilidade do sistema.

---

## ⚡ 1. Sincronização em Tempo Real & Notificações Instantâneas
Notificações e atualização automática das telas do dashboard em tempo real, sem necessidade de atualizar a página (F5).

*   **Arquivos Criados/Modificados**:
    *   [realtime-sync-provider.tsx](file:///c:/Users/kyper/Desktop/Kyper/Projects/corretopV2/corretop/src/components/providers/realtime-sync-provider.tsx) (Provedor Client-side WebSocket)
    *   [send-push-helper.ts](file:///c:/Users/kyper/Desktop/Kyper/Projects/corretopV2/corretop/src/features/notifications/send-push-helper.ts) (Disparador de Push Server-side)
    *   [layout.tsx](file:///c:/Users/kyper/Desktop/Kyper/Projects/corretopV2/corretop/src/app/(dashboard)/layout.tsx) (Integração Global no app)
    *   [client.ts](file:///c:/Users/kyper/Desktop/Kyper/Projects/corretopV2/corretop/src/shared/db/client.ts) (Configuração de Replicação da tabela `leads`)
*   **Comportamento por Cargo**:
    *   **Corretor**: Recebe um toast visual + sinal sonoro de sucesso quando um lead é distribuído pessoalmente para ele.
    *   **Gestor**: Recebe um toast + som de sino quando um novo lead chega na unidade/filial dele.
    *   **Diretor**: Recebe um toast + som de sino quando qualquer lead chega no tenant.
*   **Efeitos Sonoros**: Sintetizados dinamicamente no navegador via Web Audio API com a biblioteca **Cuelume** (sem dependência de arquivos `.mp3` estáticos).
*   **Web Push (Offline)**: Disparo automático de Push Notifications em background para o navegador do usuário caso ele esteja fora do sistema ou com a aba minimizada.

---

## 👥 2. Gestão de Equipe & Permissões por Unidade
Regras de escopo de dados e interfaces para diferenciar a atuação dos cargos dentro da corretora.

*   **Arquivos Criados/Modificados**:
    *   [director-wizard.tsx](file:///c:/Users/kyper/Desktop/Kyper/Projects/corretopV2/corretop/src/features/onboarding/components/director-wizard.tsx) (Onboarding do Diretor)
    *   `src/app/(dashboard)/equipe/` (Telas de listagem e convite de membros)
*   **Diferenças por Cargo**:
    *   **Diretor**: Acesso total a todas as filiais, relatórios consolidados e controle total das configurações.
    *   **Gestor**: Associado a uma ou mais filiais específicas, controlando apenas as oportunidades e corretores dessas unidades.
    *   **Corretor**: Acesso restrito apenas ao seu próprio painel de leads e à sua unidade pessoal.

---

## 🎨 3. Redesign da Tela de Login & Componentes Visuais
Nova interface centralizada, moderna e alinhada ao design system padrão claro (light theme) do sistema.

*   **Arquivos Criados/Modificados**:
    *   `src/app/(auth)/login/` (Layout e formulários de autenticação)
    *   `src/components/ui/badge.tsx` (Estilos globais de tags)
*   **Melhorias Visuais**:
    *   Formulário de login elegante e centralizado com campos de "Lembrar senha", "Esqueci a senha" e links de Termos de Uso.
    *   Correção no redirecionamento pós-login (resolvendo o erro de sincronização de cookies de sessão que exigia F5).
    *   Modernização de badges e tags de status (ex: Leads "Novos", "Em Atendimento", "Ganhos"), adicionando cores semânticas vibrantes e ícones modernos.

---

## 📊 4. PRD e Roteiro de Testes Automatizados
Documento completo de requisitos de produto estruturado para alimentação de robôs de testes automatizados (E2E).

*   **Arquivos Criados/Modificados**:
    *   [PRD_AUTOMATED_TESTING.md](file:///c:/Users/kyper/Desktop/Kyper/Projects/corretopV2/corretop/docs/PRD_AUTOMATED_TESTING.md)
*   **Conteúdo**:
    *   Mapeamento de 9 fluxos críticos de ponta a ponta (login com 2FA, ingestão por webhook, distribuição round-robin, cotação de planos, upload de documentos e fechamento de vendas).

---

## ⚙️ 5. Ajustes de Layout e Formulários Operacionais
Correção de quebras de tabelas e drawers na área de administração.

*   **Arquivos Criados/Modificados**:
    *   `src/features/catalog/` (Drawers de adição de planos e operadores)
*   **Melhorias**:
    *   Aumento da largura útil (width) dos drawers laterais para exibição limpa e sem cortes horizontais das tabelas de planos e listagem de operadores.
    *   Correção de selects vazios nos detalhes do lead (carregamento reativo de dados).
