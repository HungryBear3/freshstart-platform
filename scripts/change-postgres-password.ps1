# PowerShell script to change PostgreSQL password
# Run with: .\scripts\change-postgres-password.ps1

param(
    [string]$NewPassword = "Doctor4me",
    [string]$User = "postgres",
    [string]$Database = "newstart_il"
)

Write-Host "`n=== PostgreSQL Password Change Script ===" -ForegroundColor Cyan
Write-Host "`nThis script will help you change the PostgreSQL password." -ForegroundColor Yellow
Write-Host "`nTarget:" -ForegroundColor White
Write-Host "  User: $User" -ForegroundColor Gray
Write-Host "  New Password: $NewPassword" -ForegroundColor Gray
Write-Host "  Database: $Database" -ForegroundColor Gray

# Try to find psql
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        Write-Host "`n✅ Found psql at: $psql" -ForegroundColor Green
        break
    }
}

# Also check if psql is in PATH
if (-not $psql) {
    $psqlInPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlInPath) {
        $psql = $psqlInPath.Path
        Write-Host "`n✅ Found psql in PATH: $psql" -ForegroundColor Green
    }
}

if (-not $psql) {
    Write-Host "`n❌ psql not found!" -ForegroundColor Red
    Write-Host "`nPlease use one of these methods:" -ForegroundColor Yellow
    Write-Host "`nMethod 1: Use pgAdmin (GUI)" -ForegroundColor Cyan
    Write-Host "  1. Open pgAdmin"
    Write-Host "  2. Connect to PostgreSQL server"
    Write-Host "  3. Right-click 'Login/Group Roles' → 'postgres'"
    Write-Host "  4. Go to 'Definition' tab"
    Write-Host "  5. Enter password: $NewPassword"
    Write-Host "  6. Click 'Save'"
    
    Write-Host "`nMethod 2: Manual SQL Command" -ForegroundColor Cyan
    Write-Host "  Connect to PostgreSQL using any client and run:"
    Write-Host "  ALTER USER postgres WITH PASSWORD '$NewPassword';" -ForegroundColor Yellow
    
    Write-Host "`nMethod 3: Update .env.local instead" -ForegroundColor Cyan
    Write-Host "  If you know your current PostgreSQL password,"
    Write-Host "  update .env.local to use that password instead."
    
    exit 1
}

Write-Host "`n⚠️  You will be prompted for the CURRENT PostgreSQL password." -ForegroundColor Yellow
Write-Host "   (This is the password that currently works, not the new one)" -ForegroundColor Gray

$confirm = Read-Host "`nContinue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nExecuting password change..." -ForegroundColor Yellow

# Escape single quotes in password for SQL
$escapedPassword = $NewPassword.Replace("'", "''")
$sqlCommand = "ALTER USER $User WITH PASSWORD '$escapedPassword';"

try {
    # Run psql command
    $env:PGPASSWORD = ""  # Clear any existing password
    & $psql -U $User -d postgres -c $sqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Password changed successfully!" -ForegroundColor Green
        Write-Host "`nTesting connection..." -ForegroundColor Yellow
        
        # Test the connection
        $env:PGPASSWORD = $NewPassword
        $testResult = & $psql -U $User -d $Database -c "SELECT version();" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connection test passed!" -ForegroundColor Green
            Write-Host "`nYour .env.local should have:" -ForegroundColor Yellow
            Write-Host "DATABASE_URL=`"postgresql://$User`:$NewPassword@localhost:5432/$Database`"" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Password changed but connection test failed." -ForegroundColor Yellow
            Write-Host "   Make sure .env.local has the correct password." -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ Failed to change password." -ForegroundColor Red
        Write-Host "   Check the error message above." -ForegroundColor Yellow
        Write-Host "   Common issues:" -ForegroundColor Yellow
        Write-Host "   - Wrong current password" -ForegroundColor Gray
        Write-Host "   - PostgreSQL service not running" -ForegroundColor Gray
        Write-Host "   - Permission issues" -ForegroundColor Gray
    }
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
}

# Clean up
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
