# Generate Secrets for Vercel

## Quick Secret Generation

### Option 1: Online Generators (Easiest)

**NEXTAUTH_SECRET:**
- Go to: https://generate-secret.vercel.app/32
- Copy the generated secret

**ENCRYPTION_KEY:**
- Go to: https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=off&unique=on&format=html&rnd=new
- Copy the 64-character string

### Option 2: PowerShell (Windows)

**NEXTAUTH_SECRET:**
```powershell
$bytes = 1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }
[Convert]::ToBase64String($bytes)
```

**ENCRYPTION_KEY:**
```powershell
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

### Option 3: Node.js

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 4: OpenSSL (if installed)

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32
```

## Example Output

**NEXTAUTH_SECRET:**
```
aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890=
```

**ENCRYPTION_KEY:**
```
1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890
```

## Important Notes

- **Never commit these secrets to Git**
- **Use different secrets for development and production**
- **Keep secrets secure and don't share them**
- **Regenerate if accidentally exposed**
