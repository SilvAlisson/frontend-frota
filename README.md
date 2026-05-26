# 🚚 Frota KLIN - Frontend

Bem-vindo ao repositório Frontend do sistema **Frota KLIN**. Esta aplicação foi desenvolvida para oferecer uma gestão completa e eficiente da frota de veículos, motoristas, abastecimentos e manutenções da empresa.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com as melhores e mais modernas tecnologias do ecossistema web:

- **[React 18](https://react.dev/)** - Biblioteca principal para construção da interface.
- **[Vite](https://vitejs.dev/)** - Bundler e ambiente de desenvolvimento ultrarrápido.
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para maior segurança e escalabilidade do código.
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework utilitário para estilização rápida e responsiva.
- **[React Router DOM](https://reactrouter.com/)** - Roteamento da aplicação (Single Page Application).
- **[TanStack Query (React Query)](https://tanstack.com/query/latest)** - Gerenciamento de estado de chamadas à API, requisições e cache.
- **[Axios](https://axios-http.com/)** - Cliente HTTP para comunicação com o backend.
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones minimalistas e consistentes.
- **[React To Print](https://www.npmjs.com/package/react-to-print)** - Motor para geração de impressões perfeitas (usado nos Crachás Funcionais).

## 🌟 Funcionalidades Principais

- 🧑‍✈️ **Gestão de Integrantes (Motoristas/Operadores)**: Cadastro completo, listagem e controle de acesso via token mágico.
- 🚗 **Gestão de Veículos**: Controle de frota por placas, modelo, status e histórico atrelado.
- ⛽ **Controle de Abastecimentos**: Lançamento de notas/cupons fiscais, registro de litragem, hodômetro e envio de comprovantes fotográficos.
- 🔧 **Histórico de Manutenções**: Acompanhamento de serviços corretivos e preventivos realizados na frota, com anexo de notas de serviço.
- 🪪 **Identidade Funcional (Crachá)**: Geração automatizada de crachás virtuais com QR Code dinâmico e suporte à impressão nativa.

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (versão 18 ou superior)
- NPM, Yarn ou PNPM

### Passos de Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SilvAlisson/frontend-frota.git
   cd frontend-frota-main
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto (ou modifique o `.env.example`) apontando para o seu Backend local ou de produção:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. O projeto estará disponível em: `http://localhost:5173`

## 📦 Scripts Disponíveis no `package.json`

- `npm run dev`: Inicia o servidor local com Hot-Module-Replacement (HMR).
- `npm run build`: Realiza a checagem de tipos (TypeScript) e compila a aplicação minificada para produção na pasta `dist/`.
- `npm run lint`: Executa a verificação de regras de código com o ESLint.
- `npm run preview`: Cria um servidor web simples servindo a build de produção para testes locais finais.

---
*Projeto desenvolvido para uso e controle interno da frota veicular.*
