# Script de Deploy Automatizado
# Execute: .\deploy.ps1

Write-Host "🚀 Iniciando deploy do Sistema OOH..." -ForegroundColor Cyan

# 1. Aplicar migrations D1
Write-Host "`n📊 Aplicando migrations no D1..." -ForegroundColor Yellow
wrangler d1 execute ooh-db --remote --file=migrations/0001_initial.sql
wrangler d1 execute ooh-db --remote --file=migrations/0002_indexes.sql

# 2. Deploy Worker
Write-Host "`n⚡ Deployando Cloudflare Worker..." -ForegroundColor Yellow
Set-Location workers
npm install
wrangler deploy
Set-Location ..

# 3. Build Frontend
Write-Host "`n🎨 Building Next.js..." -ForegroundColor Yellow
Set-Location frontend
npm run build

# 4. Deploy Frontend no Cloudflare Pages
Write-Host "`n🌐 Deployando no Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy out --project-name=ooh-system

Set-Location ..

Write-Host "`n✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🔗 Verifique suas URLs no dashboard do Cloudflare" -ForegroundColor Cyan
