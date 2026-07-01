# Encore

> **B2B Subscription Infrastructure Platform** — Powered by the Nomba API

Encore is a plug-and-play recurring revenue engine for Nigerian and African businesses. It handles billing, reconciliation, failed-payment recovery, automated payouts, and subscriber self-service — so merchants can focus on growth, not spreadsheets.

---

## Table of Contents

- [Overview](#overview)
- [Core Modules](#core-modules)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [Nomba API Integration](#nomba-api-integration)
- [Launch Phases](#launch-phases)
- [Documentation](#documentation)

---

## Overview

Across Nigeria and Africa, thousands of businesses — schools, gyms, SaaS companies, cooperatives, logistics firms — share one chronic pain: they cannot reliably collect recurring payments without enormous manual effort.

Encore solves this with a complete, automated billing infrastructure:

- **Automated billing** — charge cards and bank mandates on schedule, zero human involvement
- **Smart reconciliation** — one virtual account per subscriber; every transfer is auto-matched
- **Dunning & recovery** — structured retry flow that recovers failed payments automatically
- **Subscriber self-service** — white-labeled portal where subscribers manage their own plan
- **Split billing & payouts** — automated revenue splitting for marketplaces and cooperatives

> *Encore is to subscription billing what Shopify is to e-commerce — plug in and start collecting recurring revenue in minutes, not months.*

---

## Core Modules

| Module | Purpose |
|---|---|
| **Billing Engine** | Automated card & direct-debit charge scheduling |
| **Smart Reconciliation** | Per-subscriber virtual accounts via Nomba API |
| **Dunning & Recovery** | Structured retry flow on payment failure |
| **Flexible Plan Builder** | No-code plan configuration (fixed, tiered, usage-based) |
| **Subscriber Self-Service Portal** | White-labeled portal for subscribers |
| **Split Billing & Payouts** | Automated multi-party revenue distribution |

---

## Architecture

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │
│  Merchant Dashboard  │  Subscriber Portal│
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│            Application Layer            │
│  API Gateway  │  Billing Scheduler      │
│  Webhook Processor  │  Auth (JWT)       │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Data & Services Layer           │
│  PostgreSQL (TypeORM)  │  Bull / Redis  │
│  Notification Service  │  PDF Invoices  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│            Nomba API                    │
│  Tokenized Payments  │  Direct Debits   │
│  Virtual Accounts    │  Transfers       │
└─────────────────────────────────────────┘
```

See [`doc/encore_architecture.png`](./doc/encore_architecture.png) for the full architecture diagram.

---

## Tech Stack

### Backend (`apps/backend`)

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) v11 |
| Language | TypeScript |
| Database | PostgreSQL via [TypeORM](https://typeorm.io/) |
| Job Queue | [Bull](https://github.com/OptimalBits/bull) + Redis |
| Auth | Passport.js — JWT + Google OAuth 2.0 |
| Email | SendGrid / MailerSend / Nodemailer |
| PDF Invoices | PDFKit |
| File Storage | MinIO |
| Security | Helmet, Throttler, Bcrypt |
| Testing | Jest + Supertest |

### Frontend (`apps/client`)

| Layer | Technology |
|---|---|
| Framework | [React](https://react.dev/) v19 + [Vite](https://vite.dev/) v8 |
| Language | TypeScript |
| Routing | React Router DOM v7 |
| State Management | [Zustand](https://zustand-demo.pmnd.rs/) |
| Server State | [TanStack Query](https://tanstack.com/query) v5 |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Icons | Lucide React |
| Toasts | React Hot Toast |

---

## Project Structure

```
encore/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/          # Application source
│   │   ├── test/         # e2e tests
│   │   └── package.json
│   └── client/           # React + Vite frontend
│       ├── src/          # Application source
│       ├── public/       # Static assets
│       └── package.json
├── .cursorrules          # Cursor AI rules
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v10+
- **PostgreSQL** v15+
- **Redis** v7+ (for Bull job queues)

### Environment Variables

Copy the example env file in the backend and fill in your values:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Key variables to configure in `apps/backend/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NOMBA_API_KEY` | Your Nomba API key |
| `NOMBA_BASE_URL` | Nomba API base URL |
| `SENDGRID_API_KEY` | SendGrid API key for email |
| `REDIS_URL` | Redis connection URL for Bull queues |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Running Locally

**1. Install dependencies**

```bash
# Backend
cd apps/backend && npm install

# Frontend
cd apps/client && npm install
```

**2. Start the backend**

```bash
cd apps/backend
npm run start:dev
```

The API will be available at `http://localhost:3000`.

**3. Start the frontend**

```bash
cd apps/client
npm run dev
```

The client will be available at `http://localhost:5173`.

---

## Available Scripts

### Backend (`apps/backend`)

| Script | Description |
|---|---|
| `npm run start:dev` | Start in watch mode (development) |
| `npm run start:prod` | Start production build |
| `npm run build` | Compile to `dist/` |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm run kill-port` | Kill process on port 3000 |

### Frontend (`apps/client`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Nomba API Integration

Encore uses the Nomba API for all money movement. No payment data is stored on Encore's servers — all card tokens and mandate references live within Nomba.

| Encore Feature | Nomba API Endpoint |
|---|---|
| Card-on-file billing | `POST /v1/checkout/tokenized-card-payment` |
| Bank debit subscription | `POST /v1/direct-debits` + `POST /v1/direct-debits/debit-mandate` |
| Per-subscriber virtual account | `POST /v1/virtual-accounts/create` |
| Split collection | Sub-accounts + `splitRequest` on checkout |
| Automated payout | `POST /v2/transfers/bank` |
| Payment events (dunning trigger) | Webhook listener |
| Mandate status | `GET /v1/direct-debits/status?mandateId=` |
| Transaction reconciliation | `GET /v1/transactions` |

---

## Launch Phases

| Phase | Scope | Target |
|---|---|---|
| **Phase 1** — Foundation | Billing Engine, Smart Reconciliation, basic dashboard, webhooks | Months 1–3 |
| **Phase 2** — Retention | Dunning Engine, Subscriber Portal, invoices, notifications | Months 4–6 |
| **Phase 3** — Growth | Flexible Plans, Split Billing, white-label portal, analytics | Months 7–9 |
| **Phase 4** — Scale | Multi-currency, developer API, marketplace templates | Months 10–12 |

---

*Encore — v1.0 — 1st July 2026 — Powered by Nomba API*
*Developed by Emmanuel Kolawole*
