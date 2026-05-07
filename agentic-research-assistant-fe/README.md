<!--
  // --- START MODIFICATION ---
  Polished README styling + quickstart runbook.
  // --- END MODIFICATION ---
-->

<p align="center">
  <a href="https://nextjs.org/" target="_blank">
    <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png" width="84" alt="Next.js Logo" />
  </a>
</p>

<h2 align="center">Agentic Research Assistant — Frontend</h2>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/next-16-black?logo=next.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black">
  <img alt="Mantine" src="https://img.shields.io/badge/mantine-ui-339AF0">
</p>

## Quickstart (dev)

### Prereqs
- Node.js 20+
- Backend running (see `agentic-research-assistant-be/README.md`)

### Environment

Create a local env file `agentic-research-assistant-fe/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run frontend

```bash
cd agentic-research-assistant-fe
npm install
npm run dev
```

Frontend URL (default): `http://localhost:3000`.

## Docker Compose note

Docker Compose in this repo is used for **backend dependencies** (Qdrant + embedding sidecar), not the Next.js frontend:

```bash
docker compose up -d qdrant py-embed
```

## Dev/Test vs Demo/Prod (backend URL)

// --- START MODIFICATION ---
- **Dev/Test**: point `NEXT_PUBLIC_API_URL` to your local NestJS backend (default `http://localhost:3001`).
- **Demo/Prod**: point `NEXT_PUBLIC_API_URL` to your deployed backend URL.

Tip: keep `NEXT_PUBLIC_API_URL` and backend `PORT` aligned to avoid silent CORS/connection failures.
// --- END MODIFICATION ---
