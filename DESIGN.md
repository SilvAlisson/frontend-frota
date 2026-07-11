---
name: Frota KLIN
description: Sistema operacional de frota da KLIN Engenharia e Gestão Ambiental — controle de abastecimentos, manutenções, jornadas e RH em campo e escritório.
colors:
  primary: "#2d7d8a"
  primary-light: "#68b4c0"
  primary-deep: "#1a4f58"
  primary-soft: "#f0f8fa"
  sea-green: "#3da87c"
  background-light: "#f9fcfc"
  surface-light: "#fefffe"
  text-main-light: "#1e2530"
  text-secondary-light: "#485060"
  text-muted-light: "#7a8494"
  border-light: "#dde4e8"
  background-dark: "#151b26"
  surface-dark: "#1c2434"
  text-main-dark: "#eef2f5"
  error: "#d9512a"
  warning: "#c8962a"
  success: "#3da87c"
typography:
  display:
    fontFamily: "Barlow, ui-sans-serif, system-ui"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow, ui-sans-serif, system-ui"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Chivo, ui-sans-serif, system-ui"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Chivo, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Chivo, ui-sans-serif, system-ui"
    fontSize: "0.625rem"
    fontWeight: 900
    letterSpacing: "0.2em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "14px"
  "2xl": "16px"
  "3xl": "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-main-light}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-main-light}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  input-default:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-main-light}"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 16px"
  card-default:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.2xl}"
    padding: "16px 24px"
---

# Design System: Frota KLIN

## 1. Overview

**Creative North Star: "O Sistema Premium Interno"**

O Frota KLIN é a ferramenta interna que parece tão boa quanto qualquer SaaS do mercado — construída especificamente para uma empresa que valoriza excelência. A estética não é decorativa; ela é funcional. Quando o sistema parece profissional e cuidado, os usuários confiam nele com dados reais de operação, quilometragem e finanças de frota.

O sistema serve dois mundos ao mesmo tempo: o gestor no escritório que precisa de densidade e clareza para tomar decisões em segundos, e o operador em campo que precisa completar um registro em menos de 2 minutos, com uma mão ocupada e pressa. O design resolve essa tensão com hierarquia tipográfica forte, toque-alvo generoso (mínimo 44px) e uma paleta que funciona igualmente bem num monitor 27" sob luz de escritório e num celular ao sol.

A identidade visual ancora na cor institucional da KLIN — teal oceânico profundo (OKLCH hue 215), derivada da logo da KLIN Engenharia e Gestão Ambiental. Não é um acento decorativo; é a cor que carrega autoridade, ação e progresso em toda a interface.

**Key Characteristics:**
- Teal oceânico como cor de identidade — presente, não decorativa
- Tipografia de dois pesos: Barlow (display/headers, weight 800–900) + Chivo (body/labels, weight 400–700)
- Touch targets mínimos de 44px em todos os elementos interativos
- Suporte real a dois temas (light/dark) com design semântico, não cosmético
- Sombras funcionais, não decorativas — indicam estado e profundidade, não estilo
- Cantos consistentemente arredondados em 12–16px em cards, 12px em inputs/buttons
- Micro-animações com `ease-out` — responsivas, nunca chamativas

## 2. Colors: A Paleta Operacional KLIN

Uma paleta contida ancorada no teal da marca, com semântica de status clara e escala de neutros que funciona em modo claro e escuro.

### Primary
- **KLIN Deep Teal** (`oklch(0.55 0.12 215)` / `#2d7d8a`): A cor de ação do sistema. Usada em botões primários, links ativos, estados de foco, indicadores de progresso e todos os elementos que demandam atenção do usuário. Sua presença sinaliza "aqui se age".
- **KLIN Teal Light** (`oklch(0.68 0.10 215)` / `#68b4c0`): Usado no dark mode como cor primária (maior luminosidade necessária para contraste AA). Também aparece em ícones secundários em temas escuros.
- **KLIN Teal Deep** (`oklch(0.40 0.08 215)` / `#1a4f58`): Hover state do botão primário. Indica profundidade e confirmação de intenção.
- **KLIN Teal Soft** (`oklch(0.97 0.02 215)` / `#f0f8fa`): Background suave para blocos de destaque, badges de status neutro e áreas de informação não-crítica.

### Secondary
- **KLIN Sea Green** (`oklch(0.68 0.12 165)` / `#3da87c`): A cor do sucesso operacional — confirmações, operações concluídas, status "ativo". Derivada da asa direita do logo KLIN.

### Tertiary
- **Error Amber** (`oklch(0.63 0.22 29)` / `#d9512a`): Estados de erro, validações falhas, ações destrutivas. Nunca decorativa.
- **Warning Ochre** (`oklch(0.75 0.15 85)` / `#c8962a`): Alertas, estados pendentes, atenção requerida — sem urgência crítica.

