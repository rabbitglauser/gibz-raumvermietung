param(
    [Parameter(Mandatory = $true)]
    [string]$ArchivePath,

    [string]$Database = "room_rental",
    [string]$Container = "room-rental-mongodb",

    [switch]$ConfirmDataLoss
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmDataLoss) {
    throw "Restore uses --drop and replaces database '$Database'. Re-run with -ConfirmDataLoss when you have selected the correct backup."
}

$resolvedArchive = (Resolve-Path $ArchivePath).Path
$archiveName = Split-Path -Leaf $resolvedArchive
$containerArchive = "/tmp/$archiveName"

Write-Host "Copying backup archive '$resolvedArchive' to MongoDB container '$Container'..."
& docker cp $resolvedArchive "$Container`:$containerArchive"
if ($LASTEXITCODE -ne 0) {
    throw "docker cp failed while copying '$resolvedArchive' into '$Container'."
}

Write-Host "Restoring database '$Database' from '$archiveName'..."
& docker exec $Container mongorestore --db $Database --archive=$containerArchive --gzip --drop
if ($LASTEXITCODE -ne 0) {
    throw "mongorestore failed. The existing database may be unchanged or partially restored; check MongoDB logs before retrying."
}

& docker exec $Container rm -f $containerArchive | Out-Null

Write-Host "Restore completed for database '$Database'."
