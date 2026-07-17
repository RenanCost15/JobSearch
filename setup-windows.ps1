$ErrorActionPreference = "Stop"

$NodeVersion = "24.18.0"

Write-Host "Inicializando o FNM..." -ForegroundColor Cyan
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression

Write-Host "Instalando o Node.js $NodeVersion LTS..." -ForegroundColor Cyan
fnm install $NodeVersion
fnm use $NodeVersion
fnm default $NodeVersion

Set-Content -Path ".node-version" -Value $NodeVersion -Encoding ASCII
Set-Content -Path ".nvmrc" -Value $NodeVersion -Encoding ASCII

Write-Host "Configurando o FNM no perfil do PowerShell..." -ForegroundColor Cyan
$FnmInit = 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
if (-not (Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
$ProfileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if ($ProfileContent -notlike "*fnm env --use-on-cd*") {
    Add-Content -Path $PROFILE -Value "`n$FnmInit"
}

Write-Host "Configurando o registro público do npm..." -ForegroundColor Cyan
npm config set registry "https://registry.npmjs.org/"

Write-Host "Limpando dependências anteriores..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue

Write-Host "Instalando dependências travadas no package-lock.json..." -ForegroundColor Cyan
npm ci --no-audit --no-fund

Write-Host "Testando o build de produção..." -ForegroundColor Cyan
npm run build

Write-Host "" 
Write-Host "Ambiente configurado com sucesso." -ForegroundColor Green
Write-Host "Node:" -NoNewline; node -v
Write-Host "npm:" -NoNewline; npm -v
Write-Host "Para iniciar: npm run dev" -ForegroundColor Yellow
