# 🔐 Sistema de Autenticação - Guia de Configuração

## ✅ O que foi implementado

Sistema completo de autenticação com níveis de usuário para o OOH Data Hub.

### Funcionalidades Implementadas:

#### 🔑 Autenticação
- ✅ Login com email/senha (sem Google OAuth)
- ✅ Validação de domínio (@hubradios.com obrigatório)
- ✅ JWT com persistência no localStorage
- ✅ Proteção de rotas (não autenticados são redirecionados)
- ✅ Logout com confirmação

#### 👥 Níveis de Usuário
- ✅ **Master**: Acesso total (criar/editar/deletar pontos, gerenciar usuários)
- ✅ **Viewer**: Apenas visualização (futuro)

#### 🎛️ Gerenciamento de Usuários (Master only)
- ✅ Convidar novos usuários
- ✅ Definir nível de acesso (master/viewer)
- ✅ Listar todos os usuários
- ✅ Remover usuários
- ✅ Alterar própria senha

#### 🗑️ Novas Funcionalidades
- ✅ Botão "Deletar Ponto" (apenas para Master)
- ✅ Página de Configurações (/config)
- ✅ Menu com opção de Logout

---

## 🚀 Como Usar (Passo a Passo)

### 1️⃣ Fazer Deploy das Alterações

O código já foi commitado e enviado para a branch:
```
claude/finish-user-levels-01JuQpQsRQy58HJS5RaCUSw4
```

**Ações necessárias:**
1. Fazer merge da branch no `main` (se aplicável)
2. Deploy automático via Cloudflare Pages (frontend)
3. Deploy do Worker (backend)

### 2️⃣ Criar Usuário Master Inicial

**IMPORTANTE:** O usuário master precisa ser criado antes do primeiro login.

#### Opção A: Usando a Rota de Setup (Recomendado)

Faça uma requisição POST para criar o usuário master automaticamente:

```bash
curl -X POST https://SEU_DOMINIO/api/auth/setup
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Master user created successfully",
  "email": "kaike@hubradios.com"
}
```

**Credenciais criadas:**
- Email: `kaike@hubradios.com`
- Senha: `Teste123`

**⚠️ Esta rota só funciona se não houver nenhum usuário no banco. Depois que o primeiro usuário é criado, ela retorna erro 403.**

#### Opção B: Executar SQL Manualmente

Se preferir, execute o SQL diretamente no Cloudflare Dashboard:

1. Acesse: https://dash.cloudflare.com
2. Vá para D1 Database > `ooh-db`
3. Abra o Console SQL
4. Execute:

```sql
INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES (
    'kaike@hubradios.com',
    'ebdf496f67651cddf6aaa1f0b130f1b99ce9e2e93dc2503d926edcff15aee668',
    'Kaike Master',
    'master',
    datetime('now'),
    datetime('now')
);
```

**Credenciais:**
- Email: `kaike@hubradios.com`
- Senha: `Teste123`

### 3️⃣ Fazer Primeiro Login

1. Acesse: `https://SEU_DOMINIO/login`
2. Entre com:
   - Email: `kaike@hubradios.com`
   - Senha: `Teste123`
3. Você será redirecionado para o mapa

### 4️⃣ Alterar Senha (RECOMENDADO)

1. No mapa, clique no menu hambúrguer (☰)
2. Clique em "Configurações"
3. Na seção "Minha Conta", clique em "Alterar Senha"
4. Preencha:
   - Senha Atual: `Teste123`
   - Nova Senha: (sua senha segura)
   - Confirmar Nova Senha: (mesma senha)
5. Clique em "Alterar Senha"

### 5️⃣ Convidar Outros Usuários

1. Vá para "Configurações"
2. Clique em "Convidar Usuário"
3. Preencha:
   - Email (@hubradios.com)
   - Nome
   - Nível de Acesso (Master ou Visualizador)
4. Clique em "Enviar Convite"

**A senha padrão para novos usuários é: `HubRadios123!`**

Instrua o novo usuário a:
1. Fazer login com o email e senha padrão
2. Alterar a senha imediatamente

---

## 🎯 Funcionalidades por Nível de Usuário

### 🔴 Master (Você - kaike@hubradios.com)
- ✅ Ver mapa e pontos
- ✅ Criar novos pontos
- ✅ Editar pontos existentes
- ✅ **DELETAR pontos** (novo!)
- ✅ Gerenciar exibidoras
- ✅ **Convidar/remover usuários** (novo!)
- ✅ **Acessar configurações** (novo!)

### 🟢 Viewer (Futuros usuários convidados)
- ✅ Ver mapa e pontos
- ❌ Não pode criar/editar/deletar
- ❌ Não pode gerenciar usuários
- ❌ Não pode acessar configurações

---

## 📱 Telas Novas

### 1. Login (`/login`)
- Tela moderna com gradiente
- Logo do OOH à esquerda
- Formulário de login à direita
- Validação de email @hubradios.com

### 2. Configurações (`/config`)
- **Minha Conta:**
  - Exibir email, nome e nível
  - Alterar senha
- **Gerenciar Usuários:**
  - Listar todos os usuários
  - Convidar novos usuários
  - Remover usuários (exceto você mesmo)

### 3. Sidebar de Ponto (Modificada)
- Botões: Editar | Histórico
- **Novo botão vermelho: "Deletar Ponto"** (apenas Master)

### 4. Menu de Navegação (Modificado)
- Mapa de Pontos
- Exibidoras
- **Configurações** (apenas Master)
- **Sair**

---

## 🔧 Tecnologias Usadas

- **Frontend:** Next.js 14, Zustand (state + persist), TailwindCSS
- **Backend:** Cloudflare Workers, D1 Database
- **Auth:** JWT com jose, SHA-256 password hashing
- **Proteção:** AuthGuard middleware, route protection

---

## 🐛 Possíveis Problemas e Soluções

### Problema: "Invalid credentials" ao fazer login
**Solução:** Verifique se o usuário master foi criado no banco de dados (passo 2).

### Problema: "Only @hubradios.com emails are allowed"
**Solução:** Use apenas emails com domínio @hubradios.com.

### Problema: Não consigo acessar Configurações
**Solução:** Apenas usuários com role "master" podem acessar. Verifique no banco se seu role está correto.

### Problema: Token expirado
**Solução:** Faça logout e login novamente. Tokens expiram em 7 dias.

### Problema: Rota /api/auth/setup retorna erro 403
**Solução:** Isso é normal se já existe um usuário no banco. A rota de setup só funciona uma vez.

---

## 📝 Próximos Passos (Opcional)

1. **Envio de Email:** Implementar envio de email com senha ao convidar usuários
2. **Recuperação de Senha:** Adicionar "Esqueci minha senha"
3. **Histórico de Ações:** Implementar rastreamento de quem criou/editou cada ponto
4. **Viewer Mode:** Implementar restrições visuais para usuários viewer

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do Cloudflare Worker
2. Inspecione o localStorage (DevTools > Application > Local Storage)
3. Verifique se as migrations foram aplicadas no D1

---

**Pronto! Sistema de autenticação completo e funcional! 🎉**