### Neutral
- **Background Ice** (`oklch(0.98 0.008 215)` / `#f9fcfc`): Fundo de tela no tema claro. Branco com levíssimo toque de teal. Nunca puro branco; nunca creme.
- **Surface White** (`oklch(0.995 0.003 215)` / `#fefffe`): Superfície de cards e modais no tema claro.
- **Ink Dark** (`oklch(0.22 0.02 240)` / `#1e2530`): Texto principal no tema claro. Quase preto com leve toque azulado que harmoniza com o teal.
- **Ink Mid** (`oklch(0.40 0.02 240)` / `#485060`): Texto secundário — labels, subtítulos, metadados.
- **Ink Muted** (`oklch(0.55 0.02 240)` / `#7a8494`): Placeholders, hints, texto de suporte.
- **Border Slate** (`oklch(0.93 0.01 240)` / `#dde4e8`): Bordas de inputs, divisores de seção. Sutil o suficiente para não competir com o conteúdo.

### Named Rules
**A Regra do Teal Funcional.** O teal nunca aparece como cor de fundo de seção, gradiente decorativo ou cor de texto em elementos não-interativos. Sua função é exclusiva: ação, foco, identidade. Fora desse contexto, é diluído para o tom Soft ou removido.

**A Regra do Neutro com Hue.** Nenhum neutro é cinza puro (chroma 0). Backgrounds, superfícies e textos carregam hue 215–240 com chroma 0.005–0.02 para harmonizar subliminarmente com o teal da marca.

## 3. Typography: O Duo Industrial

**Display Font:** Barlow (Google Fonts, sans-serif condensado-industrial)
**Body Font:** Chivo (Google Fonts, sans-serif humanista)
**Mono Font:** JetBrains Mono (valores numéricos de KM, odômetro, financeiro)

**Character:** Barlow carrega a presença de um sistema que leva operações a sério — condensado, urgente, de alta autoridade. Chivo responde com legibilidade humanista para leituras longas e formulários densos. O contraste entre os dois cria hierarquia sem precisar de ornamento. JetBrains Mono aparece exclusivamente para dados numéricos críticos — diferencia dados de texto e evita ambiguidade em contexto operacional.

### Hierarchy
- **Display** (Barlow, 900, `clamp(1.5rem, 3vw, 2.25rem)`, line-height 1.1, tracking -0.02em): Títulos de página, KPIs grandes no dashboard. Raramente mais de uma linha.
- **Headline** (Barlow, 800, `1.25rem`, line-height 1.2, tracking -0.01em): Títulos de seção, cabeçalhos de modal, títulos de card.
- **Title** (Chivo, 700, `1rem`, line-height 1.3): Rótulos de grupo dentro de formulários, títulos de linha em tabelas.
- **Body** (Chivo, 400, `0.875rem`, line-height 1.5): Todo o texto de conteúdo. Max 65ch em blocos de leitura longa.
- **Label** (Chivo, 900, `0.625rem`, tracking 0.2em, UPPERCASE): Labels acima de seções, categorias de menu na sidebar, divisores de grupo.
- **Mono** (JetBrains Mono, 500, `0.875rem`, `tabular-nums`): Exclusivo para valores de KM, litros e valores financeiros.

### Named Rules
**A Regra do Uppercase Contido.** Uppercase com tracking largo (0.15em+) é reservado para Labels de navegação e divisores de seção — nunca para corpo de texto, títulos de card ou CTAs.

**A Regra do Mono nos Números.** Todo valor de KM, litro e valor financeiro usa JetBrains Mono com `tabular-nums`. Misturar font-sans em dados numéricos cria desalinhamento em tabelas e sinaliza descuido.

## 4. Elevation

O sistema usa **sombra funcional, não decorativa**: sombras existem para indicar estado e separação de camada, não como estilo visual. Em repouso, a maioria das superfícies é flat — a profundidade é criada por diferença de cor (background vs. surface) e bordas finas. Quando sombras aparecem, são tinturadas com o teal no tema claro e com preto no dark mode.

### Shadow Vocabulary
- **`shadow-card`** (`0 2px 0 0 rgba(teal-900, 0.15)`): Sombra de card em repouso no light mode. Offset sólido sem blur — cria "peso" sem flutuar.
- **`shadow-float`** (`0 4px 0 0 rgba(teal-900, 0.20)`): Modais, popovers, elementos que flutuam acima do conteúdo.
- **`shadow-button`** (`0 2px 0 0 rgba(teal-900, 0.15)`): Botões em repouso. Desaparece no hover (o botão "sobe").
- **`shadow-float-primary`** (`0 8px 24px -4px rgba(primary, 0.35)`): Exclusivo para botões de ação em destaque. Usado com parcimônia.

### Named Rules
**A Regra do Flat-by-Default.** Cards em repouso têm offset sólido de 2px, não `box-shadow` de blur. Isso cria separação física, não ambiência. Shadow com blur grande só aparece em estados de hover/focus interativos.

## 5. Components

### Buttons

Confiantes e táteis. Todos os botões têm `min-height: 44px`, feedback háptico no mobile (`navigator.vibrate(10)`), e `active:scale-[0.98]` para sensação física.

