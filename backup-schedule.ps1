$taskName = "CRM Daily Database Backup"
$backupScript = Join-Path $PSScriptRoot "backup.bat"

$action = New-ScheduledTaskAction -Execute $backupScript
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00am
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Runs the CRM PostgreSQL backup daily and keeps 30 days of .sql files." `
  -Force

Write-Host "Scheduled task '$taskName' registered for daily 02:00 backups."
