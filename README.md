# 🗺️ OOH Data Hub - Sistema de Gestão de Pontos Out-of-Home

Sistema moderno e completo de gestão de pontos OOH (Out-of-Home) com mapa interativo, gerenciamento de exibidoras e upload de imagens.

## 🎯 Funcionalidades Implementadas

### 📍 Gestão de Pontos OOH
- ✅ Mapa interativo com Google Maps e clustering inteligente
- ✅ Cadastro completo de pontos (formulário em 2 etapas)
- ✅ Edição de pontos existentes
- ✅ Upload de múltiplas imagens por ponto
- ✅ Geocoding automático de endereços
- ✅ Integração com Street View
- ✅ Modal de hover com carrossel de imagens
- ✅ Gaveta de detalhes lateral
- ✅ Filtros avançados por cidade, UF e exibidora
- ✅ Busca de endereços com sugestões

### 🏢 Gestão de Exibidoras
- ✅ View com cards das exibidoras
- ✅ Informações completas (CNPJ, razão social, contatos)
- ✅ Estatísticas automáticas (total de pontos, regiões)
- ✅ Filtro de pontos por exibidora
- ✅ Gaveta de detalhes da exibidora
- ✅ Upload de logo

### 🎨 Interface e UX
- ✅ Sistema de navegação com menu hambúrguer
- ✅ Design responsivo e moderno
- ✅ Animações e transições suaves
- ✅ Cores e identidade visual E-MÍDIAS
- ✅ Tooltips interativos

## 🛠️ Stack Tecnológica

### Frontend
- **Framework**: Next.js 14 (App Router) com Static Export
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **State Management**: Zustand
- **Mapa**: Google Maps JavaScript API
- **Ícones**: Lucide React
- **Hospedagem**: Cloudflare Pages

### Backend
- **API**: Cloudflare Workers
- **Banco de Dados**: Cloudflare D1 (SQLite distribuído)
- **Storage**: Cloudflare R2 (compatível com S3)
- **Linguagem**: TypeScript

## 📦 Estrutura do Projeto

```
OOHDataHub/
├── frontend/                    # Aplicação Next.js
│   ├── app/                     # Páginas (App Router)
│   │   ├── layout.tsx          # Layout principal
│   │   └── page.tsx            # Página inicial com mapa
│   ├── components/             # Componentes React
│   │   ├── map/
│   │   │   └── GoogleMap.tsx   # Componente do mapa
│   │   ├── AddressSearch.tsx   # Busca de endereços
│   │   ├── CreatePointModal.tsx # Formulário de cadastro/edição
│   │   ├── ExibidorasView.tsx  # View de cards das exibidoras
│   │   ├── ExibidoraSidebar.tsx # Gaveta de detalhes da exibidora
│   │   ├── MapFilters.tsx      # Filtros do mapa
│   │   ├── MapTooltip.tsx      # Tooltip ao passar mouse
│   │   ├── NavigationMenu.tsx  # Menu de navegação
│   │   └── Sidebar.tsx         # Gaveta de detalhes do ponto
│   ├── lib/                    # Bibliotecas e utilitários
│   │   ├── api.ts              # Cliente da API
│   │   ├── store.ts            # Zustand store
│   │   ├── types.ts            # Definições TypeScript
│   │   └── utils.ts            # Funções auxiliares
│   └── package.json
│
├── workers/                    # Cloudflare Worker (API)
│   ├── src/
│   │   ├── routes/            # Endpoints da API
│   │   │   ├── pontos.ts      # CRUD de pontos
│   │   │   ├── exibidoras.ts  # CRUD de exibidoras
│   │   │   ├── upload.ts      # Upload de imagens
│   │   │   └── stats.ts       # Estatísticas
│   │   ├── utils/
│   │   │   └── cors.ts        # Configuração CORS
│   │   └── index.ts           # Entry point do Worker
│   ├── wrangler.toml          # Configuração Cloudflare
│   └── package.json
│
├── migrations/                 # Migrations do banco D1
│   ├── 0001_initial.sql       # Schema inicial
│   ├── 0002_indexes.sql       # Índices
│   ├── 0005_production_schema.sql # Schema de produção
│   ├── 0007_add_tipo_column.sql # Adiciona coluna tipo
│   └── 0008_fix_final_cleanup.sql # Schema final completo
│
├── .gitignore
└── README.md
```

## 🚀 Setup e Deploy

### 1. Configurar Cloudflare

Você precisa ter:
- Conta no Cloudflare
- Wrangler CLI instalado: `npm install -g wrangler`
- D1 Database criado: `wrangler d1 create ooh-db`
- R2 Bucket criado: `wrangler r2 bucket create ooh-bucket`

### 2. Aplicar Migrations no D1

