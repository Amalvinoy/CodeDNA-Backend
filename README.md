# Code DNA - Backend API

Production-ready backend API service for **Code DNA — The AI That Learns How You Code**.

---

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose
- **Validation**: Zod
- **Security**: Helmet, CORS, bcryptjs, jsonwebtoken

---

## Directory Structure

```text
backend/
├── src/
│   ├── config/          # Environment and database connection configurations
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication, validation, and error middlewares
│   ├── models/          # Mongoose data models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic and sub-engine layers
│   │   ├── ai/          # AI engine integrations (planned)
│   │   ├── analysis/    # Static and syntactic analysis (planned)
│   │   ├── dna/         # Developer DNA profiling engine (planned)
│   │   ├── risk/        # Code risk forecasting engine (planned)
│   │   ├── battle/      # Code battle comparison engine (planned)
│   │   └── historical/  # Historical review memory service (planned)
│   ├── types/           # Shared TypeScript interfaces & types
│   ├── utils/           # Utility functions & helpers
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express app setup and middleware configuration
│   └── server.ts        # Server entrypoint and graceful shutdown handling
├── scripts/             # Backend maintenance & migration scripts
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

---

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm run start
   ```

---

## Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "service": "code-dna-backend",
  "status": "healthy"
}
```
