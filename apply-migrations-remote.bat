@echo off
REM Script para aplicar migrations no D1 remoto
REM Uso: apply-migrations-remote.bat

echo ========================================
echo Aplicando Migrations no D1 Remoto
echo ========================================
echo.

cd workers

echo [1/2] Aplicando schema de produção...
wrangler d1 execute ooh-db --remote --file=../migrations/0005_production_schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERRO ao aplicar schema!
    pause
    exit /b 1
)

echo.
echo [2/2] Aplicando dados de exemplo...
wrangler d1 execute ooh-db --remote --file=../migrations/0006_sample_data_production.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERRO ao aplicar dados!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Migrations aplicadas com sucesso!
echo ========================================
pause
