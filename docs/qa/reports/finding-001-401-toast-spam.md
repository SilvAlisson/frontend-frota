# finding-001-401-toast-spam.md

**Severidade:** P1
**Tela:** Global (qualquer tela privada)
**Lente:** Engineering / UX
**Descrição:** Quando o usuário possui um token inválido ou a sessão expira, o sistema dispara requisições simultâneas (ex: React Query on mount). O interceptor do axios captura os erros 401 e dispara o evento `auth:unauthorized`, gerando múltiplos toasts "Sua sessão expirou por segurança" na tela, lotando a UI e causando uma péssima experiência visual antes do redirecionamento.
**Evidência:** Console: `Request failed with status code 401`, Múltiplos listitems de toast na acessibility tree (screenshot: `dashboard.png`).
**Arquivo provável:** `src/services/api.ts` (interceptor) ou `AuthContext.tsx`
**Stub de correção:**
- Adicionar um debounce ou controle de estado no interceptor ou no `AuthContext` para exibir o toast de expiração de sessão apenas UMA vez.
- Alternativamente, redirecionar imediatamente no primeiro 401 e limpar a fila de requisições pendentes.
