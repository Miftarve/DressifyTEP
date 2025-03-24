@echo off
echo ===================================================
echo      DressifyTEP - Setup and Launch Script
echo ===================================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker non e' installato o non e' nel PATH.
    echo Visita https://www.docker.com/products/docker-desktop per scaricare Docker Desktop.
    echo.
    echo Premi un tasto per aprire la pagina di download...
    pause >nul
    start "" "https://www.docker.com/products/docker-desktop"
    goto :EOF
)

echo [OK] Docker e' installato.
echo.

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker non e' in esecuzione.
    echo Avvia Docker Desktop e riprova.
    echo.
    pause
    goto :EOF
)

echo [OK] Docker e' in esecuzione.
echo.

REM Check if .env file exists
if exist .env (
    echo [INFO] Il file .env esiste gia'.
    set /p response=Vuoi sovrascriverlo? (s/n): 
    if /i "%response%"=="s" (
        goto :create_env
    ) else (
        echo Mantengo il file .env esistente.
        goto :start_docker
    )
) else (
    goto :create_env
)

:create_env
echo [INFO] Creazione del file .env...
(
    echo # Google OAuth credentials
    echo GOOGLE_CLIENT_ID=idcliente
    echo GOOGLE_CLIENT_SECRET=appsecret
    echo.
    echo # Facebook OAuth credentials
    echo FACEBOOK_APP_ID=idcliente
    echo FACEBOOK_APP_SECRET=appsecret
) > .env

echo [OK] File .env creato.
echo.
echo [IMPORTANTE] Per favore, modifica il file .env e inserisci le tue credenziali OAuth reali.
echo Prima di continuare, apri il file .env e sostituisci 'idcliente' e 'appsecret' con le tue credenziali.
echo.
set /p continue=Hai modificato il file .env con le tue credenziali? (s/n): 
if /i NOT "%continue%"=="s" (
    echo Per favore modifica il file .env prima di continuare.
    start notepad .env
    pause
)

:start_docker
echo [INFO] Avvio dei container Docker...
echo Questo processo potrebbe richiedere alcuni minuti. Per favore attendi...
echo.

docker-compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Si e' verificato un problema durante l'avvio dei container Docker.
    echo Controlla i messaggi di errore sopra per maggiori dettagli.
    pause
    goto :EOF
)

echo.
echo ===================================================
echo [OK] DressifyTEP e' stato avviato con successo!
echo.
echo Puoi accedere all'applicazione nel tuo browser:
echo http://localhost:3000
echo.
echo Per arrestare l'applicazione, esegui il comando:
echo docker-compose down
echo ===================================================
echo.

set /p openBrowser=Aprire l'applicazione nel browser? (s/n): 
if /i "%openBrowser%"=="s" (
    start "" "http://localhost:3000"
)

echo.
echo Premi un tasto per chiudere questa finestra...
pause >nul
