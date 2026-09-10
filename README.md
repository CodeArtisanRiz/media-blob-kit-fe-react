# MediaBlobKit Frontend Dashboard (React + TS)

[![React](https://img.shields.io/badge/react-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

**MediaBlobKit Frontend Dashboard** is a modern, responsive administration control panel for **MediaBlobKit (Rust Backend)**. Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Shadcn UI**, it provides real-time monitoring and asset management across multi-tenant media projects.

---

## 🚀 Key Features

* **Authentication & Session Management**:
  * JWT Bearer authentication with automatic token refresh on `401 Unauthorized` responses (`POST /auth/refresh`).
  * Password visibility eye toggle, error feedback, and local session caching.
* **Multi-Tenant Project Manager**:
  * Project CRUD operations (`POST`, `GET`, `PUT`, `DELETE` `/projects`).
  * Visual & JSON variant preset rules configurator (`width`, `height`, `fit`, `format`, `quality`).
  * Project API Key provisioner with instant secret copy-to-clipboard button.
  * Manual variant regeneration trigger (`POST /projects/:id/sync-variants`).
* **Media Gallery & Per-Upload Variant Selection**:
  * Media asset grid with image thumbnails, file size formatters, and generated variant pill tags.
  * Presigned download link viewer (`GET /files/:id/content`).
  * File uploader modal with **per-upload variant checkboxes** (`POST /upload/image?variants=thumbnail,card`).
* **Real-Time SSE Job Monitor**:
  * Connects directly to backend Server-Sent Events stream (`GET /admin/jobs/events`).
  * Real-time metrics breakdown for `Pending`, `Processing`, `Completed`, and `Failed` rendering tasks.
  * Automatic polling fallback and payload inspection modal.
* **Superuser User Management**:
  * Provision Admin and User access accounts with role-based badges.
* **Mobile Responsive**:
  * Mobile header bar with logo home link and right hamburger menu button (`<Menu />`).
  * Slide-over drawer navigation with backdrop blur for small viewports.
  * IST (`Asia/Kolkata`) date and time formatting.

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root:

```env
# Backend API URL (Proxied in Vite / Nginx)
VITE_API_URL=/api
```

---

## 💻 Local Setup & Execution

### Prerequisites

- **Node.js** (v20+)
- **npm** (v10+)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`. API requests to `/api` are automatically proxied to the Rust backend running on `http://localhost:3000`.

### 3. Production Build

```bash
npm run build
```

Generates optimized static HTML, CSS, and JS bundles in the `dist/` directory.

---

## 🐳 Deployment with Docker

### Option 1: Docker Compose (1-Step Deployment)

Build and run the lightweight Nginx container (`nginx:alpine`, <20MB RAM) with a single command:

```bash
docker compose up -d --build
```

To stop the container:

```bash
docker compose down
```

### Option 2: Direct Docker CLI

```bash
# Build Docker image
docker build -t media-blob-kit-fe-react .

# Run Docker container
docker run -d \
  --name media-blob-kit-fe \
  -p 5173:80 \
  --restart unless-stopped \
  media-blob-kit-fe-react
```

---

## 📄 License

Copyright (C) 2025 CodeArtisanRiz. This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
