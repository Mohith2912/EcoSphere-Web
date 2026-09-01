param(
  [Parameter(Mandatory = $false)]
  [ValidateNotNullOrEmpty()]
  [string]$MySqlUser = 'root'
)

$ErrorActionPreference = 'Stop'
$databaseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationPath = Join-Path $databaseRoot 'migrations/001_initial_schema.sql'
$seedPath = Join-Path $databaseRoot 'seeds/001_system_configuration.sql'
$verificationPath = Join-Path $databaseRoot 'queries/verification_queries.sql'

foreach ($requiredPath in @($migrationPath, $seedPath, $verificationPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath)) {
    throw "Required database file not found: $requiredPath"
  }
}

$mysqlCommand = Get-Command mysql -ErrorAction Stop

Write-Host 'Applying EcoSphere schema. MySQL will prompt for the password.'
& $mysqlCommand.Source --user=$MySqlUser --password --execute="SOURCE $($migrationPath.Replace('\', '/')); SOURCE $($seedPath.Replace('\', '/')); SOURCE $($verificationPath.Replace('\', '/'));"

if ($LASTEXITCODE -ne 0) {
  throw "EcoSphere database initialization failed with exit code $LASTEXITCODE."
}

Write-Host 'EcoSphere database initialized and zero-state checks completed.'

