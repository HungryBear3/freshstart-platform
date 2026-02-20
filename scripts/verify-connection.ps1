# Verify database connection and .env.local format

Write-Host "`n=== Database Connection Verification ===" -ForegroundColor Cyan

# Test 1: Check if .env.local exists
Write-Host "`n1️⃣ Checking .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local exists" -ForegroundColor Green
    
    # Read and display (masked) connection string
    $content = Get-Content .env.local -Raw
    if ($content -match 'DATABASE_URL="([^"]*)"') {
        $dbUrl = $matches[1]
        $masked = $dbUrl -replace ':[^:@]+@', ':****@'
        Write-Host "   Connection string: $masked" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  DATABASE_URL not found in .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env.local not found" -ForegroundColor Red
}

# Test 2: Test psql connection
Write-Host "`n2️⃣ Testing psql connection..." -ForegroundColor Yellow
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (Test-Path $psqlPath) {
    $env:PGPASSWORD = "Doctor4me"
    $result = & $psqlPath -U postgres -d newstart_il -c "SELECT current_database(), current_user;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ psql connection successful!" -ForegroundColor Green
        Write-Host "   Password 'Doctor4me' is correct" -ForegroundColor Green
    } else {
        Write-Host "   ❌ psql connection failed" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
    }
    Remove-Item Env:\PGPASSWORD
} else {
    Write-Host "   ⚠️  psql not found at expected location" -ForegroundColor Yellow
}

# Test 3: Test with Node.js/Prisma
Write-Host "`n3️⃣ Testing Node.js connection..." -ForegroundColor Yellow
Write-Host "   Running: npm run db:test" -ForegroundColor Gray
$testResult = npm run db:test 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Node.js connection successful!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js connection failed" -ForegroundColor Red
    Write-Host "   This might be a URL encoding issue" -ForegroundColor Yellow
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If psql works but Node.js doesn't, the issue is likely:" -ForegroundColor Yellow
Write-Host "  - URL encoding in connection string" -ForegroundColor White
Write-Host "  - Special characters in password" -ForegroundColor White
Write-Host "  - .env.local file format" -ForegroundColor White
