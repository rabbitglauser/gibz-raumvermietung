param(
    [string]$Database = "room_rental",
    [string]$Container = "room-rental-mongodb",
    [string]$OutputDir = "backups",

    [switch]$ConfirmDataLoss
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmDataLoss) {
    throw "This verification performs a restore with --drop. Use only on a development/test database and re-run with -ConfirmDataLoss."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$marker = "backup-restore-verification-$(Get-Date -Format 'yyyyMMddHHmmss')"

if ([System.IO.Path]::IsPathRooted($OutputDir)) {
    $backupDir = $OutputDir
} else {
    $backupDir = Join-Path $repoRoot $OutputDir
}

Write-Host "Inserting sample verification document '$marker'..."
$insertJs = "const dbx = db.getSiblingDB('$Database'); dbx.backup_restore_checks.insertOne({ marker: '$marker', created_at: new Date(), purpose: 'backup restore verification' });"
& docker exec $Container mongosh --quiet --eval $insertJs
if ($LASTEXITCODE -ne 0) {
    throw "Could not insert verification document. Check that Docker is running and mongosh is available in the MongoDB container."
}

& (Join-Path $scriptDir "backup-mongodb.ps1") -Database $Database -Container $Container -OutputDir $OutputDir

$latestBackup = Get-ChildItem -Path $backupDir -Filter "$Database-*.archive.gz" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $latestBackup) {
    throw "No backup archive was created."
}

Write-Host "Deleting sample verification document before restore..."
$deleteJs = "const dbx = db.getSiblingDB('$Database'); dbx.backup_restore_checks.deleteOne({ marker: '$marker' });"
& docker exec $Container mongosh --quiet --eval $deleteJs
if ($LASTEXITCODE -ne 0) {
    throw "Could not delete verification document before restore."
}

& (Join-Path $scriptDir "restore-mongodb.ps1") -ArchivePath $latestBackup.FullName -Database $Database -Container $Container -ConfirmDataLoss

Write-Host "Checking that the sample document was recovered..."
$countJs = "const dbx = db.getSiblingDB('$Database'); print(dbx.backup_restore_checks.countDocuments({ marker: '$marker' }));"
$count = & docker exec $Container mongosh --quiet --eval $countJs
if ($LASTEXITCODE -ne 0) {
    throw "Could not verify restored document."
}

if (($count | Select-Object -Last 1) -ne "1") {
    throw "Restore verification failed: sample document '$marker' was not recovered."
}

Write-Host "Restore verification succeeded. Sample document '$marker' was recovered from '$($latestBackup.FullName)'."
