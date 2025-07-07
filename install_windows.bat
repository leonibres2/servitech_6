@echo off
REM ============================================
REM 🚀 INSTALADOR AUTOMATICO SERVITECH - WINDOWS
REM Script para configurar el sistema completo
REM Compatible: Windows 10/11
REM Fecha: Enero 2025
REM ============================================

echo.
echo 🎯 ===== INSTALADOR SERVITECH - WINDOWS =====
echo 📅 Fecha: %date% %time%
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERROR: Se requieren permisos de administrador
    echo 💡 Ejecuta como "Ejecutar como administrador"
    pause
    exit /b 1
)

echo ✅ Permisos de administrador verificados
echo.

REM Colores para PowerShell (fallback a echo normal)
setlocal EnableDelayedExpansion

echo 🔍 VERIFICANDO REQUISITOS DEL SISTEMA...
echo.

REM Verificar si Chocolatey está instalado
where choco >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Chocolatey no está instalado
    echo 📦 Instalando Chocolatey...
    
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    if %errorLevel% neq 0 (
        echo ❌ Error instalando Chocolatey
        pause
        exit /b 1
    )
    
    echo ✅ Chocolatey instalado correctamente
    
    REM Actualizar PATH
    call refreshenv
) else (
    echo ✅ Chocolatey ya está instalado
)

echo.
echo 📦 INSTALANDO DEPENDENCIAS...
echo.

REM Instalar Node.js
echo 🔧 Instalando Node.js...
choco install nodejs.install -y
if %errorLevel% neq 0 (
    echo ❌ Error instalando Node.js
    pause
    exit /b 1
)

REM Instalar MongoDB
echo 🗄️  Instalando MongoDB...
choco install mongodb -y
if %errorLevel% neq 0 (
    echo ❌ Error instalando MongoDB
    echo 💡 Puedes instalarlo manualmente desde: https://www.mongodb.com/try/download/community
)

REM Instalar Git (si no está)
echo 📚 Verificando Git...
where git >nul 2>&1
if %errorLevel% neq 0 (
    echo 🔧 Instalando Git...
    choco install git -y
) else (
    echo ✅ Git ya está instalado
)

REM Instalar herramientas adicionales
echo 🛠️  Instalando herramientas adicionales...
choco install vscode wget curl -y

echo.
echo ✅ DEPENDENCIAS INSTALADAS
echo.

REM Verificar instalaciones
echo 🔍 VERIFICANDO INSTALACIONES...
echo.

node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Node.js: 
    node --version
) else (
    echo ❌ Node.js no está disponible
)

npm --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ npm: 
    npm --version
) else (
    echo ❌ npm no está disponible
)

git --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Git: 
    git --version
) else (
    echo ❌ Git no está disponible
)

echo.
echo 📁 CONFIGURANDO PROYECTO...
echo.

REM Crear directorio del proyecto si no existe
if not exist "C:\ServiTech" (
    mkdir "C:\ServiTech"
    echo ✅ Directorio C:\ServiTech creado
)

REM Cambiar al directorio del proyecto
cd /d "C:\ServiTech"

REM Clonar repositorio si no existe
if not exist "SERVITECH" (
    echo 📥 Clonando repositorio...
    git clone https://github.com/DianaJJ0/servitechWeb.git
    if %errorLevel% neq 0 (
        echo ❌ Error clonando repositorio
        echo 💡 Verifica tu conexión a internet
        pause
        exit /b 1
    )
    echo ✅ Repositorio clonado correctamente
) else (
    echo ✅ Repositorio ya existe
)

REM Navegar al proyecto
cd SERVITECH\backend

