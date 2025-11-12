#!/bin/bash
# ForeignEye API 기능 테스트 스크립트

BASE_URL="http://localhost:5000/api/v1"
TOKEN=""

echo "======================================"
echo "ForeignEye API Functionality Test"
echo "======================================"
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 결과 카운터
PASSED=0
FAILED=0

# 테스트 함수
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local auth_required="$6"
    
    echo -n "Testing: $name ... "
    
    if [ "$auth_required" = "true" ]; then
        if [ -z "$TOKEN" ]; then
            echo -e "${RED}SKIPPED (No token)${NC}"
            return
        fi
        HEADERS="-H 'Authorization: Bearer $TOKEN'"
    else
        HEADERS=""
    fi
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" $HEADERS "$BASE_URL$endpoint")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" $HEADERS \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    STATUS=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$STATUS" = "$expected_status" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $STATUS)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $STATUS)"
        echo "Response: $BODY"
        FAILED=$((FAILED + 1))
    fi
}

echo "Step 1: Authentication Tests"
echo "------------------------------"

# 회원가입 (테스트 사용자)
TIMESTAMP=$(date +%s)
TEST_USER="testuser_$TIMESTAMP"
test_endpoint "Register" "POST" "/auth/register" \
    '{"username":"'$TEST_USER'","email":"'$TEST_USER'@test.com","password":"Test123!","password_confirm":"Test123!"}' \
    "201" "false"

# 로그인
echo -n "Testing: Login ... "
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"'$TEST_USER'","password":"Test123!"}')

STATUS=$(echo "$LOGIN_RESPONSE" | jq -r '.success')
if [ "$STATUS" = "true" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token')
    echo -e "${GREEN}PASSED${NC}"
    echo "Token: ${TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC}"
    echo "Response: $LOGIN_RESPONSE"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "Step 2: Article API Tests"
echo "------------------------------"

# 기사 목록 조회 (인증 불필요)
test_endpoint "Get Articles" "GET" "/articles?page=1&limit=5" "" "200" "false"

# 기사 상세 조회 (인증 필요)
# 먼저 기사 ID 가져오기
ARTICLE_ID=$(curl -s "$BASE_URL/articles?page=1&limit=1" | jq -r '.data.items[0].article_id')
if [ "$ARTICLE_ID" != "null" ] && [ ! -z "$ARTICLE_ID" ]; then
    test_endpoint "Get Article Detail" "GET" "/articles/$ARTICLE_ID" "" "200" "true"
else
    echo -e "${YELLOW}WARNING: No articles in database${NC}"
fi

echo ""
echo "Step 3: Collection API Tests"
echo "------------------------------"

# 개념 수집
# 먼저 개념 ID 가져오기
if [ "$ARTICLE_ID" != "null" ] && [ ! -z "$ARTICLE_ID" ]; then
    CONCEPT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/articles/$ARTICLE_ID" | jq -r '.data.article.graph.nodes[0].id')
    
    if [ "$CONCEPT_ID" != "null" ] && [ ! -z "$CONCEPT_ID" ]; then
        test_endpoint "Collect Concept" "POST" "/collections/concepts" \
            '{"concept_id":'$CONCEPT_ID'}' "201" "true"
    else
        echo -e "${YELLOW}WARNING: No concepts in article${NC}"
    fi
fi

# 내 컬렉션 조회
test_endpoint "Get My Collections" "GET" "/collections/concepts" "" "200" "true"

echo ""
echo "Step 4: Search API Tests"
echo "------------------------------"

# 단일 개념 검색
test_endpoint "Search by Concept" "GET" "/search/articles_by_concept?concept_name=AI" "" "200" "true"

# 다중 개념 검색
test_endpoint "Search by Multiple Concepts" "GET" \
    "/search/articles_by_multiple_concepts?concepts=AI,Machine%20Learning" "" "200" "true"

echo ""
echo "Step 5: Knowledge Map API Tests"
echo "------------------------------"

# 지식 맵 조회
test_endpoint "Get Knowledge Map" "GET" "/knowledge-map" "" "200" "true"

echo ""
echo "Step 6: Error Handling Tests"
echo "------------------------------"

# 존재하지 않는 기사
test_endpoint "404 Test - Non-existent Article" "GET" "/articles/99999" "" "404" "true"

# 인증 없이 보호된 엔드포인트 접근
test_endpoint "401 Test - Unauthorized" "GET" "/collections/concepts" "" "401" "false"

# 최종 결과
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo "======================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
