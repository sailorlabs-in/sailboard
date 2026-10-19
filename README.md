# ⛵ Sailboard — Collaborative Engineering Whiteboard & Architecture Canvas

Sailboard is a production-grade collaborative engineering canvas combining **Eraser**-style Markdown documentation with **Excalidraw**-style infinite whiteboarding, live multiplayer collaboration, folder-based project hierarchies, and granular role-based permissions (`Owner`, `Editor`, `Viewer`).

---

## 🚀 Key Features

1. **Eraser + Excalidraw Synergy**:
   - Dual split-view with synchronized Markdown notes and infinite vector canvas.
   - Hand-drawn sketchy style powered by **Rough.js** or crisp architectural rendering.
   - Diagram-from-doc generation, shape drawing, sticky notes, connecting arrows, and 8-point resize handles.
   - Minimap with real-time viewport tracking.

2. **Folder-Style Projects & Multi-File Architecture**:
   - Projects act as workspaces containing multiple whiteboard files (e.g. `File A: System Architecture`, `File B: Live Redis Data Flow`, `File C: Sprint Retrospective`).
   - Seamlessly switch between files without leaving your active workspace.
   - Create, rename, and manage whiteboard files inside each project folder.

3. **Role-Based Sharing & Permissions**:
   - **Owner**: Full administrative control, delete project, manage and invite members.
   - **Editor**: Real-time collaborative editing on canvas and notes; edits broadcast live.
   - **Viewer**: Read-only view with real-time live synchronization of changes made by active editors.

4. **Real-Time Multiplayer Collaboration**:
   - Concurrent live editing between multiple online users.
   - Live presence indicator with colored cursors and name labels.
   - Socket.io bidirectional events backed by **Redis Pub/Sub** for horizontal scale.
   - Persistent storage in **PostgreSQL** via **TypeORM**.

5. **Authentication & Quick Profiles**:
   - Secure JWT authentication with `bcryptjs` password hashing.
   - Pre-seeded demo accounts:
     - **Alice (Owner)**: `alice@sailboard.io` / `password123`
     - **Bob (Collaborator)**: `bob@sailboard.io` / `password123`

---

## 🏗️ Architecture & Technology Stack

- **Monorepo**: [Nx](https://nx.dev)
- **Frontend (`apps/web`)**: React 19, TypeScript, Material-UI (MUI v6), Rough.js, Socket.io Client, Vite
- **Backend (`apps/api`)**: Nest.js, TypeORM, PostgreSQL, Redis Pub/Sub, Socket.io Gateway
- **Shared Types (`libs/shared-types`)**: Shared interfaces and data transfer objects

---

## 🛠️ Getting Started

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sailboard?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3333
JWT_SECRET=sailboard_super_secret_jwt_key_2026
NODE_ENV=development
```

### 2. Run Locally
```bash
# Start backend API (Nest.js on :3333)
npx tsx apps/api/src/main.ts

# Start frontend Web App (Vite on :5173)
npx vite apps/web --port 5173 --host
```

### 3. Build for Production
```bash
npx vite build apps/web
```
