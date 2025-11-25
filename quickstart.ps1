# Quick Start Script for Windows

Write-Host "🚀 Antigravity Persona Replicator - Quick Start" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file. Please edit it with your credentials:" -ForegroundColor Green
    Write-Host "   - DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to continue after editing .env..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Gray
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend installation failed" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend installation failed" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🗄️  Setting up database..." -ForegroundColor Cyan
Set-Location backend
npm run migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database migration failed. Make sure PostgreSQL is running and DATABASE_URL is correct." -ForegroundColor Yellow
} else {
    Write-Host "✅ Database migrated" -ForegroundColor Green
    
    # Ask if user wants to seed
    Write-Host ""
    $seed = Read-Host "Do you want to seed the database with demo data? (y/n)"
    if ($seed -eq "y") {
        node db/seed.js
        Write-Host "✅ Database seeded with demo data" -ForegroundColor Green
        Write-Host "   Email: demo@antigravity.ai" -ForegroundColor Cyan
        Write-Host "   Password: test123" -ForegroundColor Cyan
    }
}
Set-Location ..

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "  1. Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker Compose:" -ForegroundColor Cyan
Write-Host "  docker-compose up" -ForegroundColor White
Write-Host ""
