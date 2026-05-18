# Bridge Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React.js-19-blue.svg)](https://react.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-red.svg)](https://pmnd.rs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Fullstack-монорепозиторий на базе **npm workspaces** с единым источником правды для типов данных и сквозной валидацией между сервером и клиентом.

---

## 💎 Key Features

* **Strict API Contracts**: Дискриминируемые объединения для ответов сервера (`ApiResponse<T>`).
* **Return-on-Error Pattern**: Сетевой клиент на фронтенде поглощает исключения и возвращает типизированные ошибки как данные.
* **Shared Validation**: Валидация схем данных на базе **Zod**, общая для клиента и сервера.
* **Layered Architecture**: Чистое разделение на слои `Controller -> Service` на бэкенде.

---

## 🏗️ Monorepo Structure

```text
bridge-monorepo/
│
├── shared/       # Схемы Zod, строгие типы AppErrorCode и контракты ApiResponse
├── server/       # Node.js REST API (ESM + JSDoc / Service-Controller)
├── client/       # React (TypeScript) + Zustand state manager
└── package.json      # Root configuration & npm workspaces root
```

---

## 📦 Workspace Packages


| Package | Directory | Description | Technology Stack |
|---------|-----------|-------------|------------------|
| `@bridge-monorepo/shared` | `/packages/shared` | Общие контракты, типы и схемы | TypeScript, Zod |
| `@bridge-monorepo/server` | `/packages/server` | Легковесный Node.js сервер | pure Node.js, ESM, JSDoc |
| `@bridge-monorepo/client` | `/packages/client` | Клиентское SPA приложение | React, TypeScript, Zustand |

---

## 🚀 Quick Start

### Prerequisites
Убедитесь, что у вас установлена актуальная версия **Node.js** (LTS).

### Installation & Running
1. Клонируйте репозиторий и перейдите в корень проекта:
   ```bash
   git clone git@github.com:v-ain/bridge-monorepo.git
   cd bridge-monorepo
   ```
2. Установите зависимости для всех воркспейсов одновременно:
   ```bash
   npm install
   ```
3. Запустите проект в режиме разработки (сервер и клиент стартуют параллельно):
   ```bash
   npm run dev
   ```

---

## ⚙️ Scripts Reference

Все команды запускаются из корня монорепозитория:

* `npm run dev` — Запуск бэкенда и фронтенда параллельно в режиме watch.
* `npm run check-types` — Глобальная проверка типов TypeScript по всем пакетам.

---

## 📝 License

MIT

