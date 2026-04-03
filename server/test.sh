#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

BASE_URL="http://localhost:3000"
NOTES_URL="$BASE_URL/notes"

echo "=== Server API Tests ==="
echo ""

# ========== CREATE TESTS ==========
echo "📝 CREATE TESTS"

# Тест 1: Создание заметки
echo -n "  POST /notes (valid)..."
TEST_FILE="test_note.txt"
echo "Тестовая заметка с кириллицей" > $TEST_FILE
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $NOTES_URL \
     -H "Content-Type: text/plain; charset=utf-8" \
     --data-binary "@$TEST_FILE")
if [ "$STATUS" -eq 201 ]; then
    echo -e " ${GREEN}OK (201)${NC}"
else
    echo -e " ${RED}FAIL (expected 201, got $STATUS)${NC}"
fi
rm $TEST_FILE

# Тест 2: Защита от DoS (2MB payload)
echo -n "  POST /notes (2MB payload)..."
dd if=/dev/zero of=big_file.txt bs=1M count=2 2>/dev/null
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $NOTES_URL \
     --data-binary "@big_file.txt")
if [ "$STATUS" -eq 413 ]; then
    echo -e " ${GREEN}OK (413)${NC}"
else
    echo -e " ${RED}FAIL (expected 413, got $STATUS)${NC}"
fi
rm big_file.txt

# ========== READ TESTS ==========
echo ""
echo "📖 READ TESTS"

# Тест 3: GET /notes (список)
echo -n "  GET /notes (list)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL)
if [ "$STATUS" -eq 200 ]; then
    echo -e " ${GREEN}OK (200)${NC}"
else
    echo -e " ${RED}FAIL (expected 200, got $STATUS)${NC}"
fi

# Тест 4: GET /notes/:id (существующая)
echo -n "  GET /notes/:id (existing)..."
# Сначала создаем заметку
RESPONSE=$(curl -s -X POST $NOTES_URL -d "test")
ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL/$ID)
    if [ "$STATUS" -eq 200 ]; then
        echo -e " ${GREEN}OK (200)${NC}"
    else
        echo -e " ${RED}FAIL (expected 200, got $STATUS)${NC}"
    fi
    # Удаляем тестовую заметку
    curl -s -X DELETE $NOTES_URL/$ID > /dev/null
else
    echo -e " ${YELLOW}SKIP (could not create test note)${NC}"
fi

# Тест 5: GET /notes/:id (несуществующая)
echo -n "  GET /notes/99999 (non-existent)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL/99999)
if [ "$STATUS" -eq 404 ]; then
    echo -e " ${GREEN}OK (404)${NC}"
else
    echo -e " ${RED}FAIL (expected 404, got $STATUS)${NC}"
fi

# Тест 6: GET /notes/:id (неверный формат)
echo -n "  GET /notes/abc (invalid format)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL/abc)
if [ "$STATUS" -eq 400 ]; then
    echo -e " ${GREEN}OK (400)${NC}"
else
    echo -e " ${RED}FAIL (expected 400, got $STATUS)${NC}"
fi

# ========== DELETE TESTS ==========
echo ""
echo "🗑️ DELETE TESTS"

# Тест 7: DELETE /notes/:id (существующая)
echo -n "  DELETE /notes/:id (existing)..."
# Создаем заметку
RESPONSE=$(curl -s -X POST $NOTES_URL -d "to_delete")
ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$ID" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $NOTES_URL/$ID)
    if [ "$STATUS" -eq 200 ]; then
        echo -e " ${GREEN}OK (200)${NC}"
    else
        echo -e " ${RED}FAIL (expected 200, got $STATUS)${NC}"
    fi
else
    echo -e " ${YELLOW}SKIP (could not create test note)${NC}"
fi

# Тест 8: DELETE /notes/:id (несуществующая)
echo -n "  DELETE /notes/99999 (non-existent)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $NOTES_URL/99999)
if [ "$STATUS" -eq 404 ]; then
    echo -e " ${GREEN}OK (404)${NC}"
else
    echo -e " ${RED}FAIL (expected 404, got $STATUS)${NC}"
fi

# Тест 9: DELETE /notes/:id (неверный формат)
echo -n "  DELETE /notes/abc (invalid format)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $NOTES_URL/abc)
if [ "$STATUS" -eq 400 ]; then
    echo -e " ${GREEN}OK (400)${NC}"
else
    echo -e " ${RED}FAIL (expected 400, got $STATUS)${NC}"
fi

echo ""
echo "=== Tests complete ==="