REM Instalar dependencias Node.js
echo 📦 Instalando dependencias del proyecto...
npm install
if %errorLevel% neq 0 (
    echo ❌ Error instalando dependencias npm
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas correctamente
echo.

REM Crear archivo .env si no existe
if not exist ".env" (
    echo ⚙️  Creando archivo de configuración...
    
    echo # ======================================== > .env
    echo # 🗄️ BASE DE DATOS >> .env
    echo # ======================================== >> .env
    echo MONGODB_URI=mongodb://localhost:27017/servitech >> .env
    echo DB_NAME=servitech >> .env
    echo. >> .env
    echo # ======================================== >> .env
    echo # 🌐 SERVIDOR >> .env
    echo # ======================================== >> .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # ======================================== >> .env
    echo # 🔐 SEGURIDAD JWT >> .env
    echo # ======================================== >> .env
    echo JWT_SECRET=servitech_jwt_secret_windows_2025 >> .env
    echo JWT_EXPIRES_IN=7d >> .env
    echo. >> .env
    echo # ======================================== >> .env
    echo # 🏦 PAGOS PSE - DESARROLLO >> .env
    echo # ======================================== >> .env
    echo PSE_MERCHANT_ID=test_merchant_windows >> .env
    echo PSE_API_KEY=test_api_key_windows >> .env
    echo PSE_SECRET_KEY=test_secret_key_windows >> .env
    echo PSE_ENVIRONMENT=sandbox >> .env
    echo PSE_BASE_URL=https://sandbox.api.pse.com.co >> .env
    echo. >> .env
    echo # ======================================== >> .env
    echo # 📱 SOCKET.IO >> .env
    echo # ======================================== >> .env
    echo SOCKET_CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000 >> .env
    echo. >> .env
    
    echo ✅ Archivo .env creado con configuración por defecto
) else (
    echo ✅ Archivo .env ya existe
)

echo.
echo 🗄️  CONFIGURANDO MONGODB...
echo.

REM Iniciar servicio MongoDB
net start MongoDB >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Servicio MongoDB iniciado
) else (
    echo ⚠️  Intentando iniciar MongoDB manualmente...
    
    REM Intentar iniciar MongoDB desde su ubicación típica
    if exist "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" (
        echo 🔧 Iniciando MongoDB desde Program Files...
        start /B "MongoDB" "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
        timeout /t 3 >nul
        echo ✅ MongoDB iniciado manualmente
    ) else (
        echo ❌ No se pudo iniciar MongoDB automáticamente
        echo 💡 Inicia MongoDB manualmente antes de usar el sistema
    )
)

echo.
echo 🧪 EJECUTANDO PRUEBAS...
echo.

REM Verificar conectividad de la base de datos
echo 🔍 Verificando conexión a MongoDB...
mongosh --eval "db.runCommand({ connectionStatus: 1 })" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Conexión a MongoDB exitosa
) else (
    echo ⚠️  No se pudo verificar la conexión a MongoDB
)

REM Crear script de inicio
echo 📝 Creando scripts de inicio...

echo @echo off > start-servitech.bat
echo echo 🚀 Iniciando ServiTech... >> start-servitech.bat
echo cd /d "%~dp0" >> start-servitech.bat
echo npm start >> start-servitech.bat
echo pause >> start-servitech.bat

echo @echo off > start-dev.bat
echo echo 🔧 Iniciando ServiTech en modo desarrollo... >> start-dev.bat
echo cd /d "%~dp0" >> start-dev.bat
echo npm run dev >> start-dev.bat
echo pause >> start-dev.bat

echo ✅ Scripts de inicio creados
echo.

echo 🎊 ================================
echo    INSTALACIÓN COMPLETADA
echo ================================ 🎊
echo.
echo ✅ ServiTech está listo para usar
echo.
echo 📂 Ubicación: C:\ServiTech\SERVITECH
echo 🌐 URL: http://localhost:3000
echo 👑 Admin: http://localhost:3000/admin
echo.
echo 🚀 COMANDOS PARA INICIAR:
echo.
echo   📁 Navegar al proyecto:
echo      cd C:\ServiTech\SERVITECH\backend
echo.
echo   🔧 Modo desarrollo:
echo      npm run dev
echo      (o hacer doble clic en start-dev.bat)
echo.
echo   🚀 Modo producción:
echo      npm start
echo      (o hacer doble clic en start-servitech.bat)
echo.
echo 🧪 PROBAR EL SISTEMA:
echo.
echo   1. Abrir: test_mensajeria_completa.html
echo   2. Conectar con usuario: test_user_001
echo   3. Probar chat en tiempo real
echo.
echo 📚 DOCUMENTACIÓN:
echo.
echo   - README.md: Documentación completa
echo   - DOCUMENTACION_COMPLETA_FINAL.md: Resumen técnico
echo   - MENSAJERIA_IMPLEMENTACION.md: Chat en tiempo real
echo.
echo 🔧 CONFIGURACIÓN ADICIONAL:
echo.
echo   - Editar .env para configuración personalizada
echo   - Configurar MongoDB si es necesario
echo   - Revisar URLs y credenciales PSE
echo.
echo 📞 SOPORTE:
echo   📧 soporte@servitech.com
echo   💬 WhatsApp: +57 300 123 4567
echo   🌐 GitHub: @DianaJJ0
echo.
echo ¿Deseas iniciar ServiTech ahora? (S/N)
set /p choice="> "

if /i "%choice%"=="S" (
    echo.
    echo 🚀 Iniciando ServiTech en modo desarrollo...
    echo 🌐 Abriendo en: http://localhost:3000
    echo.
    
    REM Abrir navegador
    start http://localhost:3000
    
    REM Iniciar servidor
    npm run dev
) else (
    echo.
    echo ✅ Instalación completada
    echo 💡 Para iniciar más tarde, ejecuta: npm run dev
    echo.
)

echo.
echo 🎉 ¡Gracias por usar ServiTech!
echo 👨‍💻 Desarrollado por Diana Carolina Jiménez
echo.
pause