```bash
# Na raiz do projeto
wrangler d1 execute ooh-db --remote --file=migrations/0001_initial.sql
wrangler d1 execute ooh-db --remote --file=migrations/0002_indexes.sql
wrangler d1 execute ooh-db --remote --file=migrations/0005_production_schema.sql
wrangler d1 execute ooh-db --remote --file=migrations/0007_add_tipo_column.sql
wrangler d1 execute ooh-db --remote --file=migrations/0008_fix_final_cleanup.sql
```

> **Nota**: O migration 0008 é idempotente e contém o schema completo. Se estiver configurando um novo banco, pode aplicar apenas ele.

### 3. Deploy do Worker (API)

```bash
cd workers
npm install
wrangler deploy
```

Anote a URL do worker deployado (ex: `https://ooh-system.seu-usuario.workers.dev`)

### 4. Deploy do Frontend

```bash
cd frontend
npm install

# Criar .env.local com as variáveis
cat > .env.local << EOF
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-api-key-aqui
NEXT_PUBLIC_API_URL=https://ooh-system.seu-usuario.workers.dev
EOF

# Build e deploy
npm run build
npx wrangler pages deploy out
```

## 🔑 Variáveis de Ambiente

### Frontend (.env.local)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...  # Google Maps API Key
NEXT_PUBLIC_API_URL=https://...workers.dev  # URL do Worker
```

### Worker (wrangler.toml)
Já configurado no arquivo:
- `database_name = "ooh-db"` - Banco D1
- `bucket_name = "ooh-bucket"` - R2 Storage
- `ALLOWED_ORIGINS = "*"` - CORS (ajustar para produção)

## 📊 API Endpoints

### Pontos OOH
```
GET    /api/pontos           # Listar todos os pontos
GET    /api/pontos/:id       # Detalhes de um ponto
POST   /api/pontos           # Criar novo ponto
PUT    /api/pontos/:id       # Atualizar ponto
DELETE /api/pontos/:id       # Deletar ponto
```

### Exibidoras
```
GET    /api/exibidoras       # Listar exibidoras
GET    /api/exibidoras/:id   # Detalhes de uma exibidora
POST   /api/exibidoras       # Criar exibidora
PUT    /api/exibidoras/:id   # Atualizar exibidora
DELETE /api/exibidoras/:id   # Deletar exibidora
```

### Upload e Imagens
```
POST   /api/upload           # Upload de imagem
GET    /api/images/:key      # Servir imagem do R2
```

### Estatísticas
```
GET    /api/stats            # Estatísticas gerais do sistema
```

## 🗄️ Schema do Banco de Dados

### Tabelas Principais
- **pontos_ooh**: Pontos OOH com localização, exibidora, medidas, fluxo, tipos
- **exibidoras**: Empresas exibidoras (nome, CNPJ, contatos, logo)
- **imagens**: Imagens dos pontos (chave R2, ordem, capa)
- **produtos**: Produtos e valores por ponto (locação, papel, lona)
- **historico**: Log de alterações nos pontos

Ver schema completo em `migrations/0008_fix_final_cleanup.sql`

## 🎨 Design System

### Cores (Tailwind)
```javascript
// tailwind.config.js
colors: {
  'emidias-primary': '#1e3a8a',    // Azul principal
  'emidias-accent': '#FC1E75',     // Rosa destaque
  'emidias-gray': '#6B7280',       // Cinza neutro
  // ...
}
```

### Componentes Principais
- **GoogleMap**: Mapa com markers e clustering
- **Sidebar**: Gaveta lateral de detalhes do ponto
- **ExibidoraSidebar**: Gaveta lateral de detalhes da exibidora
- **CreatePointModal**: Modal de cadastro/edição em 2 etapas
- **NavigationMenu**: Menu hambúrguer com navegação
- **ExibidorasView**: Grid de cards das exibidoras
- **MapTooltip**: Tooltip ao passar mouse sobre marker

## 📝 Desenvolvimento

### Rodar Localmente

Terminal 1 - Worker:
```bash
cd workers
wrangler dev --port 8787
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Acesse: `http://localhost:3000`

## 🔒 Segurança

- ✅ CORS configurado
- ✅ Validação de tipos no TypeScript
- ✅ Foreign keys e constraints no banco
- ⚠️ TODO: Autenticação de usuários
- ⚠️ TODO: Rate limiting na API

## 📈 Performance

- ✅ Clustering de markers no mapa
- ✅ Static export do Next.js
- ✅ Edge computing com Cloudflare Workers
- ✅ R2 para servir imagens otimizadas
- ✅ Índices no banco de dados D1

## 📝 Licença

MIT

---

**Desenvolvido com IA** 🤖 | Última atualização: 2025-12-09
