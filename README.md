# Bridge Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Монорепозиторий с общей типизацией между сервером и клиентом.

## 🏗️ Architecture

```
bridge-monorepo/
├── shared/           # Общие типы и интерфейсы
├── server/           # Node.js сервер (ESM + JSDoc)
├── client/           # React приложение (скоро)
└── package.json      # npm workspaces
```

## 🚀 Quick Start

```bash
git clone git@github.com:v-ain/bridge-monorepo.git
cd bridge-monorepo
npm install
npm run dev
```

## 📦 Packages

| Package | Description |
|---------|-------------|
| `@bridge-monorepo/shared` | Shared TypeScript types |
| `@bridge-monorepo/server` | Node.js server with JSDoc |

## 📝 License

MIT