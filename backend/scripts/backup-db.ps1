$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $projectRoot "prisma\dev.db"
$backupDir = Join-Path (Split-Path -Parent $projectRoot) "backup"

if (!(Test-Path $dbPath)) {
  throw "Database file not found: $dbPath"
}

New-Item -ItemType Directory -Force $backupDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = Join-Path $backupDir "dev-$stamp.db"

Copy-Item $dbPath $dest -Force
Write-Output "Backup created: $dest"
