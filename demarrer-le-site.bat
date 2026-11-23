@echo off
chcp 65001 >nul
title Zale Shop - serveur (Laravel)
cd /d "%~dp0"
if not exist backend\vendor (
  echo Installation des dependances Laravel, patientez...
  call npm run install-all
)
echo.
echo  Laissez cette fenetre ouverte tant que le site doit rester en ligne.
echo  Pour arreter le site : fermez cette fenetre ou appuyez sur Ctrl + C.
echo.
call npm start
pause
