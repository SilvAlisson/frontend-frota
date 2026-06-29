# Frota KLIN - Screen Manifest (QA Loop)

## Rotas Core

- `/login`
  - Contexto: Autenticação do usuário e redirecionamento baseado em Role.
  - Auth: Public

- `/admin`
  - Contexto: Dashboard principal com resumo financeiro, manutenções e documentação.
  - Auth: Required (Admin)

- `/admin/integrantes`
  - Contexto: Módulo de RH para gestão de motoristas e funcionários.
  - Auth: Required (Admin)

- `/admin/sst`
  - Contexto: Módulo de Segurança do Trabalho e Treinamentos obrigatórios.
  - Auth: Required (Admin)

- `/admin/veiculos`
  - Contexto: Módulo de gestão de frota, listagem de caminhões e carros.
  - Auth: Required (Admin)
