Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO DESPLIEGUE GITHUB PAGES" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Obtener fecha
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$buildDate = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "📅 Fecha: $timestamp" -ForegroundColor Yellow

# Verificar rama
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "❌ ERROR: Debes estar en la rama 'main'" -ForegroundColor Red
    Write-Host "💡 Ejecuta: git checkout main" -ForegroundColor Yellow
    exit 1
}

# Actualizar build-info.ts
Write-Host "🔄 Actualizando build-info.ts..." -ForegroundColor Magenta
$buildInfoContent = @"
// ARCHIVO GENERADO AUTOMATICAMENTE
export const BUILD_INFO = {
    timestamp: '$timestamp',
    buildDate: '$buildDate',
    version: '1.0.$buildDate'
};
"@
Set-Content -Path "src/build-info.ts" -Value $buildInfoContent -Encoding UTF8

# Compilar
Write-Host "📦 Compilando proyecto..." -ForegroundColor Cyan
npm run build

# Verificar
if (-not (Test-Path "dist")) {
    Write-Host "❌ ERROR: No se creo la carpeta 'dist'" -ForegroundColor Red
    exit 1
}

# Crear .nojekyll
Write-Host "📄 Creando archivos de configuracion..." -ForegroundColor Magenta
"" | Out-File -FilePath "dist/.nojekyll" -Encoding ASCII

# Desplegar
Write-Host "🌐 Desplegando en GitHub Pages..." -ForegroundColor Green
npx gh-pages -d dist --dotfiles

# Mostrar info
Write-Host ""
Write-Host "✅ ¡DESPLIEGUE COMPLETADO!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Tu sitio: https://virgenes.github.io/LaCueva" -ForegroundColor Blue
Write-Host "🔗 Sin cache: https://virgenes.github.io/LaCueva?t=$buildDate" -ForegroundColor Blue
Write-Host ""
Write-Host "🔄 Espera 2-3 minutos y abre el enlace." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

# Abrir navegador
$url = "https://virgenes.github.io/LaCueva?t=$buildDate"
Start-Process $url