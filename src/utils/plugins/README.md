# Plugins

Ponto central para capacidades reutilizáveis acionadas por eventos, botões,
jobs ou APIs internas.

## Regras

- Toda execução deve validar entrada e autorização no servidor.
- Tenant, unidade, usuário e destinatário vêm do contexto confiável.
- Toda execução deve ser auditável, idempotente e controlada por feature flag.
- Plugins não acessam banco diretamente sem passar por um caso de uso escopado.
- Canais como push e WhatsApp devem ser adaptadores independentes.
- Não carregar código arbitrário ou plugins remotos nesta fase.

## Estado da migração

O núcleo existente em `src/platform/plugins` continua sendo a implementação de
governança. Esta pasta será o ponto público de contratos, ações e adaptadores,
sem duplicar o registry atual.
