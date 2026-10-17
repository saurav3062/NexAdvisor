param(
  [Parameter(Mandatory)][ValidateSet('Backup', 'Restore')][string]$Action,
  [Parameter(Mandatory)][ValidatePattern('^[a-z][a-z0-9_]{0,62}$')][string]$Database,
  [Parameter(Mandatory)][string]$File,
  [string]$DatabaseHost = '127.0.0.1',
  [ValidateRange(1, 65535)][int]$Port = 5432,
  [string]$Username = 'nexadvisor',
  [string]$PostgresBin = ''
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# Use PGPASSFILE / PostgreSQL's password file. Never pass passwords as arguments.
function Invoke-Postgres([string]$Tool, [string[]]$Arguments) {
  $executable = if ($PostgresBin) { Join-Path $PostgresBin $Tool } else { $Tool }
  & $executable @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Tool failed with exit code $LASTEXITCODE. No existing database was removed." }
}
$targetFile = [System.IO.Path]::GetFullPath($File)
$connection = @('--host', $DatabaseHost, '--port', "$Port", '--username', $Username, '--no-password')
if ($Action -eq 'Backup') {
  if ((Test-Path -LiteralPath $targetFile) -or (Test-Path -LiteralPath "$targetFile.partial")) {
    throw 'Choose a new backup filename; existing backups are never overwritten.'
  }
  if (!(Test-Path -LiteralPath (Split-Path -Parent $targetFile))) { throw 'Create a private backup directory first.' }
  Invoke-Postgres 'pg_dump' ($connection + @('--dbname', $Database, '--format=custom', '--file', "$targetFile.partial"))
  Invoke-Postgres 'pg_restore' @('--list', "$targetFile.partial") | Out-Null
  Move-Item -LiteralPath "$targetFile.partial" -Destination $targetFile
  Write-Output "Backup verified and saved to $targetFile"
} else {
  if (!(Test-Path -LiteralPath $targetFile -PathType Leaf)) { throw 'Backup file not found.' }
  # Verify the archive before creating a database. createdb refuses existing names.
  Invoke-Postgres 'pg_restore' @('--list', $targetFile) | Out-Null
  Invoke-Postgres 'createdb' ($connection + @('--template=template0', $Database))
  Invoke-Postgres 'pg_restore' ($connection + @('--dbname', $Database, '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges', $targetFile))
  Write-Output "Restored into new database $Database. Verify records and app access before switching any application connection."
}
