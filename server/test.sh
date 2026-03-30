#!/bin/bash

# Цвета (ANSI escape codes)
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color (сброс цвета)

# Настройки
URL="http://localhost:3000/notes"
TEST_FILE="test_note.txt"

echo "=== Запуск тестов для Хаба ==="

# 1. Создаем тестовый файл с кириллицей
echo "Привет из Bash! Тестируем кодировку и потоки." > $TEST_FILE

# 2. Тест: Обычная отправка (ждем 201 Created)
echo -n "Тест 1: Запись заметки... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $URL \
     -H "Content-Type: text/plain; charset=utf-8" \
     --data-binary "@$TEST_FILE")

if [ "$STATUS" -eq 201 ]; then
    echo -e "${GREEN}OK (201 Created)${NC}"
else
    echo -e "${RED}FAIL (Ожидали 201, получили $STATUS)${NC}"
fi

# 3. Тест: Проверка переполнения (создаем файл 2Мб)
echo -n "Тест 2: Проверка лимита (2MB)... "
dd if=/dev/zero of=big_file.txt bs=1M count=2 2>/dev/null
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $URL \
     --data-binary "@big_file.txt")

if [ "$STATUS" -eq 413 ]; then
    echo -e "${GREEN}OK (413 Payload Too Large)${NC}"
else
    echo -e "${RED}FAIL (Сервер принял лишнее: $STATUS)${NC}"
fi

# Чистка
rm $TEST_FILE big_file.txt
echo "=== Тесты завершены ==="
