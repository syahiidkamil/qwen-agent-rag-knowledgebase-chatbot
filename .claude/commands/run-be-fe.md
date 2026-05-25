run in the background using bash background

1. the BE @repos/fast-api-backend on port 3081 — `uvicorn app.main:app --reload --port 3081` (use `--reload` for hot reload on file change)
2. the FE @repos/react-vite-frontend on port 5181 — `npm run dev` (Vite already gives hot reload; port is pinned in `vite.config.ts`)

The FE reads `VITE_API_URL=http://localhost:3081` from `.env` to call the BE.
