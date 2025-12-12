# Cloudflare Images - Guia de Configuração

Este projeto agora usa **Cloudflare Images** para otimização automática de imagens (fotos de pontos e logos de exibidoras).

## 🎯 Benefícios

- ✅ **Otimização automática**: Compressão, conversão WebP/AVIF
- ✅ **Responsive images**: Variants automáticos (thumbnail, medium, large)
- ✅ **CDN global**: Entrega rápida em qualquer lugar do mundo
- ✅ **Redução de custos**: Menor banda consumida
- ✅ **Backup no R2**: Imagens continuam salvas no R2 como fallback

## 📋 Pré-requisitos

1. Conta Cloudflare com acesso ao produto **Images**
2. API Token com permissão para Cloudflare Images

---

## ⚙️ Configuração

### 1. Obter o Account ID

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá em **Images**
3. Na página de Overview, copie o **Account ID**

### 2. Criar API Token

1. Acesse **My Profile** > **API Tokens**
2. Clique em **Create Token**
3. Use o template **Edit Cloudflare Images** ou crie um customizado com:
   - **Permissões**: `Account.Cloudflare Images.Edit`
4. Copie o token gerado

### 3. Configurar no Cloudflare Workers

#### Via Wrangler CLI:
```bash
cd workers
wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Cole o Account ID

wrangler secret put CLOUDFLARE_IMAGES_TOKEN
# Cole o API Token
```

#### Via Dashboard:
1. Acesse **Workers & Pages** > Seu worker (`ooh-system`)
2. **Settings** > **Variables and Secrets**
3. Adicione:
   - `CLOUDFLARE_ACCOUNT_ID` (Secret)
   - `CLOUDFLARE_IMAGES_TOKEN` (Secret)

### 4. Configurar Image Variants (Opcional)

Para melhor performance, configure variants no Cloudflare Dashboard:

1. Vá em **Images** > **Variants**
2. Crie os seguintes variants:

| Nome | Largura | Altura | Fit | Uso |
|------|---------|--------|-----|-----|
| `thumbnail` | 200 | 200 | cover | Listagens, previews |
| `medium` | 800 | 600 | scale-down | Visualização normal |
| `large` | 1920 | 1080 | scale-down | Full-screen, zoom |
| `public` | - | - | - | Original (variant padrão) |

### 5. Rodar Migração do Banco de Dados

Execute a migração para adicionar as colunas necessárias:

```bash
# Via Wrangler
wrangler d1 execute ooh-db --file=migrations/0013_add_cloudflare_images.sql

# Ou via Cloudflare Dashboard
# Workers & Pages > D1 > ooh-db > Console
# Cole e execute o conteúdo de migrations/0013_add_cloudflare_images.sql
```

---

## 🚀 Como Funciona

### Upload de Imagens

Quando uma imagem é enviada:

1. **Salva no R2** (backup/fallback)
2. **Envia para Cloudflare Images** (otimização)
3. **Salva IDs no banco**:
   - `r2_key`: Chave do R2
   - `cf_image_id`: ID do Cloudflare Images

### Response do Upload

```json
{
  "success": true,
  "r2_key": "pontos/123/1234567890.jpg",
  "cf_image_id": "abc123xyz",
  "url": "https://imagedelivery.net/ACCOUNT_HASH/abc123xyz/public",
  "urls": {
    "thumbnail": "https://imagedelivery.net/ACCOUNT_HASH/abc123xyz/thumbnail",
    "medium": "https://imagedelivery.net/ACCOUNT_HASH/abc123xyz/medium",
    "large": "https://imagedelivery.net/ACCOUNT_HASH/abc123xyz/large",
    "original": "https://imagedelivery.net/ACCOUNT_HASH/abc123xyz/public"
  }
}
```

### Servindo Imagens

#### Via Cloudflare Images (Recomendado):
```
https://your-api.com/api/images/cf/{cf_image_id}/thumbnail
https://your-api.com/api/images/cf/{cf_image_id}/medium
https://your-api.com/api/images/cf/{cf_image_id}/large
```

#### Via R2 (Fallback):
```
https://your-api.com/api/images/{r2_key}
```

---

## 🔄 Migração de Imagens Existentes

Se você já tem imagens no R2 e quer migrá-las para Cloudflare Images:

```typescript
// Script de migração (exemplo)
const images = await db.query('SELECT * FROM imagens WHERE cf_image_id IS NULL');

for (const image of images) {
  const r2Object = await env.R2.get(image.r2_key);
  if (r2Object) {
    const file = new File([await r2Object.arrayBuffer()], image.nome_arquivo);
    const cfId = await uploadToCloudflareImages(env, file);
    await db.execute('UPDATE imagens SET cf_image_id = ? WHERE id = ?', [cfId, image.id]);
  }
}
```

---

## 🛡️ Fallback Automático

Se o Cloudflare Images não estiver configurado:
- ✅ Upload continua funcionando (salva apenas no R2)
- ✅ Imagens são servidas do R2 normalmente
- ⚠️ Sem otimização automática

---

## 💰 Custos

Cloudflare Images oferece:
- **100,000 imagens armazenadas**: $5/mês
- **100,000 transformações**: Incluídas
- Valores extras conforme [pricing oficial](https://www.cloudflare.com/products/cloudflare-images/pricing/)

---

## 📚 Documentação Oficial

- [Cloudflare Images Docs](https://developers.cloudflare.com/images/)
- [Upload API](https://developers.cloudflare.com/images/upload-images/upload-via-api/)
- [Transform via URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/)

---

## ❓ Troubleshooting

### Erro: "Cloudflare Images not configured"
- Verifique se `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_IMAGES_TOKEN` estão configurados
- Confirme se o token tem permissão correta

### Imagens não aparecem
- Verifique se os variants estão criados no Dashboard
- Teste a URL diretamente no navegador
- Verifique logs do Worker: `wrangler tail`

### Performance não melhorou
- Confirme que está usando as URLs do Cloudflare Images (`/api/images/cf/...`)
- Verifique se os variants estão otimizados (tamanhos menores)
- Use variants apropriados (thumbnail para listagens, não large)
