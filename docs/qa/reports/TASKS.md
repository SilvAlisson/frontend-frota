# Triage Report - QA Loop (24 Jun 2026)

Este é o relatório gerado pelo agente de Triagem após a execução exploratória nas telas `/admin`, `/admin/sst` e `/admin/veiculos`.

## Resumo dos Findings
- **Total de Issues:** 2
- **P0 (Crítico):** 0
- **P1 (Alto):** 1
- **P2 (Médio):** 1
- **P3 (Baixo):** 0

---

## 🛑 P1 - Bugs Críticos / Funcionais

### 1. Spam de Toasts de Sessão Expirada (Interceptador 401)
- **Origem:** `finding-001-401-toast-spam.md`
- **Problema:** Quando o token de autenticação está inválido, requisições paralelas do React Query falham simultaneamente. O interceptor do axios dispara dezenas de toasts "Sua sessão expirou por segurança" de uma vez, poluindo a tela e causando má experiência.
- **Plano de Ação (Stub):** 
  1. Adicionar uma variável de controle no interceptor do `api.ts` para não disparar múltiplos eventos se o primeiro já foi disparado.
  2. Adicionar uma flag local ou um `debounce` no contexto de notificação.

---

## ⚠️ P2 - Problemas de Produto / UX

### 2. Telas em Branco sem Empty State no módulo SST
- **Origem:** `finding-002-sst-empty-state.md`
- **Problema:** Na rota `/admin/sst`, caso não existam dados ou ocorra erro no fetch, os títulos das sessões ("Objetivos e Metas 2026", "Progresso Global") aparecem mas o conteúdo abaixo fica totalmente vazio, sem indicar ao usuário se a tela quebrou ou se apenas não há registros. Em contrapartida, a tela de Veículos exibe corretamente "FROTA VAZIA".
- **Plano de Ação (Stub):**
  1. Tratar a propriedade `isError` do React Query para mostrar mensagem "Falha ao carregar".
  2. Inserir componentes de Empty State quando as arrays vierem vazias.
