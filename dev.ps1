# Script de Desenvolvimento Local
# Execute: .\dev.ps1

Write-Host "🛠️ Iniciando ambiente de desenvolvimento..." -ForegroundColor Cyan

# Abrir 2 terminais: Worker e Frontend
Write-Host "`n⚡ Iniciando Cloudflare Worker em modo dev..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd workers; wrangler dev"

Start-Sleep -Seconds 2

Write-Host "`n🎨 Iniciando Next.js em modo dev..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n✅ Servidores iniciados!" -ForegroundColor Green
Write-Host "📍 Worker: http://localhost:8787" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
