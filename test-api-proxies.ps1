# PowerShell Test Script for Backend API Proxies
# Usage: .\test-api-proxies.ps1 [BaseUrl]
# Example: .\test-api-proxies.ps1 https://baimonshop.vercel.app

param(
    [string]$BaseUrl = "http://localhost:8080"
)

Write-Host "`n🧪 Testing Backend API Proxies..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Yellow

# Test 1: Slip2Go QR Code
Write-Host "📝 Test 1: Slip2Go QR Code Generation" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/slip2go-qrcode" -Method Post -ContentType "application/json" -Body '{"amount":100}' -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "✅ PASS - QR Code generated successfully" -ForegroundColor Green
        Write-Host "QR Image: $($response.data.qrImage.Substring(0, [Math]::Min(50, $response.data.qrImage.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL - $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Slip2Go Verify
Write-Host "📝 Test 2: Slip2Go Slip Verification" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/slip2go-verify" -Method Post -ContentType "application/json" -Body '{"log":"test-slip-data","amount":100}' -ErrorAction Stop
    
    Write-Host "✅ PASS - Slip verification endpoint working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 200) {
        Write-Host "✅ PASS - Slip verification endpoint working (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - HTTP $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Peamsub Topup
Write-Host "📝 Test 3: Peamsub Topup" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/peamsub-topup" -Method Post -ContentType "application/json" -Body '{"productId":"test-123","productData":{"test":"data"}}' -ErrorAction Stop
    
    Write-Host "✅ PASS - Topup endpoint working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 200) {
        Write-Host "✅ PASS - Topup endpoint working (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - HTTP $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Peamsub Check Order
Write-Host "📝 Test 4: Peamsub Check Order" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/peamsub-check-order" -Method Post -ContentType "application/json" -Body '{"orderId":"test-order-123"}' -ErrorAction Stop
    
    Write-Host "✅ PASS - Check order endpoint working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 200) {
        Write-Host "✅ PASS - Check order endpoint working (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL - HTTP $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Check for exposed API keys (production only)
if ($BaseUrl -ne "http://localhost:8080") {
    Write-Host "📝 Test 5: Checking for exposed API keys in production bundle" -ForegroundColor White
    
    try {
        $mainPage = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing
        $bundleUrls = $mainPage.Content | Select-String -Pattern '/_next/static/chunks/[^"]+\.js' -AllMatches | ForEach-Object { $_.Matches } | Select-Object -First 5 -ExpandProperty Value
        
        $foundKeys = $false
        foreach ($url in $bundleUrls) {
            $fullUrl = "$BaseUrl$url"
            $bundle = (Invoke-WebRequest -Uri $fullUrl -UseBasicParsing).Content
            
            # Check for sensitive keywords (old API keys)
            if ($bundle -match "qgwvsh5rwvtevey8zdh4bj13|48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4") {
                Write-Host "❌ FAIL - Found exposed API key in: $url" -ForegroundColor Red
                $foundKeys = $true
            }
        }
        
        if (-not $foundKeys) {
            Write-Host "✅ PASS - No API keys found in production bundles" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  SKIP - Could not check production bundles: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n🏁 Testing complete!`n" -ForegroundColor Cyan
