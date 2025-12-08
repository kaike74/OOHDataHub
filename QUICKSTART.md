# 🚀 Guia de Início Rápido - Sistema OOH

## Opção 1: Desenvolvimento Local (Recomendado para começar)

### Passo 1: Aplicar Migrations no D1

```bash
# Na raiz do projeto
wrangler d1 execute ooh-db --remote --file=migrations/0001_initial.sql
wrangler d1 execute ooh-db --remote --file=migrations/0002_indexes.sql
```

**Importante:** Isso cria as tabelas no seu banco D1 já existente.

### Passo 2: Rodar Ambiente de Desenvolvimento

**Opção A - Script Automático:**
```powershell
.\dev.ps1
```

**Opção B - Manual:**

Terminal 1 (Worker):
```bash
cd workers
npm install
wrangler dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install  # já foi feito
npm run dev
```

### Passo 3: Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Worker API**: http://localhost:8787

---

## Opção 2: Deploy para Produção

### Passo 1: Deploy Automático

```powershell
.\deploy.ps1
```

Este script faz:
1. ✅ Aplica migrations no D1
2. ✅ Deploy do Worker
3. ✅ Build do Next.js
4. ✅ Deploy no Cloudflare Pages

### Passo 2: Configurar URL do Worker

Após o deploy, anote a URL do Worker (ex: `https://ooh-system.seu-usuario.workers.dev`)

Edite `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://ooh-system.seu-usuario.workers.dev
```

E faça novo deploy do frontend.

---

## 🐛 Troubleshooting

### "Erro ao carregar dados"
- Verifique se o Worker está rodando
- Verifique se a URL em `.env.local` está correta
- Verifique o console do navegador para erros

### "Mapa não carrega"
- Verifique se a API Key do Google Maps está correta
- Verifique o console para erros de CORS

### "Imagens não aparecem"
- Verifique se o R2 bucket `ooh-bucket` existe
- Verifique permissões no Cloudflare

---

## 📝 Próximos Passos Após Rodar

1. **Testar API**: Acesse `http://localhost:8787/api/stats`
2. **Criar exibidora**: Use a API `POST /api/exibidoras`
3. **Criar ponto**: Use a API `POST /api/pontos` (formulário web em breve)
4. **Ver no mapa**: Pontos com coordenadas aparecem automaticamente

---

## 🎯 Status do Projeto

✅ **Completo:**
- Backend API (CRUD completo)
- Mapa com clustering
- Sidebar de detalhes
- Upload de imagens

⏳ **Em Desenvolvimento:**
- Formulário de cadastro web
- Filtros avançados
- Street View integration
- Dashboard de stats

---

**Dúvidas?** Verifique o `README.md` completo.
