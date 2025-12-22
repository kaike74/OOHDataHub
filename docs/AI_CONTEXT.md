# AI Project Context (OOH DataHub)

> [!IMPORTANT]
> **READ THIS BEFORE CODING.** This document contains the "Business Brain" of the project. Ignore it and you will break the core logic.

## 1. Project Identity & Roadmap
- **Name**: OOH DataHub.
- **Nature**: Hybrid System (Internal ERP + Public SaaS).
    - **Internal View**: For "HubRadios" team to manage inventory and create curated proposals for agencies/clients.
    - **External View**: For market users to browse inventory and create their own proposals autonomously.
- **Future**: Will evolve into a full SaaS open to the market. Code should be scalable but focused on current features first.

## 2. User Roles & Permissions
### Internal Users (`usuarios_internos`)
- **Master**: Full access (Manage users, delete data).
- **Editor**: Can create/edit points and proposals.
- **Viewer**: Read-only access.
- **Capabilities**: Can see and set V2, V3, V4 pricing types.

### External Users (`usuarios_externos`)
- **Role**: "Client" (generic market user).
- **Capabilities**: Can create their own proposals, view public links, and edit *only* proposals they own or were invited to.
- **Relationship**: NOT tied to a single "Company". A user (João) can create proposals for multiple companies (Coca-Cola, Pepsi).
- **Sharing**: Work like Google Docs. Users can invite others to collaborate on specific proposals using email.

### Future Roles (Do Not Implement Yet)
- **Exhibitor**: Will eventually log in to upload checking photos.

## 3. Core Business Logic: Pricing & Commissions
The system has two distinct pricing modes depending on WHO is creating the proposal.

### A. Internal Creation (The Service Mode)
When internal users create a proposal, they are doing "curation work" for a client/agency.
- **V2**: Base + Internal Commission (Standard).
- **V3**: V2 + Agency Commission (1 Agency involved).
- **V4**: V3 + 2nd Agency Commission (Complex deals).
- **Context**: Internal users select which V-level applies based on the real-deal contract.

### B. External Creation (The Self-Service Mode)
When an external user creates a proposal, they are on "autopilot".
- **V0 (Defensive Market Pricing)**:
    - **Logic**: `Rental Value = Base Value * 2`.
    - **Reason**: Prevents undercutting the market or exposing internal net costs.
    - **Rule**: External users CANNOT see or change this. It is hardcoded for them.

## 4. Architecture Standards
- **Database**: Cloudflare D1 (SQLite).
    - **Migrations**: STRICTLY sequential. See `docs/DATABASE_WORKFLOW.md`.
    - **Source of Truth**: `migrations/0001_schema_sync.sql`.
- **Backend**: Cloudflare Workers (Edge).
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS.
- **Auth**:
    - Internal: Custom JWT (Table `usuarios_internos`).
    - External: Custom JWT (Table `usuarios_externos`).

## 5. Known "Ghosts" & Cleanup
- `exibidoras_backup_legacy`: **GARBAGE**. Do not use, reference, or try to revive.
- `clientes.ts`: CRUD for Company Entities (Names/Logos).
- `clients.ts`: Auth/Logic for Human External Users. (Yes, the naming is confusing. `clientes` = Companies, `clients` = Users).

## 6. Workflow "Golden Rules"
1. **Never Break Production**: Use GitHub Desktop "Revert" if you fail.
2. **Atomic Context**: Don't change logic in `propostas.ts` without understanding WHO (Internal vs External) is calling it.
3. **Database Changes**: Never run raw SQL commands. Always create a numbered migration file.

---

# 📚 ANEXO TÉCNICO E OPERACIONAL

## 1. Workflow de Banco de Dados (D1)

> **REGRA DE OURO**: O banco de dados de produção (Remote) é a verdade absoluta. Nunca assuma que o local está sincronizado sem verificar.

### Como criar Migrations (Autônomo)
1.  **Edite o Schema**: Adicione a tabela/coluna desejada no arquivo SQL mais recente ou num novo.
2.  **Gere a Migration**:
    ```bash
    cd workers
    npx wrangler d1 migrations create ooh-db nome_da_mudanca
    ```
3.  **Implemente o SQL**: Copie o SQL gerado para o arquivo criado em `migrations/`.
4.  **Aplique (Local & Remoto)**:
    ```bash
    # Local
    npx wrangler d1 migrations apply ooh-db --local
    # Remoto (Produção)
    npx wrangler d1 migrations apply ooh-db --remote
    ```

### Comandos Úteis
- **Listar Migrations**: `npx wrangler d1 migrations list ooh-db --remote`
- **Resetar Local**: `rm -rf .wrangler/state/v3/d1` (Seguro, apenas cache local)

---

## 2. Setup Cloudflare (KV & Queues)

### Workers KV (`ooh-system-KV`)
Usado para cache de alta performance (Estatísticas, Listas de Pontos).
- **ID de Produção**: Ver `wrangler.toml` (section `[[kv_namespaces]]`).
- **Cache Rules**:
    - `stats`: 1 hora.
    - `pontos:list`: 5 minutos (Invalidação automática no Create/Update/Delete).

### Filas/Queues (`ooh-jobs-queue`)
Processamento assíncrono (Emails, Logs).
- **Consumer**: `workers/src/worker.ts` (função `queue`).
- **Trigger**: Envio de email de reset de senha, auditoria.

### Deploy
```bash
cd workers
npm run deploy # Script alias para wrangler deploy
```

---

## 3. Sistema de Autenticação

### Níveis de Acesso
1.  **Master** (`role: 'master'`): Acesso total. Pode deletar pontos e gerenciar usuários.
2.  **Viewer** (`role: 'viewer'`): Apenas visualização (somente leitura).
3.  **Client** (`role: 'client'`): Usuário externo (Portal do Cliente). Acesso restrito aos seus dados.

### Setup Inicial (Mestre)
Se o banco estiver vazio, use a rota de setup para criar o primeiro usuário:
`POST /api/auth/setup` -> Cria `kaike@hubradios.com` / `Teste123`.

### Segurança
- **JWT**: Persistente, validade 7 dias.
- **Domínio**: Emails internos DEVEM ser `@hubradios.com`.
- **Rota Protegida**: Middleware global valida token em `/api/*` exceto rotas públicas.

