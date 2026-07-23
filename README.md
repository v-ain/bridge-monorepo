# Bridge Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React.js-19-blue.svg)](https://react.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-red.svg)](https://pmnd.rs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A zero-dependency, lightweight full-stack architecture built with a focus on maximum control, performance, and infrastructure security. By avoiding heavy third-party frameworks, this project serves as a highly scalable starter template for robust full-stack applications.

### 🛡️ Core Highlights:

* **Single Source of Truth:** Powered by `npm workspaces` for seamless dependency management and end-to-end type safety between the client and server via a standalone internal `@shared` package.
* **Pure Backend:** Built using the native Node.js HTTP module and asynchronous file system I/O, documented comprehensively with JSDoc to enforce runtime types without compilation overhead.
* **Custom Frontend Bundling:** Features a custom, fine-tuned Webpack and Babel configuration driving a React and Zustand Single Page Application (SPA).
* **DevOps & Infrastructure:** Fully containerized with production-ready, rootless multi-stage Dockerfiles. It implements process management via `tini` for graceful shutdowns, isolated data persistence using Named Volumes, and a high-performance Nginx web server configured with aggressive static asset caching and custom SPA routing.

---

## 💎 Key Engineering Features

### 🏛️ Architecture & Type Safety
* **Strict API Contracts:** Driven by discriminated unions for server responses (`ApiResponse<T>`), shifting connectivity bugs from runtime to compile-time.
* **Shared Validation Layer:** Data schemas are declared once using **Zod** in a centralized internal package and enforced across both backend and frontend layers.
* **Return-on-Error Pattern:** The custom frontend network client safely captures and processes runtime errors as strongly-typed data payloads instead of throwing untracked exceptions.
* **Strategy-Driven Custom Routing:** Engineered a lightweight Single Page Application (SPA) router from scratch using the **Strategy Pattern** paired with a reactive **Zustand** store, managing client-side navigation and view-switching logic efficiently without heavy routing frameworks.
* **Clean Decoupled Design:** Implements strict architectural layers (**Controller ➔ Service ➔ Repository**) using native ESM and explicit JSDoc typing for complete separation of concerns.


### ⚡ Vanilla Performance & Storage Engine
* **Atomic File Storage:** Engineered a high-performance, crash-safe state persistence engine using fast `O(1)` memory lookups paired with atomic file rewrites via native `fs.promises.rename` to prevent data corruption.
* **Zero-Dependency Configuration:** Built a lightweight, custom native `.env` parser from scratch used by both Webpack and the Node.js backend, completely avoiding third-party packages like `dotenv`.
* **Zero-Overhead Local State:** State management driven by a fine-tuned, ultra-lightweight **Zustand** store on the client, eliminating global context overhead.

### 🐋 Production-Ready DevOps & Security
* **Rootless Infrastructure:** Engineered production-grade, multi-stage Dockerfiles that completely strip out heavy development tools (like the TypeScript compiler) from the final runtime images.
* **Advanced Container Isolation:** Processes are moved away from the `root` user to restricted `node` and `nginx` accounts. Integrated `tini` as PID 1 to guarantee clean process management and `SIGTERM` compliance (Graceful Shutdown).
* **Enterprise-Ready Volumes:** Configured standalone Docker Named Volumes for seamless data persistence, optimized for rootless Podman contexts with full SELinux support via strict `:Z` flags.


---

## 🏗️ Architecture Overview

The repository follows a clean, decoupled workspaces topology using standard **NPM Workspaces**:

```text
.
├── apps/
│   ├── client/          # React + TS Frontend with custom Babel/Webpack build
│   └── server/          # Pure Node.js HTTP Backend (Zero framework overhead)
├── packages/
│   └── shared/          # Centralized validation schemas (Zod) and TypeScript types
├── docker-compose.yml   # Production orchestration config
└── .env.example         # Unified environment variables control center
```

---

### 📦 Workspace Packages

