# Bridge Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React.js-19-blue.svg)](https://react.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-red.svg)](https://pmnd.rs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A lightweight, production-ready Fullstack Monorepo environment built on **npm workspaces**. This project features a unified ecosystem with a Single Source of Truth for data structures and end-to-end type safety between the client and server.

---

## 💎 Key Engineering Features

*   **Strict API Contracts:** Driven by discriminated unions for server responses (`ApiResponse<T>`), shifting connectivity bugs from runtime to compile-time.
*   **Return-on-Error Pattern:** The frontend network client safely handles errors as strongly-typed data.
*   **Shared Validation Layer:** Data schemas are declared once using **Zod** in a centralized package.
*   **Zero-Overhead Persistence:** Custom JSON-file storage managed directly via native File System (FS) modules.
*   **Clean Architecture:** Strict decoupled layers (**Controller -> Service -> Data Access**) using native ESM and JSDoc.

---

## 🏗️ Monorepo Structure

```text
bridge-monorepo/
│
├── shared/   # Single Source of Truth: Zod schemas & types
├── server/   # Pure Node.js REST API (ESM + JSDoc + Native FS)
├── client/   # React (TypeScript) SPA app + Zustand
├── package.json  # Root config & npm workspaces
└── README.md
```

---

## 📦 Workspace Packages

| Package | Directory | Description |
| :--- | :--- | :--- |
| **@bridge-monorepo/shared** | `/shared` | Shared contracts, types, Zod schemas |
| **@bridge-monorepo/server** | `/server` | Pure Node.js, stream-based, no-db backend |
| **@bridge-monorepo/client** | `/client` | High-performance React SPA |

---

## 🚀 Quick Start

1. **Clone & Install:**
   ```bash
   git clone git@github.com:v-ain/bridge-monorepo.git
   cd bridge-monorepo
   npm install
   ```

2. **Run Application:**
   ```bash
   npm run dev
   ```

---

## ⚙️ Development Scripts

*   `npm run dev` — Launch backend & frontend concurrently.
*   `npm run check-types` — Run TypeCheck across all workspaces.

---

## 📝 License
Distributed under the MIT License.
