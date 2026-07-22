# Status da conta WhatsApp empresarial

## Objetivo

A área de WhatsApp do Diretor usa a conta oficial da Meta como fonte principal para
decisão operacional. A visualização deve responder rapidamente se a conta está ativa,
pausada, incompleta ou ainda não conectada.

## Dados exibidos

- situação operacional da conta;
- nome verificado e número oficial;
- qualidade e limite de mensagens;
- Business ID, WABA ID e Phone Number ID;
- data de ativação e último webhook recebido.

Os dados são consultados no servidor com escopo do tenant. Tokens e material de
criptografia nunca são enviados ao navegador, registrados em logs ou exibidos na UI.

## Governança

Somente o Diretor pode conectar, ativar ou pausar a conta oficial. A mutação existente
permanece validada no servidor e registrada em auditoria. O Super-admin pode desativar
a capacidade por feature flag.

## Legado

A conexão QR é apresentada em um card separado como conexão pessoal legada opcional.
Ela não representa nem altera o status da conta empresarial.
