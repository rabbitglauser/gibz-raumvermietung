param(
    [string]$Database = "room_rental",
    [string]$Container = "room-rental-mongodb",
    [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

if ([System.IO.Path]::IsPathRooted($OutputDir)) {
    $backupDir = $OutputDir
} else {
    $backupDir = Join-Path $repoRoot $OutputDir
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "$Database-$timestamp.archive.gz"
$containerArchive = "/tmp/$archiveName"
$hostArchive = Join-Path $backupDir $archiveName

Write-Host "Creating MongoDB backup for database '$Database' from container '$Container'..."
& docker exec $Container mongodump --db $Database --archive=$containerArchive --gzip
if ($LASTEXITCODE -ne 0) {
    throw "mongodump failed. Check that Docker is running and the MongoDB container has mongodump installed."
}

& docker cp "$Container`:$containerArchive" $hostArchive
if ($LASTEXITCODE -ne 0) {
    throw "docker cp failed while copying backup archive to '$hostArchive'."
}

& docker exec $Container rm -f $containerArchive | Out-Null

Write-Host "Backup created: $hostArchive"