| Package | Directory | Description |
| :--- | :--- | :--- |
| **@bridge-monorepo/shared** | `packages/shared` | Centralized Zod validation schemas, API contracts, and shared TS types |
| **@bridge-monorepo/server** | `apps/server` | Pure Node.js HTTP engine, stream-based file storage repository, and atomic I/O |
| **@bridge-monorepo/client** | `apps/client` | High-performance React SPA driven by a custom Strategy-based Zustand router |


---

## ⚠️ Scalability Limits & Storage Architecture

This project deliberately utilizes a lightweight, file-based storage engine (`notes.json`) paired with an active in-memory cache to maintain maximum performance with zero external database overhead.

### 🔴 Critical Production Warning
This implementation is strictly **not design-hardened** for multi-process scalability (e.g., running multiple container replicas in Docker Swarm, Kubernetes, or a PM2 cluster sharing the same volume). 

Because synchronization relies on atomic file overwrites rather than enterprise-grade database transaction locking, executing multiple instances simultaneously will lead to **race conditions, data desynchronization, or write conflicts**.

#### Supported Scalability Matrix:
* 🛠️ **Supported (Single Instance):** 1 Container running 1 isolated Node.js process (Standard Docker Compose workflow).
* 🚫 **Unsupported (Multi-Instance):** Multiple backend containers, running Docker Compose concurrently with host-side `npm run dev`, or PM2 in `cluster` mode.

### 📈 Future Migration Roadmap
To facilitate horizontally scalable architectures and robust multi-user transactional guarantees, the system is prepared to pivot towards an abstract **Repository Pattern** backed by **SQLite** or **PostgreSQL** in upcoming iterations.

---

## Getting Started & Deployment

Ensure you are using **Node.js v22+**. The full-stack environment works straight out of the box with zero manual directory setups.

### 1. Installation & Initialization
Clone the repository and run a clean dependency tree install from the root:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory by copying the provided example:
```bash
cp .env.example .env
```
*Note: The default configuration is pre-tuned to work perfectly for standard `localhost` workflows.*

### 3. Run Development Environment
Boot up the entire stack concurrently (Shared compilation watcher, Backend HTTP server, and Webpack Dev Server):
```bash
npm run dev
```
* 🌐 **Frontend UI:** Accessible at `http://localhost:3001`
* 🔌 **Backend API:** Running at `http://localhost:3000`

### 📱 Testing on Mobile Devices (Wi-Fi Local Network)
Since the primary goal of this app is seamless cross-device note-taking, you can easily access the interface from your smartphone. Find your machine's local IP address (e.g., `192.168.1.50`) and update your root `.env` before booting the app:
```env
API_HOST=192.168.1.50
CORS_ORIGIN=http://192.168.1.50:3001
```
Our custom native config parser dynamically remaps the network endpoints, allowing your smartphone to bridge with the host backend securely over local Wi-Fi.

---

## 🐳 Production Deployment (Podman / Docker Compose)

The production stack is fully containerized, optimized for minimal layer sizes, and runs in rootless security mode.

### 1. Infrastructure Spin-Up
Launch the multi-stage build pipelines and initialize your persistent state volume using **Podman** (recommended for Fedora/Toolbox) or standard **Docker**:

```bash
# Using Podman (Fedora default)
podman-compose up --build

# Using standard Docker
docker-compose up --build
```
*The isolated production app will be up and running flawlessly at **`http://localhost:8080`** (served via Nginx).*

### 🔍 What happens under the hood during deployment:
1. **Isolated Shared Builder:** The multi-stage pipeline initializes a temporary build environment, installs development tools, compiles Zod schemas/TS types into optimized JavaScript, and caches them inside `packages/shared/dist`.
2. **Production-Grade Server:** The backend container strips away all `devDependencies` via `npm ci --omit=dev`, injects the pre-compiled shared modules, and hooks into your atomic local JSON state through secure, SELinux-mapped Docker Named Volumes.
3. **Optimized Nginx Frontend:** The Webpack/Babel pipeline strips types, tree-shakes dead code, and outputs a minimized production bundle. This static asset layer is delivered straight into a lightweight Alpine-Nginx instance configured with custom SPA routing and aggressive static asset caching.


## 📝 License
Distributed under the MIT License.
