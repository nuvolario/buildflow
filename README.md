# BuildFlow

Piattaforma PWA per la gestione di cantieri edili.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express.js (Node.js) su Vercel (serverless)
- **Database**: MySQL su Hostinger

## Struttura

```
buildflow/
├── frontend/     # Vite + React (deploy Hostinger)
├── backend/      # Express.js (deploy Vercel)
└── README.md
```

## Setup Locale

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configura .env con credenziali database
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deploy

- **Frontend**: Hostinger (via FTP)
- **Backend**: Vercel (auto-deploy da main)
- **Database**: MySQL Hostinger
