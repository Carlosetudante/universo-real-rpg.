@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo    PUBLICANDO NO GITHUB...
echo ========================================
echo.

git add .
git commit -m "Atualização automática - %date% %time%"
git push

echo.
echo ========================================
echo    CONCLUIDO! Site atualizado.
echo ========================================
echo.
pause
