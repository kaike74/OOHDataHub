# 🚀 Deploy no Cloudflare Pages

## ⚠️ Erro: "Missing entry-point to Worker script"?

Se você está vendo o erro abaixo durante o deploy:
```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

**Causa**: O Cloudflare está tentando fazer deploy do Worker automaticamente, mas este repositório tem **dois projetos separados**:
- **Frontend** (Cloudflare Pages) → `/frontend`
- **Worker** (Cloudflare Workers) → `/workers`

**Solução**: Desabilite o deploy automático do Worker

1. Acesse: https://dash.cloudflare.com
2. Vá em **Workers & Pages**
3. Procure por **ooh-system** (ou similar) na lista de Workers
4. Se encontrar um Worker configurado:
   - Clique nele
   - Vá em **Settings** → **Deployments**
   - **Desabilite** o deploy automático via GitHub
5. O Worker deve ser deployado **manualmente** via CLI:
   ```bash
   cd workers
   npx wrangler deploy
   ```

---

## Configuração das Variáveis de Ambiente

Para que o site funcione corretamente no Cloudflare Pages, você precisa configurar as seguintes variáveis de ambiente:

### 1. Acessar Configurações do Cloudflare Pages

1. Acesse: https://dash.cloudflare.com
2. Vá em **Pages** > **oohdatahub**
3. Clique na aba **Settings** (Configurações)
4. Role até **Environment variables** (Variáveis de ambiente)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis para **Production** e **Preview**:

#### `NEXT_PUBLIC_API_URL`
- **Nome**: `NEXT_PUBLIC_API_URL`
- **Valor**: URL do seu Cloudflare Worker (ex: `https://ooh-system.kaike74.workers.dev`)
- **Tipo**: Plain text (não marcar como secreto)

#### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Nome**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Valor**: Sua chave da API do Google Maps
- **Tipo**: Secret (marcar como secreto)

### 3. Como Obter a URL do Worker

Execute no terminal do projeto (pasta `workers`):

```bash
cd workers
npx wrangler deploy
```

A URL do worker será exibida no final do deploy. Exemplo:
```
Published ooh-system (0.1 sec)
  https://ooh-system.kaike74.workers.dev
```

### 4. Como Obter a Chave do Google Maps

1. Acesse: https://console.cloud.google.com/google/maps-apis
2. Crie um projeto (se ainda não tiver)
3. Ative as seguintes APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Crie uma chave de API em **Credentials**
5. Configure restrições (recomendado):
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**:
     - `oohdatahub.pages.dev/*`
     - `localhost:3000/*` (para desenvolvimento)

### 5. Fazer Redeploy

Após configurar as variáveis:

1. Vá em **Deployments** no Cloudflare Pages
2. Clique nos três pontos (•••) do último deployment
3. Clique em **Retry deployment**

OU faça um novo commit e push para o repositório.

---

## ⚠️ Importante

- As variáveis `NEXT_PUBLIC_*` são embutidas no build durante a compilação
- Após alterar qualquer variável, você **DEVE** fazer um novo deploy
- Não commit arquivos `.env` com valores reais no repositório

---

## 🔍 Verificação

Após o deploy, verifique se:
- ✅ O site carrega sem erros no console
- ✅ O mapa do Google aparece corretamente
- ✅ A lista de pontos carrega (verifique o Network tab)

Se aparecer erro `ERR_CONNECTION_REFUSED`, as variáveis não foram configuradas corretamente.
