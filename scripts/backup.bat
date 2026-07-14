@echo off
set BACKUP_DIR=%~dp0..\backups
set DB_NAME=%DB_NAME%
set DB_USER=%DB_USER%
set RETENTION_DAYS=%RETENTION_DAYS%

if "%DB_NAME%"=="" set DB_NAME=crm
if "%DB_USER%"=="" set DB_USER=postgres
if "%RETENTION_DAYS%"=="" set RETENTION_DAYS=30

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

pg_dump -U %DB_USER% -d %DB_NAME% -f "%BACKUP_DIR%\crm_backup_%DATE:~-4%%DATE:~3,2%%DATE:~0,2%.sql"

forfiles /p "%BACKUP_DIR%" /m *.sql /d -%RETENTION_DAYS% /c "cmd /c del @path"

echo Backup completed.
