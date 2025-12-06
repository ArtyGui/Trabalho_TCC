# 📦 LogiBox - Sistema de Alocação Inteligente de Contêineres

Sistema web para alocação inteligente de contêineres em pátios logísticos, desenvolvido com FastAPI (backend) e Next.js (frontend).

## 🎯 Funcionalidades

- ✅ Configuração dinâmica do pátio (dimensões customizáveis)
- ✅ Cadastro de contêineres (20GP, 40GP, 40HC)
- ✅ Algoritmo de alocação sequencial inteligente
- ✅ Visualização em grid do pátio
- ✅ Dashboard com estatísticas em tempo real
- ✅ Interface dark mode profissional
- ✅ API REST completa

## 🚀 Tecnologias

### Backend
- Python 3.11
- FastAPI
- Uvicorn
- Pydantic

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios
- Lucide Icons
- Framer Motion

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- OU:
  - Python 3.11+
  - Node.js 18+
  - npm ou yarn

## 🔧 Instalação e Execução

### Opção 1: Com Docker (Recomendado)

```bash
# Clone o repositório (se aplicável)
git clone <seu-repositorio>
cd logibox-system

# Inicie os containers
docker-compose up --build

# Acesse:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Documentação da API: http://localhost:8000/docs
```

### Opção 2: Sem Docker

#### Backend

```bash
cd backend

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python main.py

# API estará em http://localhost:8000
```

#### Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Configure a variável de ambiente
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev

# Frontend estará em http://localhost:3000
```

## 📖 Como Usar

### 1. Configurar o Pátio

1. Acesse **Configurações** no menu lateral
2. Defina o número de linhas e colunas
3. Clique em "Configurar Pátio"

### 2. Adicionar Contêineres

1. Acesse **Contêineres** no menu
2. Clique em "Novo Contêiner"
3. Preencha:
   - ID do contêiner
   - Tipo (20GP, 40GP ou 40HC)
   - Cliente
   - Data de entrada
4. Clique em "Adicionar"

### 3. Alocar Contêineres

**Opção A - Alocar Todos:**
- Na página de Contêineres, clique em "Alocar Todos"
- O sistema alocará automaticamente todos os contêineres aguardando

**Opção B - Alocar Selecionados:**
- Selecione os contêineres desejados (checkbox)
- Clique em "Alocar Selecionados"

### 4. Visualizar o Pátio

1. Acesse **Pátio** no menu
2. Veja o grid com os contêineres alocados
3. Cores indicam o tipo:
   - 🔵 Azul = 20GP
   - 🟢 Verde = 40GP
   - 🟣 Roxo = 40HC

## 🧠 Algoritmo de Alocação

O sistema utiliza um algoritmo sequencial simples e eficiente:

1. **Preenche da esquerda para direita, de cima para baixo**
2. **Contêineres 20GP** ocupam 1 vaga
3. **Contêineres 40GP e 40HC** ocupam 2 vagas horizontais consecutivas
4. Se não houver espaço suficiente na linha atual, pula para a próxima
5. Se não houver espaço no pátio, o contêiner fica como "sem espaço disponível"

### Exemplo de Alocação:

```
Entrada: 2x 20GP, 1x 40GP, 1x 20GP

Pátio (5x5):
[20GP][20GP][40GP-40GP][20GP][vazio]
[vazio][vazio][vazio][vazio][vazio]
...
```

## 📡 API Endpoints

### Pátio
- `POST /patio/configurar` - Configura o pátio
- `GET /patio` - Obtém configuração e estado atual
- `DELETE /patio/limpar` - Limpa todas as alocações

### Contêineres
- `POST /containers` - Adiciona um contêiner
- `GET /containers` - Lista todos os contêineres
- `GET /containers/{id}` - Obtém detalhes de um contêiner
- `DELETE /containers/{id}` - Remove um contêiner

### Alocação
- `POST /alocar` - Aloca contêineres específicos
- `POST /alocar/todos` - Aloca todos os contêineres aguardando

### Sistema
- `DELETE /sistema/resetar` - Reseta todo o sistema

Documentação completa: http://localhost:8000/docs

## 📁 Estrutura do Projeto

```
logibox-system/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── requirements.txt     # Dependências Python
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Dashboard
│   │   ├── containers/      # Página de contêineres
│   │   ├── patio/           # Página do pátio
│   │   ├── config/          # Página de configurações
│   │   ├── layout.tsx       # Layout principal
│   │   └── globals.css      # Estilos globais
│   ├── components/
│   │   ├── Sidebar.tsx      # Menu lateral
│   │   └── PatioGrid.tsx    # Grid de visualização
│   ├── lib/
│   │   └── api.ts           # Cliente da API
│   ├── types/
│   │   └── index.ts         # Tipos TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🎨 Interface

- **Dark Mode** profissional
- Design limpo e funcional
- Responsivo (funciona em mobile e desktop)
- Feedback visual em todas as ações
- Cores semânticas para status

## 🔒 Limitações Conhecidas

- Pátio máximo: 20x20 vagas (400 vagas)
- Dados armazenados em memória (perdidos ao reiniciar)
- Sem autenticação de usuários
- Algoritmo de alocação é sequencial simples (não otimizado)

## 🚧 Melhorias Futuras

- [ ] Banco de dados persistente (PostgreSQL)
- [ ] Autenticação de usuários
- [ ] Algoritmos de otimização avançados
- [ ] Histórico de movimentações
- [ ] Relatórios em PDF
- [ ] Exportação de dados
- [ ] Integração com visão computacional
- [ ] Multi-tenancy (múltiplos pátios)

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos (TCC).

## 👨‍💻 Autor

Sistema desenvolvido como parte do TCC - Trabalho de Conclusão de Curso

---

## 🆘 Troubleshooting

### Erro de conexão entre frontend e backend

1. Verifique se o backend está rodando em http://localhost:8000
2. Confirme a variável `NEXT_PUBLIC_API_URL` no arquivo `.env.local`
3. Certifique-se de que o CORS está habilitado no backend

### Docker não inicia

```bash
# Limpe containers antigos
docker-compose down -v

# Reconstrua as imagens
docker-compose build --no-cache

# Inicie novamente
docker-compose up
```

### Porta já em uso

Se as portas 3000 ou 8000 estiverem em uso:

```bash
# Mude as portas no docker-compose.yml
# Exemplo: "3001:3000" e "8001:8000"
```

---

**🚀 LogiBox - Alocação Inteligente de Contêineres**