- **Shape:** `rounded-xl` (12px). Nunca pill; nunca square.
- **Primary:** Background `--primary` (teal), texto branco, `shadow-sm` em repouso. Hover: `--primary/90` + `shadow-md`.
- **Secondary:** Background `surface-hover`, texto `text-main`, borda `border/50`.
- **Outline:** Borda `border/60` de 1.5px, background transparente.
- **Ghost:** Sem background, sem borda. Hover: `surface-hover/50`.
- **Danger:** Background `--error`. Exclusivo para ações destrutivas irreversíveis.
- **Focus:** Ring 2px `primary/60` com offset 2px.

### Cards / Containers

- **Corner Style:** `rounded-2xl` (16px).
- **Background:** `--surface` sobre `--background`. Diferença de luminosidade cria camada sem sombra pesada.
- **Shadow Strategy:** `shadow-card` (offset 2px sólido, tinturado). Hover interativo: `shadow-lg` + `border-primary/50`.
- **Border:** `border border-border` (1px) em repouso.
- **Internal Padding:** `p-4 sm:p-6`. Cards de KPI: `p-4`.

### Inputs / Fields

- **Style:** Background `--surface`, borda `border/60` (1px), `rounded-xl` (12px), altura 44px. Label acima em uppercase/tracking (Chivo 900, 10px, 0.2em).
- **Focus:** Ring 2px `primary/60` + border muda para `primary`. Ícone interno muda de `text-muted` para `text-primary`.
- **Error:** Borda `--error`, ícone `AlertCircle` embutido à direita, mensagem abaixo com animação `fade-in slide-in-from-top`.
- **Mobile:** `scrollIntoView` ao focar — compensa o teclado virtual empurrando o conteúdo.

### Navigation (Sidebar)

- **Style:** Sidebar fixa 256px no desktop, fundo `--surface`, borda direita `border/60`. No mobile: Drawer via `vaul`.
- **Labels de grupo:** Uppercase, Chivo 900, 10px, tracking 0.2em, `text-muted`.
- **Items:** Ícone 18px + Chivo 700 14px. Default: `text-muted`. Hover: `bg-primary-soft text-primary`. Active: `bg-primary text-white rounded-xl`.
- **Animação de entrada:** `slide-in-from-left-2 fade-in` com stagger de 100ms por grupo.

### KPI Cards (Componente Signature)

Os cards de métricas do dashboard — o componente mais visível do sistema.

- Número principal: JetBrains Mono 900, `text-3xl`, `text-main`.
- Label: Chivo 900, uppercase, 10px, tracking 0.2em, `text-muted`.
- Ícone de tendência: `success` (alta) ou `error` (queda).
- Background: card default `p-4`, borda `border/60`.

### Badge / Status Chips

- Pill com `rounded-full`, `px-2.5 py-1`, `text-xs font-bold`.
- Paleta semântica: success-soft/success, warning-soft/warning, error-soft/error, primary-soft/primary.
- Sem borda — o background de cor já comunica o estado.

## 6. Do's and Don'ts

### Do:
- **Do** manter todos os elementos interativos com `min-height: 44px` — campo e escritório precisam do mesmo touch target.
- **Do** usar Barlow 800–900 para títulos e Chivo 400–700 para corpo. O contraste entre eles cria hierarquia.
- **Do** usar JetBrains Mono para qualquer valor numérico de KM, litros ou valores financeiros com `tabular-nums`.
- **Do** tinturar neutros com hue 215–240. Nenhum cinza puro deve existir no sistema.
- **Do** animar com `ease-out` e duração 150–300ms. Motion confirma ação, não entretém.
- **Do** tratar os dois temas (light/dark) como cidadãos de primeira classe — nenhuma cor pode ser legível só em um tema.
- **Do** usar `shadow-card` (offset sólido 2px) em vez de blur grande — o sistema evita o visual "flutuante" de SaaS genérico.
- **Do** adicionar `@media (prefers-reduced-motion: reduce)` para qualquer animação além de transição de estado simples.

### Don't:
- **Don't** usar gradientes de texto (`background-clip: text`). O teal é forte o suficiente sem truques tipográficos. Gradiente de texto é o sinal mais rápido de "template de AI".
- **Don't** parecer um ERP corporativo dos anos 2000 — sem fontes não-otimizadas, sem hierarquia inexistente, sem cores genéricas. Se parece SAP ou sistema interno descuidado, refazer.
- **Don't** usar `border-left` grosso (>1px) como acento colorido em cards ou alertas. Use background tintado.
- **Don't** criar cards idênticos em grade uniforme para todos os tipos de conteúdo.
- **Don't** usar o teal como cor de fundo de seção ou gradiente decorativo. Ele existe só para ação e identidade.
- **Don't** usar uppercase com tracking largo fora de Labels de navegação ou divisores de seção.
- **Don't** usar `border-radius` acima de 16px em cards ou containers gerais.
- **Don't** usar `z-index` com valores arbitrários (999, 9999). Escala oficial: floating=10, dropdown=50, overlay=60, modal=70, toast=80.
