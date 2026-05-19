# MongoDB Backup and Restore

This project stores room and reservation data in the MongoDB database
`room_rental`. In Docker Compose, the database runs in the container
`room-rental-mongodb` and persists data in the Docker volume `mongodb_data`.

Backups use MongoDB's native archive format through `mongodump`. Restores use
`mongorestore --drop`, which replaces the current database with the content of
the selected backup archive.

## Backup Strategy

- Create a backup before demos, releases, database migrations, or manual data
  changes.
- Store backup archives outside the Docker volume so they survive
  `docker compose down -v`.
- Keep at least the latest known-good backup and any backup taken before a
  larger change.
- Do not commit backup archives to Git. They can contain personal contact and
  billing data from reservations.

Backups are written to `backups/` by default. The folder is ignored by Git.

## Prerequisites

1. Docker Desktop is running.
2. The MongoDB container is running:

   ```powershell
   docker compose up mongodb -d
   ```

3. Run commands from the repository root.

## Create a Backup

Run:

```powershell
.\scripts\backup-mongodb.ps1
```

Expected result:

- A file like `backups/room_rental-20260519-143000.archive.gz` is created.
- The script prints the full backup path.

Optional parameters:

```powershell
.\scripts\backup-mongodb.ps1 -Database room_rental -Container room-rental-mongodb -OutputDir backups
```

## Restore a Backup

Restoring replaces the current `room_rental` database with the backup content.
Confirm that the selected archive is correct before running the command.

```powershell
.\scripts\restore-mongodb.ps1 -ArchivePath .\backups\room_rental-20260519-143000.archive.gz -ConfirmDataLoss
```

After restore, check that the application can read the recovered data:

```powershell
curl http://localhost:8000/reservations
```

## Verify Backup and Restore with Sample Data

Use this only on a development or test database. The verification script creates
a sample document, backs up the database, deletes the sample document, restores
the backup with `--drop`, and confirms that the sample document was recovered.

```powershell
.\scripts\verify-mongodb-restore.ps1 -ConfirmDataLoss
```

Expected final line:

```text
Restore verification succeeded.
```

## Manual Commands

The scripts above wrap these MongoDB commands:

```powershell
docker exec room-rental-mongodb mongodump --db room_rental --archive=/tmp/room_rental_backup.archive.gz --gzip
docker cp room-rental-mongodb:/tmp/room_rental_backup.archive.gz .\backups\
```

```powershell
docker cp .\backups\room_rental_backup.archive.gz room-rental-mongodb:/tmp/
docker exec room-rental-mongodb mongorestore --db room_rental --archive=/tmp/room_rental_backup.archive.gz --gzip --drop
```

## Recovery Notes for IT/Support

- Normal `docker compose down` does not delete data because MongoDB uses the
  named volume `mongodb_data`.
- `docker compose down -v` deletes the database volume. Restore from the latest
  backup after starting MongoDB again.
- A restore is intentionally destructive for the target database. If possible,
  take a fresh backup before restoring an older archive.
- If `mongodump`, `mongorestore`, or `mongosh` is missing in the MongoDB
  container, install MongoDB Database Tools on the host or use a MongoDB image
  that includes the tools, then run the manual commands against
  `mongodb://localhost:27017`.
