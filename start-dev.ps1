# Development Setup Script
# Run both Vite and Vercel dev servers

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 Starting Development Servers     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📋 Setup Instructions:`n" -ForegroundColor Yellow
Write-Host "  1️⃣  This terminal: Vercel Dev Server (API routes)" -ForegroundColor White
Write-Host "  2️⃣  Open new terminal: npm run dev (Frontend)`n" -ForegroundColor White

Write-Host "⚡ Quick Start:`n" -ForegroundColor Cyan
Write-Host "  Terminal 1 (this): " -NoNewline -ForegroundColor Gray
Write-Host "vercel dev --listen 3000" -ForegroundColor Yellow
Write-Host "  Terminal 2 (new):  " -NoNewline -ForegroundColor Gray
Write-Host "npm run dev`n" -ForegroundColor Yellow

Write-Host "🌐 URLs after starting:`n" -ForegroundColor Magenta
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3000`n" -ForegroundColor Green

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Starting Vercel Dev Server...        ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Start Vercel dev server
vercel dev --listen 3000
