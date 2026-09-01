# EcoSphere Frontend

React frontend for the EcoSphere ESG Management Platform.

## Local development

```bash
corepack pnpm install
corepack pnpm run dev
```

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` when the backend API is available.

If pnpm is not installed globally but dependencies are already present, start Vite directly:

```powershell
node .\node_modules\vite\bin\vite.js
```

## Current routes

- `/login` — common authentication interface
- `/org/dashboard` — organization console overview
- `/app/dashboard` — employee portal home

<<<<<<< HEAD
The login page also provides clearly labelled frontend-preview links while authentication is not connected. Business metrics start at zero or “Not calculated” and are never fabricated.
=======
Authentication is connected to the EcoSphere API. Protected routes require a JWT, and business metrics start at zero or “Not calculated” rather than using fabricated values.
>>>>>>> poshika/final-integration
