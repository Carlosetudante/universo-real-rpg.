@echo off
setlocal
cd /d "%~dp0"
echo Iniciando servidor local...
set PORT=
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$ports=8080,8081,8082,5000,5001,3000; $used=(Get-NetTCPConnection -State Listen).LocalPort; ($ports | Where-Object { $used -notcontains $_ } | Select-Object -First 1)"`) do set PORT=%%P
if "%PORT%"=="" set PORT=8080
start "" "http://localhost:%PORT%"
npx serve -l %PORT%
