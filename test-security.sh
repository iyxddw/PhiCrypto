#!/usr/bin/env bash

# PhiCrypto Security Test Script
# Tests various security improvements to ensure they work correctly

echo "🔐 PhiCrypto Security Tests"
echo "=========================="

SERVER_URL="http://localhost:8080"

# Test 1: Unauthenticated access should redirect to password page
echo "Test 1: Testing unauthenticated access..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/")
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Unauthenticated access properly handled"
else
    echo "❌ Unexpected response code: $RESPONSE"
fi

# Test 2: Check if encrypt/decrypt endpoints require authentication
echo "Test 2: Testing encryption endpoint without auth..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SERVER_URL/encrypt" \
    -H "Content-Type: application/json" \
    -d '{"text":["test"]}')
if [ "$RESPONSE" = "401" ]; then
    echo "✅ Encryption endpoint properly protected"
else
    echo "❌ Encryption endpoint not properly protected (code: $RESPONSE)"
fi

echo "Test 3: Testing decryption endpoint without auth..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SERVER_URL/decrypt" \
    -H "Content-Type: application/json" \
    -d '{"text":["test"]}')
if [ "$RESPONSE" = "401" ]; then
    echo "✅ Decryption endpoint properly protected"
else
    echo "❌ Decryption endpoint not properly protected (code: $RESPONSE)"
fi

# Test 4: Test invalid password attempts
echo "Test 4: Testing invalid password handling..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/check-password" \
    -H "Content-Type: application/json" \
    -d '{"password":"wrongpassword"}')
if echo "$RESPONSE" | grep -q '"success":false'; then
    echo "✅ Invalid password properly rejected"
else
    echo "❌ Invalid password not properly handled"
fi

# Test 5: Test valid password
echo "Test 5: Testing valid password..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/check-password" \
    -H "Content-Type: application/json" \
    -d '{"password":"luobo233"}')
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Valid password accepted"
else
    echo "❌ Valid password not accepted"
fi

# Test 6: Check security headers
echo "Test 6: Testing security headers..."
HEADERS=$(curl -s -I "$SERVER_URL/")
if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
    echo "✅ Security headers present"
else
    echo "❌ Security headers missing"
fi

echo "=========================="
echo "🎉 Security tests completed!"