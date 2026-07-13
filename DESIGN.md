# CorreTop - Sistema de Design Operacional

> Versão 3.0. Tema base: light. Dark mode continua suportado pelos mesmos tokens.

Este documento é a fonte de verdade visual do CorreTop. Se algo estiver diferente daqui, o arquivo precisa ser atualizado antes de criar nova variação de UI.

## Direção visual

- Produto de operação para corretoras.
- Interface clara, técnica e confiável.
- Densidade alta, mas organizada por camadas.
- Azul CorreTop é o accent principal. Ele aparece com intenção, não em excesso.
- Status usam cores semânticas próprias. Accent nunca deve representar status.

## Regras obrigatórias

1. Sempre usar componentes reutilizáveis de `src/components/ui/`.
2. Evitar estilos locais repetidos em componentes que fazem a mesma coisa.
3. Não criar botões, inputs, badges ou cards com tamanhos próprios sem justificativa.
4. Padronizar tipografia, espaçamento, raio e bordas usando tokens.
5. Não hardcodar cores de superfície em telas específicas.
6. Toda variação nova deve nascer no componente compartilhado, não na página.
7. Usar `transitions-dev` para motion curto e útil.
8. Respeitar `prefers-reduced-motion`.

## Estrutura de tema

O tema trabalha com as mesmas variáveis nos dois modos.

### Light mode

- Canvas claro.
- Cards e popovers levemente mais elevados que o fundo.
- Texto principal escuro, nunca preto puro.
- Borda visível, mas discreta.
- Accent azul para ação principal, foco, seleção e links.

### Dark mode

- Mesmas relações de hierarquia.
- Mesmos nomes de token.
- Só os valores mudam.

## Tokens semânticos

### Superfícies

| Papel | Token | Uso |
|---|---|---|
| Base da página | `--background` | fundo principal |
| Card | `--card` | painéis e blocos |
| Elevado | `--popover` | menus, sheets, dialogs |
| Sidebar | `--sidebar` | shell lateral |
| Borda | `--border` | separação estrutural |
| Input | `--input` | campos e controles |

### Texto

| Papel | Token | Uso |
|---|---|---|
| Primário | `--foreground` | títulos e corpo principal |
| Secundário | `--muted-foreground` | metadados e suporte |
| Inverso | `--primary-foreground` | texto sobre accent |

### Accent e semântica

| Papel | Token | Uso |
|---|---|---|
| Accent principal | `--primary` | CTA, link ativo, foco |
| Accent suave | `--accent` | hover e seleção leve |
| Sucesso | `--success` | confirmação, concluído |
| Atenção | `--warning` | pendência, alerta moderado |
| Erro | `--destructive` | falha, remoção, bloqueio |

### Sidebar

| Papel | Token | Uso |
|---|---|---|
| Texto | `--sidebar-foreground` | navegação e metadados |
| Accent | `--sidebar-accent` | item ativo e hover |
| Accent texto | `--sidebar-accent-foreground` | conteúdo sobre destaque |
| Borda | `--sidebar-border` | divisões e shell |
| Foco | `--sidebar-ring` | foco e seleção |

## Hierarquia visual

1. O mais importante precisa ser lido em menos de 2 segundos.
2. Título, subtítulo e ação principal devem ter contraste claro entre si.
3. Não usar o mesmo peso tipográfico para tudo.
4. Texto secundário nunca pode parecer desabilitado se ainda for informativo.
5. Um painel não deve competir com outro painel sem motivo.

## Tipografia

- Família principal: Geist.
- Títulos: 24 a 30 px para páginas, 16 px para cards.
- Texto de apoio: 12 a 14 px.
- Números importantes: usar `tabular-nums`.
- Evitar fontes extras fora do sistema.

## Espaçamento e forma

- Raio base: 8 px.
- Pads e gaps sempre repetidos por escala.
- Cards, inputs e botões devem seguir o mesmo vocabulário de tamanho.
- Nenhuma tela deve inventar um raio novo por conta própria.

## Motion

- Movimento deve reforçar estado, não decorar a UI.
- Use motion para transições de tabs, abertura de painel, loading e feedback.
- Evite animação em tabela, métricas e listas densas.
- Se houver animação, ela precisa respeitar redução de movimento.

## Componentes padrão

- Botões: `Button`
- Cartões: `Card`
- Status e etiquetas: `Badge`
- Campos: `Input`, `Select`, `Textarea`, `Checkbox`
- Estrutura lateral: `Sidebar`
- Overlays: `Sheet`, `Dialog`, `Tooltip`
- Tabelas: `Table`
- Feedback: `Toaster`

## Estados obrigatórios

Toda tela importante precisa prever:

- loading
- empty
- error
- hover
- focus
- disabled

## Regras de consistência

- Não misturar estilos locais com tokens para o mesmo tipo de componente.
- Não variar altura de botões iguais em telas diferentes.
- Não variar padding de cards sem uma razão de hierarquia.
- Não usar uma cor de marca diferente por módulo.
- Não introduzir sombra pesada sem necessidade.

## Checklist de aceite

- [ ] O tema light usa tokens semânticos e não hex solto na página.
- [ ] Dark mode continua funcional com os mesmos nomes de token.
- [ ] O sistema tem pelo menos 3 camadas de superfície.
- [ ] Accent, status e navegação não se confundem visualmente.
- [ ] Componentes reutilizáveis cobrem o que é repetido.
- [ ] Motion é curto, útil e respeita redução de movimento.
- [ ] A tela continua legível em teclado e em contraste baixo.

## Observação para IA

Antes de criar qualquer tela nova:

1. Ler este arquivo.
2. Reusar os componentes existentes.
3. Conferir se a variação nova precisa entrar no componente compartilhado.
4. Manter o tema consistente com os tokens aqui definidos.

## Referência de dashboard

As referências Nexus anexadas pelo usuário orientam a composição do CorreTop, sem copiar marca, nomes ou métricas fictícias. O padrão é um shell lateral persistente, cabeçalho compacto com busca global, cards curtos na primeira linha, gráfico principal com leitura comparativa na segunda e tabela/alertas na terceira.

Use `--chart-1` a `--chart-5` para visualizações. No light mode, o canvas é cinza muito claro com cards brancos e bordas suaves; no dark mode, a hierarquia usa carvão, grafite e texto claro. Violeta, azul e teal são reservados para dados de gráfico, não para substituir os estados semânticos de sucesso, atenção e erro.

