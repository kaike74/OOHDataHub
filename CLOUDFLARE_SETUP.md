# Configuração Cloudflare Workers KV e Queues

Este documento contém instruções passo a passo para configurar Workers KV e Queues no seu projeto OOHDataHub.

## 📋 Pré-requisitos

- Conta Cloudflare ativa
- Wrangler CLI instalado (`npm install -g wrangler`)
- Login no Wrangler (`wrangler login`)

---

## 🗂️ Passo 1: Criar Workers KV Namespace

O Workers KV é usado para cache de dados (estatísticas, lista de pontos, etc).

### Opção A: Via Wrangler CLI (Recomendado)

```bash
cd workers

# Criar KV namespace para produção
wrangler kv:namespace create "KV"
```

Você receberá uma resposta como:
```
🌀 Creating namespace with title "ooh-system-KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "KV", id = "abc123xyz456..." }
```

### Opção B: Via Dashboard Cloudflare

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecione **Workers & Pages** no menu lateral
3. Clique em **KV**
4. Clique em **Create namespace**
5. Nome: `ooh-system-KV`
6. Copie o **Namespace ID** gerado

### Atualizar wrangler.toml

Abra `workers/wrangler.toml` e **substitua** a linha:

```toml
[[kv_namespaces]]
binding = "KV"
id = "placeholder_kv_id"  # ← SUBSTITUA ESTE ID
```

Por:

```toml
[[kv_namespaces]]
binding = "KV"
id = "SEU_KV_NAMESPACE_ID_AQUI"  # ← Cole o ID real aqui
```

---

## 📬 Passo 2: Criar Queue

As Queues são usadas para processar tarefas em background (emails, logs de auditoria).

### Via Wrangler CLI

```bash
cd workers

# Criar queue
wrangler queues create ooh-jobs-queue
```

Você receberá:
```
✨ Successfully created queue ooh-jobs-queue
```

### Via Dashboard Cloudflare

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecione **Workers & Pages**
3. Clique em **Queues**
4. Clique em **Create queue**
5. Nome: `ooh-jobs-queue`
6. Clique em **Create**

**Nota:** O arquivo `wrangler.toml` já está configurado para esta queue. Não é necessário modificar nada se você usar o nome `ooh-jobs-queue`.

---

## 🚀 Passo 3: Deploy

Após configurar KV e Queue, faça o deploy:

```bash
cd workers
npm install  # Se ainda não instalou
wrangler deploy
```

Você deve ver:
```
✨ Build succeeded!
✨ Successfully published your script to
   https://ooh-system.SEU_USERNAME.workers.dev
```

---

## ✅ Passo 4: Verificar Configuração

### Testar KV (Cache)

1. Abra seu frontend e acesse a página de **Estatísticas**
2. Primeira request: deve ver "Stats cache miss - calculating..." nos logs
3. Segunda request (em até 1 hora): deve ver "Stats served from cache"

### Verificar logs no Dashboard:

```bash
wrangler tail
```

Ou acesse:
1. Dashboard Cloudflare → Workers & Pages
2. Clique no worker `ooh-system`
3. Aba **Logs**

### Testar Queue (Email)

1. No frontend, tente **redefinir senha** (Forgot Password)
2. Verifique os logs:

```bash
wrangler tail
```

Você deve ver:
```
Message enqueued: password_reset_email
Processing queue message: password_reset_email
Password reset email sent to: usuario@hubradios.com
```

---

## 📊 Como Funciona o Cache

### Cache Keys e TTL (Tempo de Expiração)

| Recurso | Chave Cache | TTL (Tempo de Vida) |
|---------|-------------|---------------------|
| Estatísticas | `stats` | 1 hora (3600s) |
| Lista de Pontos | `pontos:list` | 5 minutos (300s) |
| Lista de Exibidoras | `exibidoras:list` | 5 minutos (300s) |

### Invalidação Automática

O cache é **automaticamente invalidado** quando:

- ✅ Um novo ponto é criado
- ✅ Um ponto é atualizado
- ✅ Um ponto é deletado
- ✅ Uma exibidora é modificada

**Exemplo:** Ao criar um ponto, os caches `pontos:list` e `stats` são deletados, forçando recálculo na próxima request.

---

## 📬 Como Funciona a Queue

### Tipos de Mensagens Suportadas

1. **PASSWORD_RESET_EMAIL**: Envio de email de redefinição de senha
2. **AUDIT_LOG**: Registro de alterações em background (futuro)

### Processamento

- **Batch Size**: Até 10 mensagens por vez
- **Batch Timeout**: 30 segundos
- **Retry**: Automático em caso de falha

### Vantagens

- ⚡ Respostas API mais rápidas (não espera envio de email)
- 🔄 Retry automático em caso de falha
- 📊 Processamento assíncrono de tarefas pesadas

---

## 🔍 Monitoramento

### Ver estatísticas de uso do KV:

```bash
wrangler kv:key list --binding=KV
```

### Ver mensagens na Queue:

```bash
wrangler queues consumer list ooh-jobs-queue
```

### Logs em tempo real:

```bash
wrangler tail --format=pretty
```

---

## 💰 Custos (Free Tier)

### Workers KV
- ✅ **100,000 leituras/dia** - GRÁTIS
- ✅ **1,000 escritas/dia** - GRÁTIS
- ✅ **1 GB armazenamento** - GRÁTIS

### Queues
- ✅ **1 milhão mensagens/mês** - GRÁTIS
- ✅ Sem limites de queues

**Seu projeto está bem dentro do free tier!**

---

## 🐛 Troubleshooting

### Erro: "KV namespace not found"

**Solução:**
1. Verifique se o ID no `wrangler.toml` está correto
2. Execute `wrangler kv:namespace list` para ver namespaces existentes
3. Atualize o `id` no arquivo `wrangler.toml`

### Erro: "Queue does not exist"

**Solução:**
```bash
wrangler queues create ooh-jobs-queue
```

### Cache não está funcionando

**Verificar:**
1. Abra `wrangler tail` em um terminal
2. Faça uma request para `/api/stats`
3. Veja se aparece "Stats cache miss" ou "Stats served from cache"
4. Se não aparecer, verifique se o deploy foi feito com sucesso

### Emails não estão sendo enviados

**Verificar:**
1. Confirme que as variáveis de ambiente `GMAIL_CLIENT_EMAIL` e `GMAIL_PRIVATE_KEY` estão configuradas:

```bash
wrangler secret list
```

2. Se não estiverem, configure:

```bash
wrangler secret put GMAIL_CLIENT_EMAIL
wrangler secret put GMAIL_PRIVATE_KEY
```

3. Verifique os logs:

```bash
wrangler tail
```

---

## 📚 Documentação Oficial

- [Workers KV](https://developers.cloudflare.com/kv/)
- [Queues](https://developers.cloudflare.com/queues/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

## ✨ Próximos Passos (Opcional)

Após testar KV e Queues, você pode adicionar:

1. **Analytics Engine**: Rastrear quais pontos são mais visualizados
2. **Vectorize**: Busca semântica de pontos
3. **Durable Objects**: Notificações em tempo real

Se precisar de ajuda para implementar, é só pedir!
