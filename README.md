# AfshinTaxi 🚖

A pre-booking city taxi system built with NestJS, PostgreSQL, and Nuxt 3.

## Project Structure

```
afshintaxi/
├── backend/        # NestJS API
└── frontend/       # Nuxt 3 + Vuetify
```

## Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | NestJS + TypeORM        |
| Database  | PostgreSQL              |
| Frontend  | Nuxt 3 + Vuetify 3      |
| Auth      | JWT + SMS 2FA           |
| Maps      | Google Maps API         |

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
