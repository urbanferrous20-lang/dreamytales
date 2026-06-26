# Creates dreamytales-deploy.zip for uploading to Plesk httpdocs
# Run from project root:  powershell -ExecutionPolicy Bypass -File scripts/package-for-plesk.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$zipName = "dreamytales-deploy.zip"
$staging = Join-Path $env:TEMP "dreamytales-plesk-staging"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$excludeDirs = @("node_modules", ".next", ".git", "storage", "assets", "dev.db")
$excludeFiles = @(".env.local", ".env", $zipName)

Get-ChildItem -Path $root -Force | ForEach-Object {
  if ($excludeDirs -contains $_.Name) { return }
  if ($excludeFiles -contains $_.Name) { return }
  Copy-Item -Path $_.FullName -Destination (Join-Path $staging $_.Name) -Recurse -Force
}

# Ensure storage dirs exist (empty)
New-Item -ItemType Directory -Path (Join-Path $staging "storage\stories") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $staging "storage\images") -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $staging "storage\stories\.gitkeep") -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $staging "storage\images\.gitkeep") -Force | Out-Null

$zipPath = Join-Path $root $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

# Verify schema inside zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$schemaEntry = $archive.Entries | Where-Object { $_.FullName -eq "prisma/schema.prisma" -or $_.FullName -eq "prisma\schema.prisma" }
if (-not $schemaEntry) {
  Write-Error "ZIP is missing prisma/schema.prisma"
}
$stream = $schemaEntry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$firstLine = $reader.ReadLine()
$reader.Close()
$stream.Close()
$archive.Dispose()

if ($firstLine -notmatch "generator client") {
  Write-Error "ZIP prisma/schema.prisma looks wrong: $firstLine"
}

Write-Host ""
Write-Host "Created: $zipPath"
Write-Host "First line of prisma/schema.prisma: $firstLine"
Write-Host ""
Write-Host "Upload steps:"
Write-Host "  1. Plesk File Manager -> httpdocs -> delete ALL old files"
Write-Host "  2. Upload dreamytales-deploy.zip"
Write-Host "  3. Extract zip INTO httpdocs (not into a subfolder)"
Write-Host "  4. Run: node scripts/verify-deploy-files.js"
Write-Host "  5. Then: npm install"
Write-Host ""
