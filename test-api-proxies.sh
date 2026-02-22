#!/bin/bash

# Test Backend API Proxies
# Run this after deploying to verify all proxies work correctly

BASE_URL=${1:-"http://localhost:8080"}

echo "🧪 Testing Backend API Proxies..."
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Slip2Go QR Code
echo "📝 Test 1: Slip2Go QR Code Generation"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/slip2go-qrcode" \
  -H "Content-Type: application/json" \
  -d '{"amount":100}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} - QR Code generated successfully"
  echo "Response: $(echo $BODY | jq -r '.data.qrImage' | cut -c1-50)..."
else
  echo -e "${RED}❌ FAIL${NC} - HTTP $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Slip2Go Verify (should fail with test data)
echo "📝 Test 2: Slip2Go Slip Verification"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/slip2go-verify" \
  -H "Content-Type: application/json" \
  -d '{"log":"test-slip-data","amount":100}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Slip verification endpoint working (HTTP $HTTP_CODE)"
  echo "Response: $(echo $BODY | jq -c '.' 2>/dev/null || echo $BODY)"
else
  echo -e "${RED}❌ FAIL${NC} - HTTP $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Peamsub Topup (should fail with test data)
echo "📝 Test 3: Peamsub Topup"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/peamsub-topup" \
  -H "Content-Type: application/json" \
  -d '{"productId":"test-123","productData":{"test":"data"}}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Topup endpoint working (HTTP $HTTP_CODE)"
  echo "Response: $(echo $BODY | jq -c '.' 2>/dev/null || echo $BODY)"
else
  echo -e "${RED}❌ FAIL${NC} - HTTP $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 4: Peamsub Check Order (should fail with test data)
echo "📝 Test 4: Peamsub Check Order"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/peamsub-check-order" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test-order-123"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Check order endpoint working (HTTP $HTTP_CODE)"
  echo "Response: $(echo $BODY | jq -c '.' 2>/dev/null || echo $BODY)"
else
  echo -e "${RED}❌ FAIL${NC} - HTTP $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 5: Check for exposed API keys in bundle
if [ "$BASE_URL" != "http://localhost:8080" ]; then
  echo "📝 Test 5: Checking for exposed API keys in production bundle"
  
  # Fetch main page
  MAIN_PAGE=$(curl -s "$BASE_URL")
  
  # Extract JS bundle URLs
  BUNDLE_URLS=$(echo "$MAIN_PAGE" | grep -oP '/_next/static/chunks/[^"]+\.js' | head -n 5)
  
  FOUND_KEYS=0
  for URL in $BUNDLE_URLS; do
    BUNDLE=$(curl -s "$BASE_URL$URL")
    
    # Check for sensitive keywords
    if echo "$BUNDLE" | grep -qi "qgwvsh5rwvtevey8zdh4bj13\|48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4"; then
      echo -e "${RED}❌ FAIL${NC} - Found exposed API key in: $URL"
      FOUND_KEYS=1
    fi
  done
  
  if [ $FOUND_KEYS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} - No API keys found in production bundles"
  fi
fi

echo ""
echo "🏁 Testing complete!"
