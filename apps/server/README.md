# Sahyogi Server

Express JavaScript API for the publishing platform.

## Architecture

```txt
src/
  modules/        feature modules: auth, users, publications, posts, dashboard
  configs/        env, database, cloudinary, swagger
  constants/      HTTP and cookie constants
  middlewares/    auth, validation, rate limiting, error handling
  routes/         API route composition
  validators/     shared request validation helpers
  utils/          framework-neutral helpers
  docs/           API contract notes
  tests/          Vitest + Supertest integration tests
```

Request flow:

```txt
Route -> Validator -> Controller -> Service -> Repository -> Model
```

## Commands

```bash
npm run dev -w @sahyogi/server
npm run test:run -w @sahyogi/server
npm run build -w @sahyogi/server
npm run seed:demo -w @sahyogi/server
```

## Environment

Copy `.env.example` to `.env` and fill production secrets. `MONGO_URI` is the
single MongoDB variable used by the API.

Required production variables:

```txt
PORT
MONGO_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
CLIENT_URL
API_PUBLIC_URL
ENABLE_SWAGGER
TRUST_PROXY
NODE_ENV
```

Keep `ENABLE_SWAGGER=false` in production unless the docs route should be
public. Set `TRUST_PROXY=true` only behind a trusted platform proxy.

Older deployments that already define `JWT_SECRET` still work. New deployments
should prefer separate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values.

Cloudinary variables power authenticated image uploads through `/api/uploads/image`.

## Demo Seed

The optional demo seed creates one writer, one publication, published posts, one
draft, and sample subscribers for local verification.

Set these local-only values in `apps/server/.env` before running it:

```txt
DEMO_USER_EMAIL=demo.writer@example.com
DEMO_USER_PASSWORD=replace-with-local-demo-password
```

Then run:

```bash
npm run seed:demo -w @sahyogi/server
```

The seed is idempotent and refuses to run when `NODE_ENV=production`.
