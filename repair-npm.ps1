$ErrorActionPreference = "Stop"

Write-Host "Corrigindo o registro npm do JobSearch..." -ForegroundColor Cyan
npm config set registry "https://registry.npmjs.org/"

Remove-Item Env:NPM_CONFIG_REGISTRY -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

if (Test-Path package-lock.json) {
    $lock = Get-Content package-lock.json -Raw
    $lock = $lock.Replace(
        "https://packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public",
        "https://registry.npmjs.org"
    )
    Set-Content package-lock.json -Value $lock -Encoding UTF8
}

Write-Host "Registro ativo:" -ForegroundColor Green
npm config get registry

Write-Host "Instalando dependências..." -ForegroundColor Cyan
npm ci --registry="https://registry.npmjs.org/" --no-audit --no-fund

Write-Host "Testando o build..." -ForegroundColor Cyan
npm run build

Write-Host "Concluído. Para abrir o projeto, execute: npm run dev" -ForegroundColor Green
