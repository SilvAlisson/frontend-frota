# finding-002-sst-empty-state.md

**Severidade:** P2
**Tela:** `/admin/sst`
**Lente:** QA / Product
**Descrição:** Quando ocorre falha no carregamento dos dados (ex: erro de rede, 401) ou a lista está vazia, as seções da página de SST ("Objetivos e Metas 2026", "Progresso Global", "Alertas de Vencimento") não exibem nenhum feedback visual (ex: "Ocorreu um erro ao carregar", ou "Nenhum alerta pendente"). O usuário vê os títulos mas nenhum conteúdo logo abaixo, causando confusão se a tela ainda está carregando ou se quebrou.
**Evidência:** A acessibility tree não lista texto descritivo sob os cabeçalhos h2 e h3. Screenshot: `sst.png`.
**Arquivo provável:** `src/pages/admin/SST.tsx` e componentes relacionados.
**Stub de correção:**
- Adicionar tratamento de `isError` do React Query para mostrar componente `<ErrorState />` ou toast amigável.
- Adicionar componentes de `<EmptyState />` explícitos caso a requisição retorne sucesso porém com array vazio.
