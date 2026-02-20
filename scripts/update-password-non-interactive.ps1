# Non-interactive password update script
# This script updates .env.local and provides instructions for PostgreSQL

param(
    [string]$NewPassword = "64cG6rtNbaUjyQSXm0MTSjdPEX7EvVEQCSQyZU6IR0E="
)

Write-Host "`n=== Database Password Update ===" -ForegroundColor Cyan

# Step 1: Update .env.local
Write-Host "`n✅ Step 1: Updating .env.local..." -ForegroundColor Yellow

$envFile = ".env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Escape special characters in password for URL
    $encodedPassword = [System.Web.HttpUtility]::UrlEncode($newPassword)
    
    $newDbUrl = "DATABASE_URL=`"postgresql://postgres:$encodedPassword@localhost:5432/newstart_il`""
    
    if ($content -match 'DATABASE_URL="[^"]*"') {
        $content = $content -replace 'DATABASE_URL="[^"]*"', $newDbUrl
        Write-Host "   Updated existing DATABASE_URL" -ForegroundColor Green
    } else {
        $content += "`n$newDbUrl"
        Write-Host "   Added DATABASE_URL" -ForegroundColor Green
    }
    
    $content | Set-Content $envFile -NoNewline
    Write-Host "   ✅ .env.local updated successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env.local not found, creating it..." -ForegroundColor Yellow
    $encodedPassword = [System.Web.HttpUtility]::UrlEncode($newPassword)
    $newDbUrl = "DATABASE_URL=`"postgresql://postgres:$encodedPassword@localhost:5432/newstart_il`""
    $newDbUrl | Set-Content $envFile
    Write-Host "   ✅ Created .env.local" -ForegroundColor Green
}

# Step 2: Instructions for PostgreSQL
Write-Host "`n📝 Step 2: Update PostgreSQL Password" -ForegroundColor Yellow
Write-Host "`nYou have two options:" -ForegroundColor White

Write-Host "`nOption A: Use pgAdmin (Easiest - No typing password)" -ForegroundColor Cyan
Write-Host "   1. Open pgAdmin from Start Menu" -ForegroundColor Gray
Write-Host "   2. Connect to PostgreSQL server" -ForegroundColor Gray
Write-Host "   3. Right-click 'postgres' user → Properties → Definition" -ForegroundColor Gray
Write-Host "   4. Set password to: $NewPassword" -ForegroundColor Gray
Write-Host "   5. Click Save" -ForegroundColor Gray

Write-Host "`nOption B: Use psql (Requires current password)" -ForegroundColor Cyan
Write-Host "   Run this command:" -ForegroundColor Gray
Write-Host '   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD ''$NewPassword'';"' -ForegroundColor Yellow
Write-Host "   ⚠️  Password input is HIDDEN (this is normal for security)" -ForegroundColor Yellow
Write-Host "      Just type your current password and press Enter" -ForegroundColor Gray

Write-Host "`n✅ Step 3: After updating PostgreSQL, test connection:" -ForegroundColor Green
Write-Host "   npm run db:test" -ForegroundColor Cyan

Write-Host "`n📋 Password to use:" -ForegroundColor Yellow
Write-Host "   $NewPassword" -ForegroundColor Cyan
