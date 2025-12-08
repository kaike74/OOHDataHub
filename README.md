# 🗺️ Sistema OOH - Gestão de Pontos Out-of-Home

Sistema moderno de gestão de pontos OOH (Out-of-Home) com Google Maps, Next.js 14, TypeScript, Cloudflare Workers, D1 e R2.

## 🎯 Funcionalidades

- ✅ Mapa interativo com Google Maps
- ✅ Clustering inteligente de pontos
- ✅ Sidebar com detalhes completos
- ✅ Upload de imagens para R2
- ✅ API REST completa
- ✅ Banco de dados D1 (SQLite)
- ⏳ Formulário de cadastro/edição
- ⏳ Filtros avançados
- ⏳ Street View integration

## 🛠️ Stack Tecnológica

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Google Maps API
- Lucide Icons

### Backend
- Cloudflare Workers
- D1 Database (SQLite)
- R2 Storage

## 📦 Estrutura do Projeto

```
OOHDataHub/
├── frontend/              # Next.js App
│   ├── app/              # Pages e layouts
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários e state
│   └── package.json
│
├── workers/              # Cloudflare Worker
│   ├── src/
│   │   ├── routes/      # API routes
│   │   └── utils/       # Helpers
│   └── wrangler.toml
│
└── migrations/           # SQL migrations para D1
    ├── 0001_initial.sql
    └── 0002_indexes.sql
```

## 🚀 Como Usar

### 1. Aplicar Migrations no D1

Primeiro, aplique as migrations no banco de dados D1:

\`\`\`bash
# Na raiz do projeto
wrangler d1 execute ooh-db --remote --file=migrations/0001_initial.sql
wrangler d1 execute ooh-db --remote --file=migrations/0002_indexes.sql
\`\`\`

### 2. Deploy do Worker

\`\`\`bash
cd workers
npm install
wrangler deploy
\`\`\`

**Importante:** Anote a URL do worker deployado (ex: `https://ooh-system.seu-usuario.workers.dev`)

### 3. Configurar e Rodar Frontend

\`\`\`bash
cd frontend

# Editar .env.local e substituir a URL do worker
# NEXT_PUBLIC_API_URL=https://ooh-system.seu-usuario.workers.dev

# Instalar dependências (já foi feito)
npm install

# Rodar em desenvolvimento
npm run dev
\`\`\`

Acesse: `http://localhost:3000`

### 4. Build para Produção

\`\`\`bash
cd frontend
npm run build

# Deploy no Cloudflare Pages
npx wrangler pages deploy out
\`\`\`

## 🔑 Configuração

### Variáveis de Ambiente (Frontend)

Crie `.env.local` no diretório `frontend/`:

\`\`\`bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-api-key-aqui
NEXT_PUBLIC_API_URL=https://seu-worker.workers.dev
\`\`\`

### Worker (wrangler.toml)

Já configurado em `workers/wrangler.toml`:
- D1 Database: `ooh-db`
- R2 Bucket: `ooh-bucket`
- CORS: Permitido de qualquer origem (para desenvolvimento)

## 📊 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/pontos` | Lista todos os pontos |
| GET | `/api/pontos/:id` | Detalhes de um ponto |
| POST | `/api/pontos` | Criar novo ponto |
| PUT | `/api/pontos/:id` | Atualizar ponto |
| DELETE | `/api/pontos/:id` | Deletar ponto |
| GET | `/api/exibidoras` | Lista exibidoras |
| POST | `/api/exibidoras` | Criar exibidora |
| POST | `/api/upload` | Upload de imagem |
| GET | `/api/images/:key` | Servir imagem do R2 |
| GET | `/api/stats` | Estatísticas gerais |

## 🗄️ Schema do Banco

O banco D1 possui 5 tabelas principais:
- `pontos_ooh` - Pontos OOH
- `imagens` - Imagens dos pontos
- `produtos` - Produtos/preços
- `exibidoras` - Empresas exibidoras
- `historico` - Log de alterações

Ver detalhes em `migrations/0001_initial.sql`

## 🎨 Próximos Passos

- [ ] Implementar formulário de cadastro/edição
- [ ] Adicionar filtros avançados
- [ ] Integrar Street View
- [ ] Dashboard de estatísticas
- [ ] Export de dados (CSV/Excel)
- [ ] Autenticação de usuários

## 📝 Licença

MIT

---

**Desenvolvido com IA** 🤖 | 2025-12-08