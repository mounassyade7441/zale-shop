@echo off
chcp 65001 >nul
:: Autorise les telephones du MEME reseau Wi-Fi a ouvrir le site (port 3000).
:: L'acces reste limite au reseau local : le site n'est pas visible depuis Internet.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Demande des droits administrateur...
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -Command "Remove-NetFirewallRule -DisplayName 'Zale Shop - site (port 3000)' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'Zale Shop - site (port 3000)' -Direction Inbound -Protocol TCP -LocalPort 3000 -RemoteAddress LocalSubnet -Action Allow -Profile Any | Out-Null"
echo.
echo  C'est fait : les telephones connectes au meme Wi-Fi peuvent ouvrir le site.
echo  Adresse a taper sur le telephone : voir la fenetre "demarrer-le-site".
echo.
pause
