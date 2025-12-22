# OOH DataHub

Sistema híbrido de gestão de Mídia Exterior (OOH). 
Combina ERP interno (HubRadios) e Portal do Cliente (SaaS self-service).

## 📚 Documentação (AI-Ready)

**Toda a inteligência e regras do projeto estão centralizadas aqui:**
👉 [**MANUAL DO PROJETO & CONTEXTO DA IA**](./docs/AI_CONTEXT.md) 👈

*(Leia o arquivo acima antes de iniciar qualquer desenvolvimento)*

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend (Workers)
```bash
cd workers
npm install
npm run dev
```

## 🛠️ Stack
- **Frontend**: Next.js 14, TailwindCSS
- **Backend**: Cloudflare Workers, D1 (SQLite), KV, Queues
- **Auth**: Custom JWT (Internal + External users)
