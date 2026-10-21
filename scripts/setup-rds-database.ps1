# ==============================================================================
# Amazon RDS PostgreSQL Automated Setup Script (PowerShell)
# Project: Smart Appointment Platform
# Author: Adarsh Paul . T (24MIS0564) - Agile Development Process & DevOps
# ==============================================================================

param(
    [string]$Region = "ap-south-2",
    [string]$Profile = "devops-agent",
    [string]$DbIdentifier = "smart-appointment-db",
    [string]$MasterUser = "postgres",
    [string]$MasterPassword = "SmartAppointment2026!",
    [string]$DbName = "appointment_db"
)

$AwsCli = "C:\Users\T Adarsh Paul\AppData\Local\Programs\Amazon\AWSCLIV2\aws.exe"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "🚀 Automated Amazon RDS PostgreSQL Provisioning Pipeline" -ForegroundColor Cyan
Write-Host "Project: Smart Appointment Platform | Region: $Region" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Check if DB already exists
Write-Host "`n[1/4] Checking if DB instance '$DbIdentifier' exists..." -ForegroundColor Yellow
$check = & $AwsCli rds describe-db-instances --profile $Profile --region $Region --db-instance-identifier $DbIdentifier 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Instance '$DbIdentifier' already exists!" -ForegroundColor Green
} else {
    Write-Host "Creating new Amazon RDS instance '$DbIdentifier' (Free Tier db.t3.micro)..." -ForegroundColor Yellow
    & $AwsCli rds create-db-instance `
        --profile $Profile `
        --region $Region `
        --db-instance-identifier $DbIdentifier `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --engine-version "16.3" `
        --master-username $MasterUser `
        --master-user-password $MasterPassword `
        --allocated-storage 20 `
        --storage-type gp3 `
        --publicly-accessible `
        --db-name $DbName `
        --backup-retention-period 1 `
        --no-multi-az

    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️ RDS Creation could not proceed." -ForegroundColor Red
        Write-Host "Reason: Your AWS Project requires active subscription verification on https://console.aws.amazon.com" -ForegroundColor Red
        exit 1
    }
}

# 2. Wait for instance to become available
Write-Host "`n[2/4] Waiting for RDS instance to become 'available' (typically 5-10 minutes)..." -ForegroundColor Yellow
& $AwsCli rds wait db-instance-available --profile $Profile --region $Region --db-instance-identifier $DbIdentifier

# 3. Retrieve DB Endpoint
Write-Host "`n[3/4] Retrieving RDS Endpoint..." -ForegroundColor Yellow
$dbInfoJson = & $AwsCli rds describe-db-instances --profile $Profile --region $Region --db-instance-identifier $DbIdentifier --query "DBInstances[0].Endpoint.Address" --output text
$endpoint = $dbInfoJson.Trim()
Write-Host "RDS Endpoint: $endpoint" -ForegroundColor Green

# 4. Update backend/.env file
Write-Host "`n[4/4] Updating backend/.env configuration..." -ForegroundColor Yellow
$databaseUrl = "postgresql://${MasterUser}:${MasterPassword}@${endpoint}:5432/${DbName}?sslmode=require"
$envFile = "$(Get-Location)\backend\.env"

$envContent = @"
PORT=5000
NODE_ENV=development
JWT_SECRET=adarsh_college_project_secret_2026_dev
DATABASE_URL=$databaseUrl
DB_HOST=$endpoint
DB_PORT=5432
DB_NAME=$DbName
DB_USER=$MasterUser
DB_PASSWORD=$MasterPassword
DB_SSL=true
ENABLE_CLOUDWATCH=false
AWS_REGION=$Region
"@

Set-Content -Path $envFile -Value $envContent
Write-Host "backend/.env written with RDS Connection URL!" -ForegroundColor Green
Write-Host "`n==========================================================================" -ForegroundColor Cyan
Write-Host "✅ RDS PostgreSQL Database setup is complete!" -ForegroundColor Cyan
Write-Host "Restart your backend server to switch automatically to live Amazon RDS." -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
