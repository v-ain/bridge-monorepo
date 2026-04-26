#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

BASE_URL="http://192.168.0.101:3000"
NOTES_URL="$BASE_URL/notes"

echo "=== Server API Tests ==="
echo ""

# ========== CREATE TESTS ==========
echo "📝 CREATE TESTS"

# Тест 1: Создание заметки
echo -n "  POST /notes (valid)..."
TEST_FILE="test_note.txt"
echo '{"content": "Текст с \"кавычками\""}' > $TEST_FILE
#echo "Тестовая заметка с кириллицей" > $TEST_FILE
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

# 1. Создаем заметку (передаем JSON)
RESPONSE=$(curl -s -X POST $NOTES_URL \
     -H "Content-Type: application/json" \
     -d '{"content": "test note for get"}')

# 2. Извлекаем UUID (ищем строку в кавычках после "id":)
# Это регулярка вытащит что-то вроде 550e8400-e29b-41d4-a716-446655440000
ID=$(echo $RESPONSE | grep -oE '"id":"([^"]+)"' | cut -d'"' -f4)

if [ -n "$ID" ]; then
    # 3. Проверяем получение по ID
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL/$ID)

    if [ "$STATUS" -eq 200 ]; then
        echo -e " ${GREEN}OK (200)${NC}"
    else
        echo -e " ${RED}FAIL (expected 200, got $STATUS, ID: $ID)${NC}"
    fi

    # Удаляем за собой тестовую заметку
    curl -s -X DELETE $NOTES_URL/$ID > /dev/null
else
    echo -e " ${RED}FAIL (could not extract UUID from response)${NC}"
    echo "Response was: $RESPONSE"
fi


# Тест 5: GET /notes/:id (несуществующая)
echo -n "  GET /notes/99999 (non-existent)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL/99999)
if [ "$STATUS" -eq 404 ]; then
    echo -e " ${GREEN}OK (404)${NC}"
else
    echo -e " ${RED}FAIL (expected 404, got $STATUS)${NC}"
fi

# Тест 6: GET /notes/not-an-uuid (несуществующий)
echo -n "  GET /notes/some-random-id (not found)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $NOTES_URL/some-random-id)

if [ "$STATUS" -eq 404 ]; then
    echo -e " ${GREEN}OK (404)${NC}"
else
    echo -e " ${RED}FAIL (expected 404, got $STATUS)${NC}"
fi


# ========== DELETE TESTS ==========
echo ""
echo "🗑️ DELETE TESTS"

# Тест 7: DELETE /notes/:id (существующая)
echo -n "  DELETE /notes/:id (existing)..."

# 1. Создаем заметку (через JSON)
RESPONSE=$(curl -s -X POST $NOTES_URL \
     -H "Content-Type: application/json" \
     -d '{"content": "to_delete"}')

# 2. Достаем UUID (строку в кавычках)
ID=$(echo $RESPONSE | grep -oE '"id":"([^"]+)"' | cut -d'"' -f4)

if [ -n "$ID" ]; then
    # 3. Удаляем
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $NOTES_URL/$ID)
    if [ "$STATUS" -eq 200 ]; then
        echo -e " ${GREEN}OK (200)${NC}"
    else
        echo -e " ${RED}FAIL (expected 200, got $STATUS)${NC}"
    fi
else
    echo -e " ${RED}FAIL (could not extract ID from response)${NC}"
fi


# Тест 8: DELETE /notes/:id (несуществующая)
echo -n "  DELETE /notes/99999 (non-existent)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $NOTES_URL/99999)
if [ "$STATUS" -eq 404 ]; then
    echo -e " ${GREEN}OK (404)${NC}"
else
    echo -e " ${RED}FAIL (expected 404, got $STATUS)${NC}"
fi

# Тест 9: DELETE /notes/:id (несуществующий/неверный формат)
echo -n "  DELETE /notes/abc (not found)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $NOTES_URL/abc)

# Теперь мы ожидаем 404, так как 'abc' — это валидная строка, но такой заметки нет
if [ "$STATUS" -eq 404 ]; then
    echo -e " ${GREEN}OK (404)${NC}"
else
    echo -e " ${RED}FAIL (expected 404, got $STATUS)${NC}"
fi

# ========== PATCH TESTS ==========
# Тест 8: PATCH /notes/:id (редактирование)
echo -n "  PATCH /notes/:id (update content)..."

# Создаем заметку
RESPONSE=$(curl -s -X POST $NOTES_URL -H "Content-Type: application/json" -d '{"content": "original"}')
ID=$(echo $RESPONSE | grep -oE '"id":"([^"]+)"' | cut -d'"' -f4)

if [ -n "$ID" ]; then
    # Обновляем контент
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $NOTES_URL/$ID \
         -H "Content-Type: application/json" \
         -d '{"content": "updated content"}')

    if [ "$STATUS" -eq 200 ]; then
        echo -e " ${GREEN}OK (200)${NC}"
    else
        echo -e " ${RED}FAIL (expected 200, got $STATUS)${NC}"
    fi

    # Чистим за собой
    curl -s -X DELETE $NOTES_URL/$ID > /dev/null
else
    echo -e " ${YELLOW}SKIP (could not create note)${NC}"
fi

echo ""
echo -e "${GREEN}=== Tests complete ===${NC}"
